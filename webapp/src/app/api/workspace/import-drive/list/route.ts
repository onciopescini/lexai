import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Utente non autorizzato.' }, { status: 401 });
    }

    const providerToken = session.provider_token;
    if (!providerToken) {
      return NextResponse.json({ 
        error: 'AUTH_SCOPES_MISSING',
        message: 'Non hai effettuato l\'accesso con Google o il token è scaduto. Fai nuovamente login con Google per sfogliare Drive.' 
      }, { status: 403 });
    }

    // Costruisci query per Drive API: PDF, Google Docs o plain text
    // escludendo i file nel cestino, ordinati per data di ultima modifica decrescente.
    const query = "(mimeType='application/pdf' or mimeType='application/vnd.google-apps.document' or mimeType='text/plain') and trashed=false";
    const encodedQuery = encodeURIComponent(query);
    
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodedQuery}&orderBy=modifiedTime desc&pageSize=15&fields=files(id, name, mimeType, iconLink, modifiedTime)`, 
      {
        headers: { Authorization: `Bearer ${providerToken}` }
      }
    );

    if (!driveRes.ok) {
      const errData = await driveRes.text();
      console.error("Google Drive API List Error:", errData);
      return NextResponse.json({ error: 'Impossibile recuperare i file dal tuo Google Drive. Verifica i permessi.' }, { status: driveRes.status });
    }

    const data = await driveRes.json();

    return NextResponse.json({ 
      success: true, 
      files: data.files || [] 
    });

  } catch (error: unknown) {
    console.error('API List Drive Workspace Error:', error);
    return NextResponse.json({ error: 'Errore imprevisto durante la comunicazione con Google Drive.' }, { status: 500 });
  }
}
