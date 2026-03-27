// FIX C3: Timing-safe admin password comparison to prevent side-channel attacks
import { NextResponse } from 'next/server';
import { IngestAgent, IngestInput } from '@/lib/agents/IngestAgent';
import { timingSafeCompare, sanitizeInput } from '@/lib/security';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request) {
  try {
    const adminPassword = req.headers.get('x-admin-password') || '';
    const secretPassword = process.env.ADMIN_SECRET_PASSWORD;

    if (!secretPassword) {
      console.error('[Admin Ingest] ADMIN_SECRET_PASSWORD is not set.');
      return NextResponse.json(
        { error: 'Configurazione di sicurezza mancante sul server.' },
        { status: 500 }
      );
    }

    // ── C3 FIX: Use timing-safe comparison to prevent timing side-channel attacks ──
    if (!timingSafeCompare(adminPassword, secretPassword)) {
      // Log failed attempt with timestamp (no password leaked)
      console.warn(`[Admin Ingest] [${new Date().toISOString()}] Accesso negato — password errata. IP: ${req.headers.get('x-forwarded-for') ?? 'unknown'}`);
      return NextResponse.json(
        { error: 'Password di amministrazione errata o mancante. Accesso Negato.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawTitle = formData.get('title') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Nessun file ricevuto.' }, { status: 400 });
    }

    // ── File size limit ──────────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File troppo grande. Limite: ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.` },
        { status: 413 }
      );
    }

    if (!rawTitle) {
      return NextResponse.json({ error: 'Titolo mancante.' }, { status: 400 });
    }

    // ── Sanitize title to strip control characters ───────────────────────────
    const title = sanitizeInput(rawTitle, 500);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileBase64 = buffer.toString('base64');

    console.log(`[Admin Ingest] [${new Date().toISOString()}] File: ${file.name} (${file.type}), Titolo: "${title}"`);

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

    console.log(`[Admin Ingest] [${new Date().toISOString()}] Ingestione completata!`);
    return NextResponse.json({ success: true, ...(result.data as Record<string, unknown> ?? {}) });

  } catch (error: unknown) {
    console.error('[Admin Ingest] Errore:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
