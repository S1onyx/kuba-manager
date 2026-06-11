import { Resend } from 'resend';

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM = process.env.MAIL_FROM || 'noreply@info.kunstradbasketball.de';
const ADMIN_EMAILS = (process.env.ADMIN_NOTIFICATION_EMAIL || '')
  .split(',').map((e) => e.trim()).filter(Boolean);

function html({ title, preheader, body }) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0b1a2b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1a2b;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#0f2240;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1a3a6e,#0d2347);padding:32px 40px;">
          <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Kunstrad Basketball</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">${title}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px;color:#c8d8f0;font-size:15px;line-height:1.7;">${body}</td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;">Kunstrad Basketball · <a href="https://kunstradbasketball.de" style="color:rgba(255,255,255,0.4);">kunstradbasketball.de</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function pill(text, color) {
  return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${color};font-size:12px;font-weight:600;letter-spacing:0.06em;">${text}</span>`;
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;color:rgba(255,255,255,0.45);font-size:13px;white-space:nowrap;padding-right:16px;">${label}</td>
    <td style="padding:8px 0;color:#e0ecff;font-size:14px;">${value}</td>
  </tr>`;
}

async function send({ to, subject, text, htmlContent }) {
  const resend = getResend();
  if (!resend) { console.log('[mail] RESEND_API_KEY not set, skipping:', subject); return; }
  const recipients = Array.isArray(to) ? to : [to];
  const { error } = await resend.emails.send({ from: FROM, to: recipients, reply_to: FROM, subject, text, html: htmlContent });
  if (error) console.error('[mail] Send error:', error);
}

export async function sendRegistrationConfirmation({ to, tournamentName, teamName, contactName, players }) {
  const playerRows = players.map((p, i) =>
    `<tr><td style="padding:4px 0;color:rgba(255,255,255,0.45);font-size:13px;">${i + 1}.</td><td style="padding:4px 8px;color:#e0ecff;font-size:14px;">${p.name}</td><td style="padding:4px 0;color:rgba(255,255,255,0.4);font-size:13px;">${p.jerseyNumber ? `#${p.jerseyNumber}` : '–'}</td></tr>`
  ).join('');

  await send({
    to,
    subject: `Anmeldung eingereicht – ${tournamentName}`,
    text: `Hallo ${contactName},\n\ndeine Anmeldung für "${tournamentName}" ist eingegangen.\n\nTeam: ${teamName}\nSpieler: ${players.map((p) => `${p.name}${p.jerseyNumber ? ` #${p.jerseyNumber}` : ''}`).join(', ')}\n\nWir prüfen deine Anmeldung und melden uns bald.\n\nViele Grüße\nKunstrad Basketball`,
    htmlContent: html({
      title: 'Anmeldung eingegangen',
      preheader: `Deine Anmeldung für ${tournamentName} ist bei uns angekommen.`,
      body: `
        <p style="margin:0 0 20px;">Hallo <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">deine Anmeldung für das Turnier ist erfolgreich eingegangen. Wir prüfen sie und geben dir so bald wie möglich Bescheid.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnier', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Team', teamName)}
            ${infoRow('Status', pill('Ausstehend', 'rgba(255,171,64,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Angemeldete Spieler</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRows}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Bei Fragen antworte einfach auf diese Mail.</p>
      `
    })
  });
}

export async function sendRegistrationApproved({ to, tournamentName, teamName, contactName }) {
  await send({
    to,
    subject: `✅ Anmeldung bestätigt – ${tournamentName}`,
    text: `Hallo ${contactName},\n\nGlückwunsch! Dein Team "${teamName}" wurde für "${tournamentName}" offiziell bestätigt. Wir freuen uns auf euch!\n\nViele Grüße\nKunstrad Basketball`,
    htmlContent: html({
      title: 'Ihr seid dabei! 🎉',
      preheader: `Team ${teamName} wurde für ${tournamentName} bestätigt.`,
      body: `
        <p style="margin:0 0 20px;">Hallo <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:16px;">Glückwunsch – euer Team ist dabei!</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnier', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Team', teamName)}
            ${infoRow('Status', pill('Bestätigt ✓', 'rgba(64,200,120,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;">Weitere Infos zum Turnier findest du auf <a href="https://kunstradbasketball.de" style="color:#7cb9ff;">kunstradbasketball.de</a>.</p>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Wir freuen uns auf euch! 🏀</p>
      `
    })
  });
}

export async function sendRegistrationRejected({ to, tournamentName, teamName, contactName }) {
  await send({
    to,
    subject: `Anmeldung – ${tournamentName}`,
    text: `Hallo ${contactName},\n\nleider können wir dein Team "${teamName}" für "${tournamentName}" nicht berücksichtigen.\n\nBei Fragen antworte auf diese Mail.\n\nViele Grüße\nKunstrad Basketball`,
    htmlContent: html({
      title: 'Zur deiner Anmeldung',
      preheader: `Information zu deiner Anmeldung für ${tournamentName}.`,
      body: `
        <p style="margin:0 0 20px;">Hallo <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">leider können wir dein Team für dieses Turnier nicht berücksichtigen.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnier', tournamentName)}
            ${infoRow('Team', teamName)}
          </tbody>
        </table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Bei Fragen antworte einfach auf diese Mail – wir helfen gerne weiter.</p>
      `
    })
  });
}

export async function sendRegistrationNotification({ tournamentName, teamName, contactName, contactEmail, players }) {
  if (!ADMIN_EMAILS.length) return;
  const playerRows = players.map((p, i) =>
    `<tr><td style="padding:4px 0;color:rgba(255,255,255,0.45);font-size:13px;">${i + 1}.</td><td style="padding:4px 8px;color:#e0ecff;font-size:14px;">${p.name}</td><td style="padding:4px 0;color:rgba(255,255,255,0.4);font-size:13px;">${p.jerseyNumber ? `#${p.jerseyNumber}` : '–'}</td></tr>`
  ).join('');
  await send({
    to: ADMIN_EMAILS,
    subject: `Neue Anmeldung: ${teamName} – ${tournamentName}`,
    text: `Neue Anmeldung:\n\nTurnier: ${tournamentName}\nTeam: ${teamName}\nKontakt: ${contactName} <${contactEmail}>\nSpieler: ${players.map((p) => p.name).join(', ')}`,
    htmlContent: html({
      title: 'Neue Anmeldung eingegangen',
      preheader: `${teamName} hat sich für ${tournamentName} angemeldet.`,
      body: `
        <p style="margin:0 0 24px;">Eine neue Anmeldung ist eingegangen:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnier', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Team', teamName)}
            ${infoRow('Kontakt', `${contactName} &lt;<a href="mailto:${contactEmail}" style="color:#7cb9ff;">${contactEmail}</a>&gt;`)}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Spieler</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRows}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Bestätigen oder ablehnen im <a href="https://admin.kunstradbasketball.de" style="color:#7cb9ff;">Admin-Panel</a>.</p>
      `
    })
  });
}
