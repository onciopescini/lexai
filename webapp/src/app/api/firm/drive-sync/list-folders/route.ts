import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET — lista le cartelle Google Drive dell'utente (per il folder picker)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 });

    const providerToken = session.provider_token;
    if (!providerToken) {
      return NextResponse.json({
        error: 'AUTH_SCOPES_MISSING',
        message: 'Devi accedere con Google per collegare una cartella Drive. Esegui nuovamente il login con Google.',
      }, { status: 403 });
    }

    // Lista solo le cartelle (non i file)
    const query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
    const encodedQuery = encodeURIComponent(query);

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodedQuery}&orderBy=modifiedTime desc&pageSize=30&fields=files(id,name,modifiedTime)`,
      { headers: { Authorization: `Bearer ${providerToken}` } }
    );

    if (!driveRes.ok) {
      const errText = await driveRes.text();
      console.error('[Drive List Folders] Error:', errText);
      return NextResponse.json({ error: 'Impossibile recuperare le cartelle da Google Drive.' }, { status: driveRes.status });
    }

    const data = await driveRes.json();
    return NextResponse.json({ folders: data.files || [] });

  } catch (err) {
    console.error('[/api/firm/drive-sync/list-folders]', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}
