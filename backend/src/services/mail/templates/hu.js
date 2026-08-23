import { html, pill, infoRow, playerRowsHtml, playersText, playerNamesText } from './layout.js';

const LANG = 'hu';

export function registrationSubmitted({ tournamentName, teamName, contactName, players }) {
  return {
    subject: `Nevezés beérkezett – ${tournamentName}`,
    text: `Szia ${contactName},\n\nmegérkezett a nevezésed a(z) "${tournamentName}" tornára.\n\nCsapat: ${teamName}\nJátékosok: ${playersText(players)}\n\nEllenőrizzük a nevezésedet, és hamarosan jelentkezünk.\n\nÜdvözlettel\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Nevezés beérkezett',
      preheader: `A(z) ${tournamentName} tornára való nevezésed megérkezett hozzánk.`,
      body: `
        <p style="margin:0 0 20px;">Szia <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">a nevezésed a tornára sikeresen beérkezett. Ellenőrizzük, és a lehető leghamarabb jelentkezünk.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Torna', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Csapat', teamName)}
            ${infoRow('Állapot', pill('Függőben', 'rgba(255,171,64,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Nevezett játékosok</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Ha kérdésed van, egyszerűen válaszolj erre a levélre.</p>
      `
    })
  };
}

export function registrationApproved({ tournamentName, teamName, contactName }) {
  return {
    subject: `Nevezés megerősítve – ${tournamentName}`,
    text: `Szia ${contactName},\n\nGratulálunk! A(z) "${teamName}" csapatod hivatalosan is részt vesz a(z) "${tournamentName}" tornán. Már várunk titeket!\n\nÜdvözlettel\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Ott vagytok!',
      preheader: `A(z) ${teamName} csapat részt vesz a(z) ${tournamentName} tornán.`,
      body: `
        <p style="margin:0 0 20px;">Szia <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:16px;">Gratulálunk – a csapatotok ott lesz!</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Torna', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Csapat', teamName)}
            ${infoRow('Állapot', pill('Megerősítve ✓', 'rgba(64,200,120,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;">A tornával kapcsolatos további információkat a <a href="https://kunstradbasketball.de" style="color:#7cb9ff;">kunstradbasketball.de</a> oldalon találod.</p>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Már várunk titeket!</p>
      `
    })
  };
}

export function registrationRejected({ tournamentName, teamName, contactName }) {
  return {
    subject: `Nevezés – ${tournamentName}`,
    text: `Szia ${contactName},\n\nsajnos nem tudjuk figyelembe venni a(z) "${teamName}" csapatot a(z) "${tournamentName}" tornán.\n\nHa kérdésed van, válaszolj erre a levélre.\n\nÜdvözlettel\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'A nevezéseddel kapcsolatban',
      preheader: `Információ a(z) ${tournamentName} tornára való nevezésedről.`,
      body: `
        <p style="margin:0 0 20px;">Szia <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">sajnos nem tudjuk figyelembe venni a csapatodat ennél a tornánál.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Torna', tournamentName)}
            ${infoRow('Csapat', teamName)}
          </tbody>
        </table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Ha kérdésed van, egyszerűen válaszolj erre a levélre – szívesen segítünk.</p>
      `
    })
  };
}

export function adminNotification({ tournamentName, teamName, contactName, contactEmail, players }) {
  return {
    subject: `Új nevezés: ${teamName} – ${tournamentName}`,
    text: `Új nevezés:\n\nTorna: ${tournamentName}\nCsapat: ${teamName}\nKapcsolattartó: ${contactName} <${contactEmail}>\nJátékosok: ${playerNamesText(players)}`,
    html: html({
      lang: LANG,
      title: 'Új nevezés érkezett',
      preheader: `A(z) ${teamName} csapat nevezett a(z) ${tournamentName} tornára.`,
      body: `
        <p style="margin:0 0 24px;">Új nevezés érkezett:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Torna', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Csapat', teamName)}
            ${infoRow('Kapcsolattartó', `${contactName} &lt;<a href="mailto:${contactEmail}" style="color:#7cb9ff;">${contactEmail}</a>&gt;`)}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Játékosok</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Megerősítés vagy elutasítás az <a href="https://admin.kunstradbasketball.de" style="color:#7cb9ff;">admin felületen</a>.</p>
      `
    })
  };
}
