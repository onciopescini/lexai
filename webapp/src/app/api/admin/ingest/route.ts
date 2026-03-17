import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getEmbeddings } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const adminPassword = req.headers.get('x-admin-password');
    const secretPassword = process.env.ADMIN_SECRET_PASSWORD;

    if (!secretPassword) {
      console.error('[Admin Ingest] ADMIN_SECRET_PASSWORD is not set in environment variables.');
      return NextResponse.json({ error: 'Configurazione di sicurezza mancante sul server.' }, { status: 500 });
    }

    if (adminPassword !== secretPassword) {
      return NextResponse.json({ error: 'Password di amministrazione errata o mancante. Accesso Negato.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Nessun file ricevuto.' }, { status: 400 });
    }

    if (!title) {
        return NextResponse.json({ error: 'Titolo mancante.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    const mimeType = file.type;

    console.log(`[Admin Ingest] Ricevuto file: ${file.name} (${mimeType}), Titolo: ${title}`);

    // 1. Analisi Semantica tramite Gemini 2.5 Flash (Vision/Audio)
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
    Sei un assistente legale esperto di Atena.
    Analizza questo documento multimediale (immagine, audio o documento).
    Estrai una descrizione estremamente dettagliata in italiano.
    Trascrivi le parti udibili o leggibili rilevanti, indicando i soggetti coinvolti e i riferimenti normativi (se ce ne sono).
    Se è un documento visivo, descrivi la struttura. Il tuo output testuale servirà come "Base di Conoscenza" per una ricerca vettoriale RAG successiva.
    `;

    // Costruzione del payload Multimodale
    const imageParts = [
      { text: prompt },
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ];

    console.log(`[Admin Ingest] Invocando Gemini 2.5 Flash per l'estrazione dati...`);
    const genResult = await model.generateContent(imageParts);
    const textualDescription = genResult.response.text();
    console.log(`[Admin Ingest] Estrazione terminata: ${textualDescription.substring(0, 100)}...`);

    if (!textualDescription) {
        return NextResponse.json({ error: "Gemini non ha restituito alcuna descrizione." }, { status: 500 });
    }

    // 2. Generazione dell'Embedding Vettoriale
    console.log(`[Admin Ingest] Generazione Embedding Semantico...`);
    const vector = await getEmbeddings(textualDescription);

    // 3. Inserimento in Supabase `legal_documents` bypassing RLS
    // Inizializiamo un client admin con la service role key per aggirare la RLS pubblica
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const payload = {
        title: title,
        content: `[MEDIA UPLOAD: ${file.name}]\n${textualDescription}`,
        source_url: `admin_upload/${file.name}`,
        metadata: {
            source: "Admin Web Upload",
            file_type: mimeType,
            original_filename: file.name,
            date_ingested: new Date().toISOString()
        },
        embedding: vector
    };

    console.log(`[Admin Ingest] Inserimento in Supabase (Service Role) in corso...`);
    const { error } = await supabaseAdmin.from('legal_documents').insert([payload]);

    if (error) {
        throw new Error(error.message);
    }

    console.log(`[Admin Ingest] Ingestione completata con successo!`);
    return NextResponse.json({ 
        success: true, 
        message: 'File analizzato, vettorizzato e aggiunto al database con successo.',
        extractedData: textualDescription
    });

  } catch (error: unknown) {
    console.error('[Admin Ingest] Errore:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
