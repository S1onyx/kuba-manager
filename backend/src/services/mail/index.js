import { Resend } from 'resend';

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM = process.env.MAIL_FROM || 'noreply@info.kunstradbasketball.de';
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;

async function send({ to, subject, text, html }) {
  const resend = getResend();
  if (!resend) {
    console.log('[mail] RESEND_API_KEY not set, skipping:', subject);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, text, html });
  if (error) console.error('[mail] Send error:', error);
}

export async function sendRegistrationConfirmation({ to, tournamentName, teamName, contactName, players }) {
  const playerList = players.map((p, i) => `${i + 1}. ${p.name}${p.jerseyNumber ? ` (#${p.jerseyNumber})` : ''}${p.position ? ` – ${p.position}` : ''}`).join('\n');
  await send({
    to,
    subject: `Anmeldung eingereicht – ${tournamentName}`,
    text: `Hallo ${contactName},\n\ndeine Anmeldung für "${tournamentName}" wurde erfolgreich eingereicht.\n\nTeam: ${teamName}\nSpieler:\n${playerList}\n\nWir melden uns nach der Prüfung.\n\nViele Grüße\nKunstrad Basketball`,
    html: `<p>Hallo ${contactName},</p><p>deine Anmeldung für <strong>${tournamentName}</strong> wurde erfolgreich eingereicht.</p><p><strong>Team:</strong> ${teamName}</p><ol>${players.map((p) => `<li>${p.name}${p.jerseyNumber ? ` (#${p.jerseyNumber})` : ''}${p.position ? ` – ${p.position}` : ''}</li>`).join('')}</ol><p>Wir melden uns nach der Prüfung.</p><p>Viele Grüße<br>Kunstrad Basketball</p>`
  });
}

export async function sendRegistrationApproved({ to, tournamentName, teamName, contactName }) {
  await send({
    to,
    subject: `Anmeldung bestätigt – ${tournamentName}`,
    text: `Hallo ${contactName},\n\ndein Team "${teamName}" wurde für "${tournamentName}" bestätigt. Wir freuen uns auf euch!\n\nViele Grüße\nKunstrad Basketball`,
    html: `<p>Hallo ${contactName},</p><p>dein Team <strong>${teamName}</strong> wurde für <strong>${tournamentName}</strong> offiziell bestätigt. Wir freuen uns auf euch!</p><p>Viele Grüße<br>Kunstrad Basketball</p>`
  });
}

export async function sendRegistrationRejected({ to, tournamentName, teamName, contactName }) {
  await send({
    to,
    subject: `Anmeldung – ${tournamentName}`,
    text: `Hallo ${contactName},\n\nleider können wir dein Team "${teamName}" für "${tournamentName}" nicht berücksichtigen.\n\nBei Fragen melde dich gerne bei uns.\n\nViele Grüße\nKunstrad Basketball`,
    html: `<p>Hallo ${contactName},</p><p>leider können wir dein Team <strong>${teamName}</strong> für <strong>${tournamentName}</strong> nicht berücksichtigen.</p><p>Bei Fragen melde dich gerne bei uns.</p><p>Viele Grüße<br>Kunstrad Basketball</p>`
  });
}

export async function sendRegistrationNotification({ tournamentName, teamName, contactName, contactEmail, players }) {
  if (!ADMIN_EMAIL) return;
  const playerList = players.map((p, i) => `${i + 1}. ${p.name}${p.jerseyNumber ? ` #${p.jerseyNumber}` : ''}`).join('\n');
  await send({
    to: ADMIN_EMAIL,
    subject: `Neue Anmeldung: ${teamName} – ${tournamentName}`,
    text: `Neue Anmeldung:\n\nTurnier: ${tournamentName}\nTeam: ${teamName}\nKontakt: ${contactName} <${contactEmail}>\nSpieler:\n${playerList}`
  });
}
