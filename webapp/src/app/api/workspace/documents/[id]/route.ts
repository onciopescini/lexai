import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const documentId = resolvedParams.id;
    
    if (!documentId) {
      return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
    }

    // Only allow deletion if user owns the document 
    // Wait, the RLS policy should restrict deletion to owner only, but let's be explicit and secure.
    const { data: doc } = await supabase
      .from('user_documents')
      .select('user_id')
      .eq('id', documentId)
      .single();

    if (!doc || doc.user_id !== user.id) {
       return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // Delete document (chunks are deleted automatically if ON DELETE CASCADE is set)
    const { error: deleteError } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id); // Extra safety

    if (deleteError) {
      console.error('[workspace/documents/[id] DELETE] error', deleteError);
      return NextResponse.json({ error: 'Errore database.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted_id: documentId });

  } catch (err: unknown) {
    console.error('[workspace/documents/[id] DELETE]', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}
