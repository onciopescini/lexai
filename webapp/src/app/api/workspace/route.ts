import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED', message: 'Sessione scaduta o utente non autenticato.' }, { status: 401 });
    }

    // Fetch the list of documents belonging to the user.
    // Explicitly omitting the raw_content to save bandwidth.
    const { data, error } = await supabase
      .from('user_documents')
      .select('id, file_name, file_type, size_bytes, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Workspace GET Error:', error);
      return NextResponse.json({ error: 'Errore nel caricamento del Workspace.' }, { status: 500 });
    }

    return NextResponse.json({ documents: data || [] });
  } catch (err) {
    console.error('API Workspace GET Error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED', message: 'Sessione scaduta.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Nessun ID documento fornito.' }, { status: 400 });
    }

    // RLS protects this, ensuring a user can only delete their own document.
    // Supabase standard `ON DELETE CASCADE` handles the removal of associated vector chunks.
    const { error } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Workspace DELETE Error:', error);
      return NextResponse.json({ error: 'Errore durante la cancellazione del documento.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Documento eliminato con successo.' });
  } catch (err) {
    console.error('API Workspace DELETE Error:', err);
    return NextResponse.json({ error: 'Errore interno del server.' }, { status: 500 });
  }
}
