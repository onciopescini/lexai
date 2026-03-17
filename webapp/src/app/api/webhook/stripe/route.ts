import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  sendPremiumWelcomeEmail,
  sendCancellationEmail,
  sendSubscriptionUpdateEmail,
} from '@/lib/resend';

// Force dynamic rendering — this route should never be pre-rendered
export const dynamic = 'force-dynamic';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
  });
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing Stripe Webhook signature or secret' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('⚠️ Webhook signature verification failed:', message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_email;

      if (customerEmail) {
        console.log(`✅ [Stripe Webhook] Checkout completato per: ${customerEmail}`);

        // Find user by email and update their metadata to premium
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (!listError && users) {
          const user = users.users.find(
            (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
          );

          if (user) {
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              user.id,
              {
                user_metadata: {
                  ...user.user_metadata,
                  is_premium: true,
                  stripe_customer_id: session.customer as string,
                  subscription_id: session.subscription as string,
                  premium_since: new Date().toISOString(),
                },
              }
            );

            if (updateError) {
              console.error('❌ Errore aggiornamento utente:', updateError);
            } else {
              console.log(`👑 Utente ${customerEmail} promosso a Premium!`);

              // 📧 Send welcome email
              await sendPremiumWelcomeEmail(customerEmail);
            }
          } else {
            console.warn(`⚠️ Utente non trovato per email: ${customerEmail}`);
          }
        }
      }
      break;
    }

    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // If subscription is cancelled or unpaid, revoke premium
      if (
        subscription.status === 'canceled' ||
        subscription.status === 'unpaid'
      ) {
        console.log(
          `🔒 [Stripe Webhook] Subscription ${subscription.status} per customer: ${customerId}`
        );

        // Lookup the customer to get their email
        try {
          const customer = await stripe.customers.retrieve(customerId);
          if (customer && !customer.deleted && 'email' in customer && customer.email) {
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const user = users?.users.find(
              (u) => u.email?.toLowerCase() === customer.email?.toLowerCase()
            );

            if (user) {
              await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: {
                  ...user.user_metadata,
                  is_premium: false,
                },
              });
              console.log(`🔓 Premium revocato per: ${customer.email}`);

              // 📧 Send cancellation email
              await sendCancellationEmail(customer.email);
            }
          }
        } catch (err) {
          console.error('Errore durante revoca premium:', err);
        }
      } else if (subscription.status === 'active') {
        // Subscription was updated but still active (e.g. plan change)
        try {
          const customer = await stripe.customers.retrieve(customerId);
          if (customer && !customer.deleted && 'email' in customer && customer.email) {
            // 📧 Send update notification
            await sendSubscriptionUpdateEmail(customer.email, subscription.status);
          }
        } catch (err) {
          console.error('Errore invio email aggiornamento:', err);
        }
      }
      break;
    }

    default:
      // Unhandled event type
      console.log(`ℹ️ Evento Stripe non gestito: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
