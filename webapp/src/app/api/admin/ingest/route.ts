import { NextResponse } from 'next/server';
import { IngestAgent, IngestInput } from '@/lib/agents/IngestAgent';

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
    const fileBase64 = buffer.toString('base64');

    console.log(`[Admin Ingest] Ricevuto file: ${file.name} (${file.type}), Titolo: ${title}`);

    const agent = new IngestAgent();
    const result = await agent.execute({
      fileBase64,
      mimeType: file.type,
      fileName: file.name,
      title,
    } as IngestInput);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Ingest failed' }, { status: 500 });
    }

    console.log(`[Admin Ingest] Ingestione completata con successo!`);
    return NextResponse.json({
      success: true,
      ...result.data
    });

  } catch (error: unknown) {
    console.error('[Admin Ingest] Errore:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
