import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET — recupera il profilo dello studio dell'utente corrente
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Cerca se l'utente è owner di uno studio
    const { data: ownedFirm } = await supabase
      .from('law_firms')
      .select('*, firm_members(id, email, role, status, joined_at)')
      .eq('owner_id', userId)
      .single();

    if (ownedFirm) {
      return NextResponse.json({ firm: ownedFirm, role: 'admin' });
    }

    // 2. Cerca se è membro attivo di uno studio
    const { data: membership } = await supabase
      .from('firm_members')
      .select('firm_id, role, status, law_firms(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (membership) {
      return NextResponse.json({ firm: membership.law_firms, role: membership.role });
    }

    return NextResponse.json({ firm: null });

  } catch (err) {
    console.error('[/api/firm GET]', err);
    return NextResponse.json({ error: 'Errore interno del server.' }, { status: 500 });
  }
}

// POST — crea un nuovo studio legale
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 });
    }

    const user = session.user;
    const isPremium = user.user_metadata?.is_premium === true;
    if (!isPremium) {
      return NextResponse.json({ error: 'PREMIUM_REQUIRED', message: 'La funzione Studio è riservata agli utenti LexAI Pro.' }, { status: 403 });
    }

    // Verifica che non esista già uno studio per questo utente
    const { data: existing } = await supabase
      .from('law_firms')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Hai già uno studio attivo.' }, { status: 409 });
    }

    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Il nome dello studio è obbligatorio.' }, { status: 400 });
    }

    const { data: firm, error: insertError } = await supabase
      .from('law_firms')
      .insert({ name: name.trim(), owner_id: user.id })
      .select()
      .single();

    if (insertError || !firm) {
      return NextResponse.json({ error: 'Impossibile creare lo studio.', details: insertError?.message }, { status: 500 });
    }

    // Inserisci il founder come membro admin attivo
    await supabase.from('firm_members').insert({
      firm_id: firm.id,
      user_id: user.id,
      email: user.email,
      role: 'admin',
      status: 'active',
      joined_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, firm });

  } catch (err) {
    console.error('[/api/firm POST]', err);
    return NextResponse.json({ error: 'Errore interno del server.' }, { status: 500 });
  }
}
