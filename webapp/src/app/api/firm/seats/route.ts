import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia' as any,
});

export const dynamic = 'force-dynamic';

export async function PATCH() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
    }

    // Find user's firm
    const { data: firmMember } = await supabase
      .from('firm_members')
      .select('firm_id, role, law_firms(id, stripe_subscription_id)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!firmMember || !firmMember.law_firms) {
      return NextResponse.json({ error: 'FIRM_NOT_FOUND' }, { status: 404 });
    }

    // Solo admin/owner possono forzare resync
    if (firmMember.role !== 'admin') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const firm = Array.isArray(firmMember.law_firms) ? firmMember.law_firms[0] : firmMember.law_firms;
    
    // Conta i membri attivi
    const { count, error: countErr } = await supabase
      .from('firm_members')
      .select('*', { count: 'exact', head: true })
      .eq('firm_id', firm.id)
      .eq('status', 'active');
      
    if (countErr) throw countErr;
    
    const activeSeats = Math.max(1, count || 1);

    // Aggiorna seat_count nel DB
    await supabase
      .from('law_firms')
      .update({ seat_count: activeSeats })
      .eq('id', firm.id);

    // Se c'è una subscription Stripe attiva, aggiorna la quantity
    if (firm.stripe_subscription_id) {
       const sub = await stripe.subscriptions.retrieve(firm.stripe_subscription_id);
       const item = sub.items.data[0];
       
       if (item && item.quantity !== activeSeats) {
          await stripe.subscriptions.update(firm.stripe_subscription_id, {
             items: [{
                id: item.id,
                quantity: activeSeats,
             }],
             proration_behavior: 'always_invoice'
          });
       }
    }

    return NextResponse.json({ success: true, activeSeats });

  } catch (err: unknown) {
    console.error('[firm/seats PATCH]', err);
    return NextResponse.json({ error: 'Errore durante l\'aggiornamento dei seat.' }, { status: 500 });
  }
}
