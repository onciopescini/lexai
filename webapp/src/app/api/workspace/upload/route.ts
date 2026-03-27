// Phase 16: Updated upload route — accepts optional `scope` field
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED', message: 'Devi effettuare l\'accesso.' }, { status: 401 });
    }

    const isPremium = user.user_metadata?.is_premium === true;
    if (!isPremium) {
      return NextResponse.json({ error: 'PREMIUM_REQUIRED', message: 'Il caricamento è riservato agli utenti Premium.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Il file supera il limite di 5MB.' }, { status: 400 });
    }

    // ── Phase 16: Read scope from form data ───────────────────────────────
    const rawScope = formData.get('scope') as string | null;
    const scope = rawScope === 'firm' ? 'firm' : 'personal';

    // If uploading to firm scope, verify user is admin of a firm
    let firmId: string | null = null;
    if (scope === 'firm') {
      const { data: membership } = await supabase
        .from('firm_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('role', ['admin', 'member'])
        .single();

      if (!membership) {
        return NextResponse.json({ error: 'Non sei membro di nessuno studio.' }, { status: 403 });
      }
      firmId = membership.firm_id;
    }

    let rawText = '';

    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      rawText = pdfData.text.replace(/\s+/g, ' ');
    } else if (file.type === 'text/plain') {
      rawText = await file.text();
    } else {
      return NextResponse.json({ error: 'Formato non supportato. Carica un PDF o .txt.' }, { status: 400 });
    }

    rawText = rawText.substring(0, 100000);

    console.log(`[*] Workspace Upload [scope=${scope}]: ${file.name} per ${user.id} (${rawText.length} chars)`);

    const { data: docRecord, error: docError } = await supabase
      .from('user_documents')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        size_bytes: file.size,
        raw_content: rawText,
        scope,
        firm_id: firmId,
      })
      .select('id')
      .single();

    if (docError || !docRecord) {
      return NextResponse.json({ error: 'Errore salvataggio documento.', details: docError?.message }, { status: 500 });
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
      const { error: chunkError } = await supabase.from('user_document_chunks').insert(chunkInserts);
      if (chunkError) {
        return NextResponse.json({ error: 'Errore salvataggio frammenti.', details: chunkError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      document_id: documentId,
      scope,
      message: scope === 'firm' ? 'Documento salvato nello Spazio Studio.' : 'Documento salvato nel tuo Spazio Personale.',
      chunks_processed: chunkInserts.length,
    });

  } catch (error: unknown) {
    console.error('API Upload Workspace Error:', error);
    return NextResponse.json({ error: 'Errore imprevisto durante il caricamento.' }, { status: 500 });
  }
}
