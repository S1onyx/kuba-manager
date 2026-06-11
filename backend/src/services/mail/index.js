import nodemailer from 'nodemailer';

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    return null;
  }

  return { transport: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }), from };
}

export async function sendRegistrationConfirmation({ to, tournamentName, teamName, contactName, players }) {
  const cfg = createTransport();
  if (!cfg) {
    console.log('[mail] SMTP not configured, skipping confirmation email');
    return;
  }

  const playerList = players.map((p, i) => `  ${i + 1}. ${p.name}${p.jerseyNumber ? ` (#${p.jerseyNumber})` : ''}${p.position ? ` – ${p.position}` : ''}`).join('\n');

  await cfg.transport.sendMail({
    from: cfg.from,
    to,
    subject: `Anmeldung bestätigt – ${tournamentName}`,
    text: [
      `Hallo ${contactName},`,
      '',
      `deine Anmeldung für das Turnier "${tournamentName}" wurde erfolgreich eingereicht.`,
      '',
      `Team: ${teamName}`,
      'Spieler:',
      playerList,
      '',
      'Wir melden uns, sobald deine Anmeldung geprüft wurde.',
      '',
      'Viele Grüße',
      'Kunstrad Basketball'
    ].join('\n'),
    html: `
      <p>Hallo ${contactName},</p>
      <p>deine Anmeldung für das Turnier <strong>${tournamentName}</strong> wurde erfolgreich eingereicht.</p>
      <p><strong>Team:</strong> ${teamName}</p>
      <p><strong>Spieler:</strong></p>
      <ol>${players.map((p) => `<li>${p.name}${p.jerseyNumber ? ` (#${p.jerseyNumber})` : ''}${p.position ? ` – ${p.position}` : ''}</li>`).join('')}</ol>
      <p>Wir melden uns, sobald deine Anmeldung geprüft wurde.</p>
      <p>Viele Grüße<br>Kunstrad Basketball</p>
    `
  });
}

export async function sendRegistrationApproved({ to, tournamentName, teamName, contactName }) {
  const cfg = createTransport();
  if (!cfg) {
    console.log('[mail] SMTP not configured, skipping approval email');
    return;
  }
  await cfg.transport.sendMail({
    from: cfg.from,
    to,
    subject: `Anmeldung bestätigt – ${tournamentName}`,
    text: [
      `Hallo ${contactName},`,
      '',
      `dein Team "${teamName}" wurde für das Turnier "${tournamentName}" offiziell bestätigt.`,
      '',
      'Wir freuen uns auf euch!',
      '',
      'Viele Grüße',
      'Kunstrad Basketball'
    ].join('\n'),
    html: `<p>Hallo ${contactName},</p><p>dein Team <strong>${teamName}</strong> wurde für das Turnier <strong>${tournamentName}</strong> offiziell bestätigt.</p><p>Wir freuen uns auf euch!</p><p>Viele Grüße<br>Kunstrad Basketball</p>`
  });
}

export async function sendRegistrationRejected({ to, tournamentName, teamName, contactName }) {
  const cfg = createTransport();
  if (!cfg) return;
  await cfg.transport.sendMail({
    from: cfg.from,
    to,
    subject: `Anmeldung – ${tournamentName}`,
    text: [
      `Hallo ${contactName},`,
      '',
      `leider können wir dein Team "${teamName}" für das Turnier "${tournamentName}" nicht berücksichtigen.`,
      '',
      'Bei Fragen melde dich gerne bei uns.',
      '',
      'Viele Grüße',
      'Kunstrad Basketball'
    ].join('\n'),
    html: `<p>Hallo ${contactName},</p><p>leider können wir dein Team <strong>${teamName}</strong> für das Turnier <strong>${tournamentName}</strong> nicht berücksichtigen.</p><p>Bei Fragen melde dich gerne bei uns.</p><p>Viele Grüße<br>Kunstrad Basketball</p>`
  });
}

export async function sendRegistrationNotification({ tournamentName, teamName, contactName, contactEmail, players }) {
  const cfg = createTransport();
  if (!cfg) return;

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_FROM;
  if (!adminEmail) return;

  const playerList = players.map((p, i) => `  ${i + 1}. ${p.name}${p.jerseyNumber ? ` (#${p.jerseyNumber})` : ''}`).join('\n');

  await cfg.transport.sendMail({
    from: cfg.from,
    to: adminEmail,
    subject: `Neue Anmeldung: ${teamName} – ${tournamentName}`,
    text: [
      `Neue Anmeldung eingegangen:`,
      '',
      `Turnier: ${tournamentName}`,
      `Team: ${teamName}`,
      `Kontakt: ${contactName} <${contactEmail}>`,
      'Spieler:',
      playerList
    ].join('\n')
  });
}
