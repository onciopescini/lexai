import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Utente non autorizzato.' }, { status: 401 });
    }

    // Google Provider Token is available here if logged in via Google
    // Note: Provider refresh tokens might be needed if token expired, but Supabase currently manages the session.
    const providerToken = session.provider_token;

    if (!providerToken) {
      return NextResponse.json({ 
        error: 'Non hai effettuato l\'accesso con Google o il token è scaduto. Riconnettiti con Google per salvare su Drive.' 
      }, { status: 403 });
    }

    const { content, title, mimeType = 'text/plain' } = await req.json();

    if (!content || !title) {
      return NextResponse.json({ error: 'Contenuto e titolo sono richiesti.' }, { status: 400 });
    }

    // Step 1: Crea il file vuoto (solo metadata)
    const createMetaRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: title,
        mimeType: mimeType,
      }),
    });

    if (!createMetaRes.ok) {
        const errData = await createMetaRes.text();
        console.error("Google Drive API Meta Error:", errData);
        return NextResponse.json({ error: 'Errore durante la creazione del file su Drive.' }, { status: createMetaRes.status });
    }

    const fileMeta = await createMetaRes.json();
    const fileId = fileMeta.id;

    // Step 2: Fai upload del contenuto usando uploadType=media
    const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${providerToken}`,
        'Content-Type': mimeType,
      },
      body: content,
    });

    if (!uploadRes.ok) {
        const errData = await uploadRes.text();
        console.error("Google Drive API Upload Error:", errData);
        return NextResponse.json({ error: 'Errore durante l\'upload del contenuto.' }, { status: uploadRes.status });
    }

    return NextResponse.json({ success: true, fileId: fileId });
  } catch (error) {
    console.error('Drive Export Error:', error);
    return NextResponse.json({ error: 'Errore interno del server durante l\'esportazione.' }, { status: 500 });
  }
}
