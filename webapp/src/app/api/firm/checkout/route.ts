import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia' as any,
});

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
    }

    // Prendi la firm dell'utente corrente
    const { data: firmMember } = await supabase
      .from('firm_members')
      .select('firm_id, role, law_firms(id, name, owner_id, stripe_customer_id, seat_count)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!firmMember || !firmMember.law_firms) {
      return NextResponse.json({ error: 'FIRM_NOT_FOUND' }, { status: 404 });
    }

    const firm = Array.isArray(firmMember.law_firms) ? firmMember.law_firms[0] : firmMember.law_firms;

    // Solo l'owner o un admin può gestire il billing
    if (firmMember.role !== 'admin' && firm.owner_id !== user.id) {
       return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const priceId = process.env.STRIPE_STUDIO_PRICE_ID;
    if (!priceId) {
      console.error('Missing STRIPE_STUDIO_PRICE_ID env var');
      return NextResponse.json({ error: 'Configurazione Stripe mancante.' }, { status: 500 });
    }

    // Quanti seat attivi ci sono ora? (incluso l'owner)
    const { count, error: countErr } = await supabase
      .from('firm_members')
      .select('*', { count: 'exact', head: true })
      .eq('firm_id', firm.id)
      .eq('status', 'active');
      
    if (countErr) throw countErr;
    
    const activeSeats = Math.max(1, count || 1); // Almeno 1

    let customerId = firm.stripe_customer_id;
    
    if (!customerId) {
      // Crea customer Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        name: firm.name,
        metadata: {
           firm_id: firm.id,
           owner_id: firm.owner_id
        }
      });
      customerId = customer.id;
      
      // Salva il customer ID
      await supabase
        .from('law_firms')
        .update({ stripe_customer_id: customerId })
        .eq('id', firm.id);
    }

    // Crea checkout session
    const sessionUrl = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: activeSeats,
        },
      ],
      client_reference_id: firm.id,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspace?firm_checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspace?firm_checkout=cancelled`,
      subscription_data: {
        metadata: {
          firm_id: firm.id
        }
      }
    });

    return NextResponse.json({ url: sessionUrl.url });

  } catch (err: unknown) {
    console.error('[firm/checkout POST]', err);
    return NextResponse.json({ error: 'Errore durante la creazione del checkout.' }, { status: 500 });
  }
}
