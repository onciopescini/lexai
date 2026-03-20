import { Resend } from 'resend';

// Force lazy initialization to avoid build-time errors
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const FROM_EMAIL = 'Atena AI <noreply@atena-lex.it>';

// ─── Email Templates ───────────────────────────────────────────────

function premiumWelcomeHTML(email: string): string {
  return `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#D4A853,#F5D799);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:36px;font-weight:800;letter-spacing:-1px;">⚖️ Atena AI</div>
    </div>
    <div style="background:#1E293B;border-radius:16px;padding:32px;border:1px solid #334155;">
      <h1 style="color:#F5D799;font-size:24px;margin:0 0 16px;">👑 Benvenuto nell'Olimpo, Premium!</h1>
      <p style="color:#CBD5E1;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Il tuo abbonamento <strong style="color:#D4A853;">Atena Premium</strong> è ora attivo.<br>
        Hai sbloccato l'accesso completo all'intelligenza artificiale giuridica più avanzata d'Italia.
      </p>
      <div style="background:#0F172A;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#F5D799;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">🏛️ I tuoi poteri Premium</h3>
        <ul style="color:#94A3B8;font-size:14px;line-height:2;margin:0;padding-left:20px;">
          <li>Analisi giuridica illimitata con citazioni normative</li>
          <li>Creazione documenti Google Docs</li>
          <li>Accesso a tutti gli agenti specializzati</li>
          <li>Guardian Radar in tempo reale</li>
          <li>Priorità nell'assistenza AI</li>
        </ul>
      </div>
      <a href="https://atena-lex.it/atena" style="display:block;text-align:center;background:linear-gradient(135deg,#D4A853,#B8941F);color:#0F172A;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;">
        Inizia a usare Atena Premium →
      </a>
    </div>
    <p style="color:#475569;font-size:12px;text-align:center;margin-top:24px;">
      Account: ${email} · <a href="https://atena-lex.it/legal/terms" style="color:#64748B;">Termini</a> · <a href="https://atena-lex.it/legal/privacy" style="color:#64748B;">Privacy</a>
    </p>
  </div>
</body>
</html>`;
}

function subscriptionCancelledHTML(email: string): string {
  return `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:36px;font-weight:800;color:#D4A853;">⚖️ Atena AI</div>
    </div>
    <div style="background:#1E293B;border-radius:16px;padding:32px;border:1px solid #334155;">
      <h1 style="color:#F87171;font-size:24px;margin:0 0 16px;">Abbonamento Cancellato</h1>
      <p style="color:#CBD5E1;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Il tuo abbonamento Premium è stato cancellato.<br>
        Le funzionalità premium saranno disabilitate al termine del periodo corrente.
      </p>
      <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Ci dispiace vederti andare. Puoi riattivare il tuo abbonamento in qualsiasi momento dalla pagina di Atena.
      </p>
      <a href="https://atena-lex.it" style="display:block;text-align:center;background:#334155;color:#E2E8F0;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;">
        Torna su Atena →
      </a>
    </div>
    <p style="color:#475569;font-size:12px;text-align:center;margin-top:24px;">
      Account: ${email} · <a href="https://atena-lex.it/legal/terms" style="color:#64748B;">Termini</a>
    </p>
  </div>
</body>
</html>`;
}

function subscriptionUpdatedHTML(email: string, status: string): string {
  return `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:36px;font-weight:800;color:#D4A853;">⚖️ Atena AI</div>
    </div>
    <div style="background:#1E293B;border-radius:16px;padding:32px;border:1px solid #334155;">
      <h1 style="color:#60A5FA;font-size:24px;margin:0 0 16px;">📋 Aggiornamento Abbonamento</h1>
      <p style="color:#CBD5E1;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Lo stato del tuo abbonamento è stato aggiornato a: <strong style="color:#D4A853;">${status}</strong>
      </p>
      <p style="color:#94A3B8;font-size:14px;line-height:1.6;">
        Se hai domande, contattaci rispondendo a questa email o dalla pagina di supporto.
      </p>
    </div>
    <p style="color:#475569;font-size:12px;text-align:center;margin-top:24px;">
      Account: ${email} · <a href="https://atena-lex.it/legal/terms" style="color:#64748B;">Termini</a>
    </p>
  </div>
</body>
  </div>
</body>
</html>`;
}

