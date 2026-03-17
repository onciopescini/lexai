import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Force dynamic rendering — this route should never be pre-rendered
export const dynamic = 'force-dynamic';

// Atena Premium Price ID (created on CashClaw Stripe account)
const ATENA_PREMIUM_PRICE_ID = 'price_1TBfvNE4aoOpLqyMTPrMTbwd';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe non è configurato su questo server.' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.email) {
      return NextResponse.json(
        { error: 'Email è obbligatoria per il checkout.' },
        { status: 400 }
      );
    }

    const { email } = body;
    const stripe = getStripe();

    // Use origin header with fallback to production domain
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || 'https://atena-lex.it';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: ATENA_PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error creating checkout session:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
