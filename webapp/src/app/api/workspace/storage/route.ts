import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
    }

    const { data: stats, error } = await supabase
      .from('user_storage_stats')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[workspace/storage GET] DB error', error);
      return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 });
    }

    const total_bytes = parseInt(stats?.total_bytes || '0', 10);
    const document_count = parseInt(stats?.document_count || '0', 10);
    const total_chunks = parseInt(stats?.total_chunks || '0', 10);

    // 500MB fixed for Premium user
    const limit_bytes = 524288000;

    return NextResponse.json({
      total_bytes,
      document_count,
      total_chunks,
      limit_bytes
    });

  } catch (err: unknown) {
    console.error('[workspace/storage GET]', err);
    return NextResponse.json({ error: 'Errore nel recupero storage.' }, { status: 500 });
  }
}
