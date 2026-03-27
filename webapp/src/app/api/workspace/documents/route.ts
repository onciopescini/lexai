// Phase 16: New documents list route — returns user docs filtered by scope
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
    }

    const isPremium = user.user_metadata?.is_premium === true;
    if (!isPremium) {
      return NextResponse.json({ error: 'PREMIUM_REQUIRED' }, { status: 403 });
    }

    const url = new URL(req.url);
    const rawScope = url.searchParams.get('scope') ?? 'all';
    const scope = ['personal', 'firm', 'all'].includes(rawScope) ? rawScope : 'all';

    // Build query — always filter by user's own personal docs
    // For firm scope: also include docs from firm user belongs to
    let query = supabase
      .from('user_documents')
      .select('id, file_name, file_type, size_bytes, scope, firm_id, created_at')
      .order('created_at', { ascending: false });

    if (scope === 'personal') {
      query = query.eq('user_id', user.id).eq('scope', 'personal');
    } else if (scope === 'firm') {
      // Get user's firm
      const { data: membership } = await supabase
        .from('firm_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!membership) {
        return NextResponse.json({ documents: [], firm_id: null });
      }
      query = query.eq('scope', 'firm').eq('firm_id', membership.firm_id);
    } else {
      // 'all': user's own + firm docs
      const { data: membership } = await supabase
        .from('firm_members')
        .select('firm_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const firmId = membership?.firm_id;
      if (firmId) {
        query = query.or(
          `user_id.eq.${user.id},and(scope.eq.firm,firm_id.eq.${firmId})`
        );
      } else {
        query = query.eq('user_id', user.id);
      }
    }

    const { data: documents, error } = await query;
    if (error) throw error;

    return NextResponse.json({ documents: documents ?? [], scope });

  } catch (err: unknown) {
    console.error('[workspace/documents GET]', err);
    return NextResponse.json({ error: 'Errore nel recupero documenti.' }, { status: 500 });
  }
}
