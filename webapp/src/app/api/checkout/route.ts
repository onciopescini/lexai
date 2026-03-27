// FIX C2: Whitelist dell'origin per prevenire SSRF / Open Redirect
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSafeOrigin } from '@/lib/security';

// Force dynamic rendering — this route should never be pre-rendered
export const dynamic = 'force-dynamic';

// Atena Premium Price ID
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

    // Validate email format loosely
    const { email, trial } = body;
    if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
      return NextResponse.json({ error: 'Email non valida.' }, { status: 400 });
    }

    const stripe = getStripe();

    // ── C2 FIX: Validate origin against whitelist before using as redirect URL ──
    const rawOrigin = req.headers.get('origin') || req.headers.get('referer');
    const safeOrigin = getSafeOrigin(rawOrigin);

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      customer_email: email.toLowerCase().trim(),
      line_items: [{ price: ATENA_PREMIUM_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      success_url: `${safeOrigin}/?checkout=success`,
      cancel_url: `${safeOrigin}/?checkout=cancel`,
    };

    if (trial === true) {
      sessionConfig.subscription_data = { trial_period_days: 3 };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error creating checkout session:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
