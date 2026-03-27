import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid ids payload' }, { status: 400 });
    }

    // Per sicurezza eliminiamo solo i doc appartenenti all'utente
    // RLS in teoria protegge, ma forziamo la restrizione
    const { error: deleteError } = await supabase
      .from('user_documents')
      .delete()
      .in('id', ids)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[workspace/documents/batch DELETE] error', deleteError);
      return NextResponse.json({ error: 'Errore database bulk delete.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted_count: ids.length });

  } catch (err: unknown) {
    console.error('[workspace/documents/batch DELETE]', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}
