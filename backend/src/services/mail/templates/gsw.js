import { html, pill, infoRow, playerRowsHtml, playersText, playerNamesText } from './layout.js';

const LANG = 'gsw';

export function registrationSubmitted({ tournamentName, teamName, contactName, players }) {
  return {
    subject: `Dini Aamäldig isch iitroffe – ${tournamentName}`,
    text: `Hallo ${contactName},\n\ndini Aamäldig für "${tournamentName}" isch bi üs iitroffe.\n\nTeam: ${teamName}\nSpieler: ${playersText(players)}\n\nMir luege das no aa und mäude üs bald wieder.\n\nFründlichi Grüess\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Aamäldig iitroffe',
      preheader: `Dini Aamäldig für ${tournamentName} isch bi üs aachoo.`,
      body: `
        <p style="margin:0 0 20px;">Hallo <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">dini Aamäldig für s Turnier isch bi üs iitroffe. Mir luege sie no aa und gänd dir so schnell wie möglich Bscheid.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnier', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Team', teamName)}
            ${infoRow('Status', pill('Hängig', 'rgba(255,171,64,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Aagmäldeti Spieler</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Bi Frooge antwort eifach uf die Mail.</p>
      `
    })
  };
}

export function registrationApproved({ tournamentName, teamName, contactName }) {
  return {
    subject: `Dini Aamäldig isch bestätigt – ${tournamentName}`,
    text: `Hallo ${contactName},\n\nGratulation! Dis Team "${teamName}" isch für "${tournamentName}" offiziell bestätigt. Mir fröid üs uf euch!\n\nFründlichi Grüess\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Ihr sind debii!',
      preheader: `S Team ${teamName} isch für ${tournamentName} bestätigt.`,
      body: `
        <p style="margin:0 0 20px;">Hallo <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:16px;">Gratulation – ües Team isch debii!</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnier', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Team', teamName)}
            ${infoRow('Status', pill('Bestätigt ✓', 'rgba(64,200,120,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;">Mee Infos zum Turnier findsch uf <a href="https://kunstradbasketball.de" style="color:#7cb9ff;">kunstradbasketball.de</a>.</p>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Mir fröid üs uf euch!</p>
      `
    })
  };
}

export function registrationRejected({ tournamentName, teamName, contactName }) {
  return {
    subject: `Dini Aamäldig – ${tournamentName}`,
    text: `Hallo ${contactName},\n\nleider chönd mir dis Team "${teamName}" für "${tournamentName}" nöd berücksichtige.\n\nBi Frooge antwort eifach uf die Mail.\n\nFründlichi Grüess\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Wäg diniir Aamäldig',
      preheader: `Info zu diniir Aamäldig für ${tournamentName}.`,
      body: `
        <p style="margin:0 0 20px;">Hallo <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">leider chönd mir dis Team für das Turnier nöd berücksichtige.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnier', tournamentName)}
            ${infoRow('Team', teamName)}
          </tbody>
        </table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Bi Frooge antwort eifach uf die Mail – mir hälfe gern wiiter.</p>
      `
    })
  };
}

export function adminNotification({ tournamentName, teamName, contactName, contactEmail, players }) {
  return {
    subject: `Nöji Aamäldig: ${teamName} – ${tournamentName}`,
    text: `Nöji Aamäldig:\n\nTurnier: ${tournamentName}\nTeam: ${teamName}\nKontakt: ${contactName} <${contactEmail}>\nSpieler: ${playerNamesText(players)}`,
    html: html({
      lang: LANG,
      title: 'Nöji Aamäldig iitroffe',
      preheader: `${teamName} het sich für ${tournamentName} aagmäldet.`,
      body: `
        <p style="margin:0 0 24px;">E nöji Aamäldig isch iitroffe:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnier', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Team', teamName)}
            ${infoRow('Kontakt', `${contactName} &lt;<a href="mailto:${contactEmail}" style="color:#7cb9ff;">${contactEmail}</a>&gt;`)}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Spieler</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Bestätige oder ablehne im <a href="https://admin.kunstradbasketball.de" style="color:#7cb9ff;">Admin-Panel</a>.</p>
      `
    })
  };
}
