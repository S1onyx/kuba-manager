import { html, pill, infoRow, playerRowsHtml, playersText, playerNamesText } from './layout.js';

const LANG = 'de';

export function registrationSubmitted({ tournamentName, teamName, contactName, players }) {
  return {
    subject: `Anmeldung eingereicht – ${tournamentName}`,
    text: `Hallo ${contactName},\n\ndeine Anmeldung für "${tournamentName}" ist eingegangen.\n\nTeam: ${teamName}\nSpieler: ${playersText(players)}\n\nWir prüfen deine Anmeldung und melden uns bald.\n\nViele Grüße\nKunstrad Basketball`,
    html: html({
      lang: LANG,
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
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Bei Fragen antworte einfach auf diese Mail.</p>
      `
    })
  };
}

export function registrationApproved({ tournamentName, teamName, contactName }) {
  return {
    subject: `Anmeldung bestätigt – ${tournamentName}`,
    text: `Hallo ${contactName},\n\nGlückwunsch! Dein Team "${teamName}" wurde für "${tournamentName}" offiziell bestätigt. Wir freuen uns auf euch!\n\nViele Grüße\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Ihr seid dabei!',
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
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Wir freuen uns auf euch!</p>
      `
    })
  };
}

export function registrationRejected({ tournamentName, teamName, contactName }) {
  return {
    subject: `Anmeldung – ${tournamentName}`,
    text: `Hallo ${contactName},\n\nleider können wir dein Team "${teamName}" für "${tournamentName}" nicht berücksichtigen.\n\nBei Fragen antworte auf diese Mail.\n\nViele Grüße\nKunstrad Basketball`,
    html: html({
      lang: LANG,
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
  };
}

export function adminNotification({ tournamentName, teamName, contactName, contactEmail, players }) {
  return {
    subject: `Neue Anmeldung: ${teamName} – ${tournamentName}`,
    text: `Neue Anmeldung:\n\nTurnier: ${tournamentName}\nTeam: ${teamName}\nKontakt: ${contactName} <${contactEmail}>\nSpieler: ${playerNamesText(players)}`,
    html: html({
      lang: LANG,
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
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Bestätigen oder ablehnen im <a href="https://admin.kunstradbasketball.de" style="color:#7cb9ff;">Admin-Panel</a>.</p>
      `
    })
  };
}