function legalExportHTML(email: string, content: string): string {
  // Simple markdown to HTML for email (basic)
  const formattedContent = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p style="color:#CBD5E1;font-size:16px;line-height:1.6;margin:0 0 16px;">')
    .replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:36px;font-weight:800;color:#D4A853;">⚖️ Atena AI</div>
    </div>
    <div style="background:#1E293B;border-radius:16px;padding:32px;border:1px solid #334155;">
      <h1 style="color:#60A5FA;font-size:24px;margin:0 0 16px;">📄 Documento Esportato dal tuo Workspace</h1>
      <p style="color:#CBD5E1;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Ecco la sintesi giuridica generata da Atena:
      </p>
      
      <div style="background:#0F172A;border-radius:12px;padding:24px;border:1px solid #334155;">
        <p style="color:#CBD5E1;font-size:16px;line-height:1.6;margin:0 0 16px;">
          ${formattedContent}
        </p>
      </div>

    </div>
    <p style="color:#475569;font-size:12px;text-align:center;margin-top:24px;">
      Richiesto da: ${email} · <a href="https://atena-lex.it" style="color:#64748B;">Torna ad Atena</a>
    </p>
  </div>
</body>
</html>`;
}

// ─── Send Functions ────────────────────────────────────────────────

export async function sendPremiumWelcomeEmail(email: string) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: '👑 Benvenuto in Atena Premium!',
      html: premiumWelcomeHTML(email),
      text: `Benvenuto in Atena Premium! Il tuo abbonamento è attivo. Accedi: https://atena-lex.it/atena`,
    });
    if (error) console.error('❌ Resend error (welcome):', error);
    else console.log(`📧 Welcome email sent to ${email}:`, data?.id);
    return { data, error };
  } catch (err) {
    console.error('❌ Failed to send welcome email:', err);
    return { data: null, error: err };
  }
}

export async function sendCancellationEmail(email: string) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Abbonamento Atena Premium cancellato',
      html: subscriptionCancelledHTML(email),
      text: `Il tuo abbonamento Atena Premium è stato cancellato. Puoi riattivarlo in qualsiasi momento su https://atena-lex.it`,
    });
    if (error) console.error('❌ Resend error (cancel):', error);
    else console.log(`📧 Cancellation email sent to ${email}:`, data?.id);
    return { data, error };
  } catch (err) {
    console.error('❌ Failed to send cancellation email:', err);
    return { data: null, error: err };
  }
}

export async function sendSubscriptionUpdateEmail(email: string, status: string) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: '📋 Aggiornamento abbonamento Atena',
      html: subscriptionUpdatedHTML(email, status),
      text: `Lo stato del tuo abbonamento Atena è stato aggiornato a: ${status}`,
    });
    if (error) console.error('❌ Resend error (update):', error);
    else console.log(`📧 Update email sent to ${email}:`, data?.id);
    return { data, error };
  } catch (err) {
    console.error('❌ Failed to send update email:', err);
    return { data: null, error: err };
  }
}

export async function sendLegalExportEmail(email: string, content: string) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: '📄 Il tuo documento esportato da Atena',
      html: legalExportHTML(email, content),
      text: content,
    });
    if (error) console.error('❌ Resend error (export):', error);
    else console.log(`📧 Export email sent to ${email}:`, data?.id);
    return { data, error };
  } catch (err) {
    console.error('❌ Failed to send export email:', err);
    return { data: null, error: err };
  }
}
