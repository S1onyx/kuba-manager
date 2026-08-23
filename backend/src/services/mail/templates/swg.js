import { html, pill, infoRow, playerRowsHtml, playersText, playerNamesText } from './layout.js';

const LANG = 'swg';

export function registrationSubmitted({ tournamentName, teamName, contactName, players }) {
  return {
    subject: `Dei Aamäldung isch eiganga – ${tournamentName}`,
    text: `Grüß di ${contactName},\n\ndei Aamäldung für "${tournamentName}" isch bei uns eiganga.\n\nTeam: ${teamName}\nSpieler: ${playersText(players)}\n\nMir schaued des no an und melded uns bald wieder.\n\nGuade Grüß\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Aamäldung eiganga',
      preheader: `Dei Aamäldung für ${tournamentName} isch bei uns aakomma.`,
      body: `
        <p style="margin:0 0 20px;">Grüß di <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">dei Aamäldung fürs Turnier isch bei uns eiganga. Mir schaued des no an und gebed dir so schnell wi möglich Bescheid.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnier', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Team', teamName)}
            ${infoRow('Status', pill('No am Läuferle', 'rgba(255,171,64,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Aagmäldete Spieler</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Wennd a Frog hasch, antwort einfach uf die Mail.</p>
      `
    })
  };
}

export function registrationApproved({ tournamentName, teamName, contactName }) {
  return {
    subject: `Dei Aamäldung isch bestätigt – ${tournamentName}`,
    text: `Grüß di ${contactName},\n\nGlickwunsch! Dei Team "${teamName}" isch für "${tournamentName}" offiziell bestätigt. Mir freied uns uf eich!\n\nGuade Grüß\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Ihr seid am Start!',
      preheader: `Des Team ${teamName} isch für ${tournamentName} bestätigt.`,
      body: `
        <p style="margin:0 0 20px;">Grüß di <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:16px;">Glickwunsch – eier Team isch am Start!</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnier', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Team', teamName)}
            ${infoRow('Status', pill('Bestätigt ✓', 'rgba(64,200,120,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;">Mehr Infos zum Turnier findsch uf <a href="https://kunstradbasketball.de" style="color:#7cb9ff;">kunstradbasketball.de</a>.</p>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Mir freied uns uf eich!</p>
      `
    })
  };
}

export function registrationRejected({ tournamentName, teamName, contactName }) {
  return {
    subject: `Dei Aamäldung – ${tournamentName}`,
    text: `Grüß di ${contactName},\n\nleider kenne mir dei Team "${teamName}" für "${tournamentName}" dies Mol ned berücksichtiga.\n\nWennd a Frog hasch, antwort einfach uf die Mail.\n\nGuade Grüß\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Zu deiner Aamäldung',
      preheader: `Info zu deiner Aamäldung für ${tournamentName}.`,
      body: `
        <p style="margin:0 0 20px;">Grüß di <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">leider kenne mir dei Team für des Turnier ned berücksichtiga.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnier', tournamentName)}
            ${infoRow('Team', teamName)}
          </tbody>
        </table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Wennd a Frog hasch, antwort einfach uf die Mail – mir helfed gern weiter.</p>
      `
    })
  };
}

export function adminNotification({ tournamentName, teamName, contactName, contactEmail, players }) {
  return {
    subject: `Neie Aamäldung: ${teamName} – ${tournamentName}`,
    text: `Neie Aamäldung:\n\nTurnier: ${tournamentName}\nTeam: ${teamName}\nKontakt: ${contactName} <${contactEmail}>\nSpieler: ${playerNamesText(players)}`,
    html: html({
      lang: LANG,
      title: 'Neie Aamäldung eiganga',
      preheader: `${teamName} hot sich für ${tournamentName} aagmäldet.`,
      body: `
        <p style="margin:0 0 24px;">A neie Aamäldung isch eiganga:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnier', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Team', teamName)}
            ${infoRow('Kontakt', `${contactName} &lt;<a href="mailto:${contactEmail}" style="color:#7cb9ff;">${contactEmail}</a>&gt;`)}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Spieler</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Bestätiga oder ablehna im <a href="https://admin.kunstradbasketball.de" style="color:#7cb9ff;">Admin-Panel</a>.</p>
      `
    })
  };
}
