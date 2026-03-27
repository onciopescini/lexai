// Phase 16: Updated import-drive route — accepts optional `scope` field
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmbeddings } from '@/lib/gemini';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function chunkText(text: string, maxLen = 1500, overlap = 300): string[] {
  if (!text) return [];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxLen));
    i += maxLen - overlap;
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Utente non autorizzato.' }, { status: 401 });
    }

    const user = session.user;
    const isPremium = user.user_metadata?.is_premium === true;

    if (!isPremium) {
      return NextResponse.json({ error: 'PREMIUM_REQUIRED' }, { status: 403 });
    }

    const providerToken = session.provider_token;
    if (!providerToken) {
      return NextResponse.json({
        error: 'AUTH_SCOPES_MISSING',
        message: 'Token Google scaduto. Esci e rientra con Google.',
      }, { status: 403 });
    }

    // ── Phase 16: Read scope from body ─────────────────────────────────────
    const { fileId, fileName, mimeType, scope: rawScope } = await req.json();
    const scope = rawScope === 'firm' ? 'firm' : 'personal';

    if (!fileId || !fileName) {
      return NextResponse.json({ error: 'fileId e fileName sono richiesti.' }, { status: 400 });
    }

    // Verify firm membership if uploading to firm scope
    let firmId: string | null = null;
    if (scope === 'firm') {
      const { data: membership } = await supabase
        .from('firm_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!membership) {
        return NextResponse.json({ error: 'Non sei membro di nessuno studio.' }, { status: 403 });
      }
      firmId = membership.firm_id;
    }

    let fileBuffer: ArrayBuffer | null = null;
    let rawText = '';

    console.log(`[*] Drive Import [scope=${scope}]: ${fileName} (${mimeType})`);

    if (mimeType === 'application/vnd.google-apps.document') {
      const exportRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
        { headers: { Authorization: `Bearer ${providerToken}` } }
      );
      if (!exportRes.ok) {
        return NextResponse.json({ error: 'Impossibile esportare il Google Doc.' }, { status: 500 });
      }
      rawText = await exportRes.text();
    } else {
      const downloadRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${providerToken}` } }
      );
      if (!downloadRes.ok) {
        return NextResponse.json({ error: 'Impossibile scaricare il file.' }, { status: 500 });
      }
      fileBuffer = await downloadRes.arrayBuffer();

      if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
        const pdfData = await pdfParse(Buffer.from(fileBuffer));
        rawText = pdfData.text.replace(/\s+/g, ' ');
      } else if (mimeType === 'text/plain' || fileName.toLowerCase().endsWith('.txt')) {
        rawText = new TextDecoder('utf-8').decode(fileBuffer);
      } else {
        return NextResponse.json({ error: 'Formato non supportato. Usa Google Docs, PDF o TXT.' }, { status: 400 });
      }
    }

    rawText = rawText.substring(0, 100000);
    const sizeBytes = fileBuffer ? fileBuffer.byteLength : new Blob([rawText]).size;

    const { data: docRecord, error: docError } = await supabase
      .from('user_documents')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_type: mimeType || 'application/octet-stream',
        size_bytes: sizeBytes,
        raw_content: rawText,
        scope,
        firm_id: firmId,
      })
      .select('id')
      .single();

    if (docError || !docRecord) {
      return NextResponse.json({ error: 'Errore salvataggio documento.' }, { status: 500 });
    }

    const documentId = docRecord.id;
    const chunks = chunkText(rawText, 1500, 300);

    const chunkInserts = [];
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await getEmbeddings(chunks[i]);
        chunkInserts.push({ document_id: documentId, chunk_index: i, content: chunks[i], embedding });
      } catch (err) {
        console.warn(`[!] Skipping chunk ${i}:`, err);
      }
    }

    if (chunkInserts.length > 0) {
      await supabase.from('user_document_chunks').insert(chunkInserts);
    }

    return NextResponse.json({
      success: true,
      document_id: documentId,
      scope,
      message: scope === 'firm' ? 'Documento importato nello Spazio Studio.' : 'Documento importato nel tuo Spazio Personale.',
      chunks_processed: chunkInserts.length,
    });

  } catch (error: unknown) {
    console.error('API Import Drive Error:', error);
    return NextResponse.json({ error: 'Errore imprevisto durante l\'importazione.' }, { status: 500 });
  }
}
