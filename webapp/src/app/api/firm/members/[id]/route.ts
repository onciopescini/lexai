import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function verifyFirmPermission(supabase: SupabaseClient, userId: string, firmId: string, requireOwner = false) {
  // Check if owner
  const { data: firm } = await supabase.from('law_firms').select('owner_id, name').eq('id', firmId).single();
  if (firm?.owner_id === userId) return { allowed: true, isOwner: true, firmName: firm.name };

  if (requireOwner) return { allowed: false, isOwner: false };

  // Check if admin
  const { data: member } = await supabase.from('firm_members').select('role').eq('firm_id', firmId).eq('user_id', userId).single();
  if (member?.role === 'admin') return { allowed: true, isOwner: false, firmName: firm?.name };

  return { allowed: false, isOwner: false };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 });

    const memberId = params.id;
    const body = await req.json();
    const { role, status } = body;

    const { data: targetMember } = await supabase.from('firm_members').select('*').eq('id', memberId).single();
    if (!targetMember) return NextResponse.json({ error: 'Membro non trovato.' }, { status: 404 });

    const permission = await verifyFirmPermission(supabase, session.user.id, targetMember.firm_id);
    if (!permission.allowed) return NextResponse.json({ error: 'Permessi insufficienti.' }, { status: 403 });

    // Cannot modify the owner
    const { data: firm } = await supabase.from('law_firms').select('owner_id').eq('id', targetMember.firm_id).single();
    if (firm?.owner_id === targetMember.user_id) {
       return NextResponse.json({ error: 'Non puoi modificare il proprietario dello studio.' }, { status: 403 });
    }

    const updates: any = {};
    if (role === 'admin' || role === 'member') updates.role = role;
    if (status === 'removed') updates.status = 'removed';

    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nessun aggiornamento fornito.' }, { status: 400 });

    const { data: updatedMember, error } = await supabase
      .from('firm_members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;

    // If removed, send an email
    if (status === 'removed' && targetMember.status !== 'removed' && targetMember.email) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'Atena <noreply@lexai.cloud>',
            to: [targetMember.email.trim()],
            subject: `Accesso allo Studio Rimosso`,
            html: `
              <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:40px 32px;background:#FAFAFA;border-radius:16px">
                <h1 style="font-size:22px;font-weight:800;color:#0F172A;margin-bottom:8px">Aggiornamento Studio Legale</h1>
                <p style="color:#475569;font-size:15px;line-height:1.6;margin-bottom:24px">
                  Il tuo accesso allo studio <strong>${permission.firmName || 'LexAI Firm'}</strong> è stato revocato da un amministratore. Non hai più accesso ai documenti dello studio.
                </p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://lexai.cloud'}/workspace" style="display:inline-block;padding:14px 28px;background:#C9A84C;color:#fff;font-weight:700;border-radius:12px;text-decoration:none;font-size:15px">
                  Torna al Workspace Personale →
                </a>
              </div>
            `,
          })
        });
      } catch (emailErr) {
        console.warn('Failed to send removal email:', emailErr);
      }
    }

    return NextResponse.json({ success: true, member: updatedMember });

  } catch (err) {
    console.error('[/api/firm/members/[id] PATCH]', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Non autorizzato.' }, { status: 401 });

    const memberId = params.id;
    const { data: targetMember } = await supabase.from('firm_members').select('*').eq('id', memberId).single();
    if (!targetMember) return NextResponse.json({ error: 'Membro non trovato.' }, { status: 404 });

    const permission = await verifyFirmPermission(supabase, session.user.id, targetMember.firm_id, true); // req owner
    if (!permission.allowed) return NextResponse.json({ error: 'Solo il proprietario dello studio può eliminare definitivamente un membro.' }, { status: 403 });

    // hard delete
    const { error } = await supabase.from('firm_members').delete().eq('id', memberId);
    if (error) throw error;

    return NextResponse.json({ success: true, deleted: true });

  } catch (err) {
    console.error('[/api/firm/members/[id] DELETE]', err);
    return NextResponse.json({ error: 'Errore interno.' }, { status: 500 });
  }
}
