import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmbeddings } from '@/lib/gemini';
import { FILE_SIZE_LIMITS } from '@/lib/security';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minuti per sync massiva

function chunkText(text: string, maxLen = 1500, overlap = 300): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxLen));
    i += maxLen - overlap;
  }
  return chunks;
}

// POST — sincronizza tutti i file in una cartella Google Drive dello studio
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 });

    const user = session.user;
    const isPremium = user.user_metadata?.is_premium === true;
    if (!isPremium) return NextResponse.json({ error: 'PREMIUM_REQUIRED' }, { status: 403 });

    const providerToken = session.provider_token;
    if (!providerToken) {
      return NextResponse.json({
        error: 'AUTH_SCOPES_MISSING',
        message: 'Token Google scaduto. Esegui il logout e accedi di nuovo con Google.',
      }, { status: 403 });
    }

    // Recupera lo studio dell'utente
    const { data: firm } = await supabase
      .from('law_firms')
      .select('id, name')
      .eq('owner_id', user.id)
      .single();

    if (!firm) return NextResponse.json({ error: 'Studio non trovato.' }, { status: 404 });

    const { folderId, folderName } = await req.json();
    if (!folderId) return NextResponse.json({ error: 'folderId obbligatorio.' }, { status: 400 });

    // Aggiorna la cartella Drive collegata allo studio
    await supabase
      .from('law_firms')
      .update({ drive_folder_id: folderId, drive_folder_name: folderName })
      .eq('id', firm.id);

    // Lista i file nella cartella (PDF, GDocs, TXT)
    const fileQuery = encodeURIComponent(
      `'${folderId}' in parents and (mimeType='application/pdf' or mimeType='application/vnd.google-apps.document' or mimeType='text/plain') and trashed=false`
    );
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${fileQuery}&pageSize=100&fields=files(id,name,mimeType)`,
      { headers: { Authorization: `Bearer ${providerToken}` } }
    );

    if (!listRes.ok) {
      return NextResponse.json({ error: 'Impossibile accedere alla cartella Drive.' }, { status: 500 });
    }

    const { files: allFiles = [] } = await listRes.json();

    // ── H2 FIX: Enforce batch limit to prevent DoS ────────────────────────
    const files = allFiles.slice(0, FILE_SIZE_LIMITS.FIRM_DRIVE_SYNC_BATCH);
    if (allFiles.length > FILE_SIZE_LIMITS.FIRM_DRIVE_SYNC_BATCH) {
      console.warn(`[Firm Drive Sync] Batch capped: ${allFiles.length} → ${files.length} file (limit: ${FILE_SIZE_LIMITS.FIRM_DRIVE_SYNC_BATCH})`);
    }
    console.log(`[*] Firm Drive Sync: Studio "${firm.name}" — ${files.length} file da sincronizzare in "${folderName}"`);

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        let rawText = '';

        if (file.mimeType === 'application/vnd.google-apps.document') {
          const exportRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
            { headers: { Authorization: `Bearer ${providerToken}` } }
          );
          if (!exportRes.ok) { errorCount++; continue; }
          rawText = await exportRes.text();
        } else {
          const downloadRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            { headers: { Authorization: `Bearer ${providerToken}` } }
          );
          if (!downloadRes.ok) { errorCount++; continue; }
          const fileBuffer = await downloadRes.arrayBuffer();

          if (file.mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            const buffer = Buffer.from(fileBuffer);
            const pdfData = await pdfParse(buffer);
            rawText = pdfData.text.replace(/\s+/g, ' ');
          } else {
            rawText = new TextDecoder('utf-8').decode(fileBuffer);
          }
        }

        rawText = rawText.substring(0, FILE_SIZE_LIMITS.FIRM_DRIVE_SYNC_CHARS);
        const sizeBytes = new Blob([rawText]).size;

        // Inserisci o aggiorna documento (upsert per evitare duplicati)
        const { data: docRecord, error: docError } = await supabase
          .from('user_documents')
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_type: file.mimeType,
            size_bytes: sizeBytes,
            raw_content: rawText,
          })
          .select('id')
          .single();

        if (docError || !docRecord) { errorCount++; continue; }

        const chunks = chunkText(rawText);
        const chunkInserts = [];

        for (let i = 0; i < chunks.length; i++) {
          try {
            const embedding = await getEmbeddings(chunks[i]);
            chunkInserts.push({
              document_id: docRecord.id,
              chunk_index: i,
              content: chunks[i],
              embedding,
            });
          } catch {
            // skip embedding errors silently
          }
        }

        if (chunkInserts.length > 0) {
          await supabase.from('user_document_chunks').insert(chunkInserts);
        }

        successCount++;
        console.log(`  [✓] Sincronizzato: ${file.name} (${chunkInserts.length} chunks)`);

      } catch (fileErr) {
        console.error(`  [✗] Errore su ${file.name}:`, fileErr);
        errorCount++;
      }
    }

    // Aggiorna statistiche studio
    await supabase
      .from('law_firms')
      .update({ documents_synced: successCount, last_synced_at: new Date().toISOString() })
      .eq('id', firm.id);

    console.log(`[*] Firm Drive Sync Completata: ${successCount} successi, ${errorCount} errori`);

    return NextResponse.json({
      success: true,
      files_found: files.length,
      documents_synced: successCount,
      errors: errorCount,
    });

  } catch (err) {
    console.error('[/api/firm/drive-sync POST]', err);
    return NextResponse.json({ error: 'Errore interno durante la sincronizzazione.' }, { status: 500 });
  }
}
