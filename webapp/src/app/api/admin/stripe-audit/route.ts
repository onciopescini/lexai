import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // 1. Authenticate the Cron request
  const authHeader = req.headers.get('Authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    console.warn("⚠️ Unauthorized access to /api/admin/stripe-audit");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    console.log("🚀 [Stripe Audit] Inizio sincronizzazione abbonamenti...");

    // 2. Recupero tutti gli utenti
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError || !usersData) {
      console.error("❌ Errore recupero utenti Supabase:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    // Filtriamo solo quelli che il DB considera "premium"
    const premiumUsers = usersData.users.filter(u => u.user_metadata?.is_premium === true);
    console.log(`🔍 [Stripe Audit] Trovati ${premiumUsers.length} utenti Premium nel database.`);

    let revokedCount = 0;
    const errors: string[] = [];

    // 3. Verifica ogni utente Premium su Stripe
    for (const user of premiumUsers) {
      const subId = user.user_metadata?.subscription_id;
      
      if (!subId) {
        // Utente premium ma senza subscription_id? Potrebbe essere un accesso garantito manualmente.
        // Lo skippiamo per evitare false revoche, ma lo loggiamo.
        console.log(`⚠️ [Stripe Audit] Utente ${user.email} è Premium ma non ha subscription_id. Ignorato.`);
        continue;
      }

      try {
        const subscription = await stripe.subscriptions.retrieve(subId as string);
        
        // Se lo status è canceled o unpaid, revochiamo il premium
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          console.log(`🔒 [Stripe Audit] Discrepanza rilevata! Subscription ${subId} è ${subscription.status} per utente ${user.email}. Revoca Premium in corso...`);
          
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...user.user_metadata,
              is_premium: false,
            }
          });

          if (updateError) {
            console.error(`❌ Errore revoca Premium per ${user.email}:`, updateError);
            errors.push(`Failed to revoke ${user.email}`);
          } else {
            console.log(`✅ [Stripe Audit] Premium revocato con successo per ${user.email}.`);
            revokedCount++;
            
            // Nota: potremmo inviare anche la demotion email qui, ma si suppone che il webhook abbia fallback.
            // Questa è solo un'ancora di salvezza.
          }
        } else {
           // L'abbonamento è ok (active, trialing, past_due gestibile altrimenti).
           console.log(`✨ [Stripe Audit] Utente ${user.email} è in regola (Status: ${subscription.status}).`);
        }
      } catch (stripeErr: unknown) {
         const isStripeError = stripeErr && typeof stripeErr === 'object' && 'statusCode' in stripeErr;
         const statusCode = isStripeError ? (stripeErr as { statusCode: number }).statusCode : null;
         const errorMessage = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);

         console.error(`❌ Errore recupero sub Stripe per ${user.email}:`, errorMessage);
         // Se l'ID non esiste più in Stripe (es. cancellazione hard), revoca?
         if (statusCode === 404) {
            console.log(`🔒 [Stripe Audit] Subscription ${subId} inesistente (404) per ${user.email}. Revoca Premium in corso...`);
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: {
                  ...user.user_metadata,
                  is_premium: false,
                }
            });
            revokedCount++;
         } else {
            errors.push(`Stripe API error for ${user.email}: ${errorMessage}`);
         }
      }
    }

    console.log(`🏁 [Stripe Audit] Completato. Utenti revocati: ${revokedCount}. Errori: ${errors.length}`);

    return NextResponse.json({ 
      success: true, 
      scanned: premiumUsers.length,
      revoked: revokedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ Critico in /api/admin/stripe-audit:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
