import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET — lista tutti i membri dello studio dell'utente
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 });

    const { data: firm } = await supabase
      .from('law_firms')
      .select('id')
      .eq('owner_id', session.user.id)
      .single();

    if (!firm) return NextResponse.json({ error: 'Studio non trovato.' }, { status: 404 });

    const { data: members, error } = await supabase
      .from('firm_members')
      .select('*')
      .eq('firm_id', firm.id)
      .order('invited_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ members: members || [] });

  } catch (err) {
    console.error('[/api/firm/members GET]', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}

// POST — invita un nuovo membro via email
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 });

    // Solo il proprietario può invitare
    const { data: firm } = await supabase
      .from('law_firms')
      .select('id, name, seat_count')
      .eq('owner_id', session.user.id)
      .single();

    if (!firm) return NextResponse.json({ error: 'Solo il proprietario dello studio può invitare membri.' }, { status: 403 });

    const { email, role = 'member' } = await req.json();
    if (!email?.trim()) return NextResponse.json({ error: 'Email obbligatoria.' }, { status: 400 });

    // Controllo dei limiti di postazione (seats)
    const { count, error: countErr } = await supabase
      .from('firm_members')
      .select('*', { count: 'exact', head: true })
      .eq('firm_id', firm.id)
      .in('status', ['active', 'pending']);
      
    if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 });
    
    // Il limite è il seat_count. Se l'owner è attivo, count parte da 1.
    if ((count || 0) >= (firm.seat_count || 1)) {
        return NextResponse.json({ 
            error: 'SEAT_LIMIT_REACHED', 
            message: 'Hai raggiunto il limite di postazioni. Gestisci il piano per aggiungere ulteriori seat.' 
        }, { status: 403 });
    }

    // Inserisci il membro in stato pending
    const { data: member, error: insertError } = await supabase
      .from('firm_members')
      .insert({
        firm_id: firm.id,
        email: email.toLowerCase().trim(),
        role,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Questo utente è già stato invitato.' }, { status: 409 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Invia email di invito via Resend (se disponibile)
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://lexai.cloud'}/join-firm?firm_id=${firm.id}&email=${encodeURIComponent(email)}`;
    
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Atena <noreply@lexai.cloud>',
          to: [email.trim()],
          subject: `Sei stato invitato nello Studio "${firm.name}" su LexAI`,
          html: `
            <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:40px 32px;background:#FAFAFA;border-radius:16px">
              <h1 style="font-size:22px;font-weight:800;color:#0F172A;margin-bottom:8px">Invito allo Studio Legale</h1>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin-bottom:24px">
                Sei stato invitato come <strong>${role === 'admin' ? 'Amministratore' : 'Membro'}</strong> dello studio <strong>${firm.name}</strong> su LexAI — la piattaforma AI per il diritto italiano.
              </p>
              <a href="${inviteLink}" style="display:inline-block;padding:14px 28px;background:#C9A84C;color:#fff;font-weight:700;border-radius:12px;text-decoration:none;font-size:15px">
                Accetta l'invito →
              </a>
              <p style="margin-top:24px;color:#94A3B8;font-size:12px">Se non hai richiesto questo invito, puoi ignorare questa email.</p>
            </div>
          `,
        }),
      });
    } catch (emailErr) {
      console.warn('[/api/firm/members] Resend email failed (non-critical):', emailErr);
    }

    return NextResponse.json({ success: true, member });

  } catch (err) {
    console.error('[/api/firm/members POST]', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}
