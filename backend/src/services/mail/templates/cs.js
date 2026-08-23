import { html, pill, infoRow, playerRowsHtml, playersText, playerNamesText } from './layout.js';

const LANG = 'cs';

export function registrationSubmitted({ tournamentName, teamName, contactName, players }) {
  return {
    subject: `Přihláška přijata – ${tournamentName}`,
    text: `Ahoj ${contactName},\n\ntvá přihláška na turnaj "${tournamentName}" dorazila.\n\nTým: ${teamName}\nHráči: ${playersText(players)}\n\nTvou přihlášku zkontrolujeme a brzy se ozveme.\n\nS pozdravem\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Přihláška přijata',
      preheader: `Tvá přihláška na turnaj ${tournamentName} u nás dorazila.`,
      body: `
        <p style="margin:0 0 20px;">Ahoj <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">tvá přihláška na turnaj byla úspěšně přijata. Zkontrolujeme ji a co nejdříve se ti ozveme.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnaj', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Tým', teamName)}
            ${infoRow('Stav', pill('Čeká na vyřízení', 'rgba(255,171,64,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Přihlášení hráči</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">V případě dotazů jednoduše odpověz na tento e-mail.</p>
      `
    })
  };
}

export function registrationApproved({ tournamentName, teamName, contactName }) {
  return {
    subject: `Přihláška potvrzena – ${tournamentName}`,
    text: `Ahoj ${contactName},\n\nGratulujeme! Tvůj tým "${teamName}" byl oficiálně potvrzen pro turnaj "${tournamentName}". Těšíme se na vás!\n\nS pozdravem\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Jste ve hře!',
      preheader: `Tým ${teamName} byl potvrzen pro turnaj ${tournamentName}.`,
      body: `
        <p style="margin:0 0 20px;">Ahoj <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:16px;">Gratulujeme – váš tým je součástí turnaje!</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnaj', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Tým', teamName)}
            ${infoRow('Stav', pill('Potvrzeno ✓', 'rgba(64,200,120,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;">Další informace o turnaji najdeš na <a href="https://kunstradbasketball.de" style="color:#7cb9ff;">kunstradbasketball.de</a>.</p>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Těšíme se na vás!</p>
      `
    })
  };
}

export function registrationRejected({ tournamentName, teamName, contactName }) {
  return {
    subject: `Přihláška – ${tournamentName}`,
    text: `Ahoj ${contactName},\n\nbohužel nemůžeme tvůj tým "${teamName}" na turnaji "${tournamentName}" zohlednit.\n\nV případě dotazů odpověz na tento e-mail.\n\nS pozdravem\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'K tvé přihlášce',
      preheader: `Informace k tvé přihlášce na turnaj ${tournamentName}.`,
      body: `
        <p style="margin:0 0 20px;">Ahoj <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">bohužel nemůžeme tvůj tým na tomto turnaji zohlednit.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnaj', tournamentName)}
            ${infoRow('Tým', teamName)}
          </tbody>
        </table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">V případě dotazů jednoduše odpověz na tento e-mail – rádi pomůžeme.</p>
      `
    })
  };
}

export function adminNotification({ tournamentName, teamName, contactName, contactEmail, players }) {
  return {
    subject: `Nová přihláška: ${teamName} – ${tournamentName}`,
    text: `Nová přihláška:\n\nTurnaj: ${tournamentName}\nTým: ${teamName}\nKontakt: ${contactName} <${contactEmail}>\nHráči: ${playerNamesText(players)}`,
    html: html({
      lang: LANG,
      title: 'Nová přihláška přijata',
      preheader: `Tým ${teamName} se přihlásil na turnaj ${tournamentName}.`,
      body: `
        <p style="margin:0 0 24px;">Dorazila nová přihláška:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Turnaj', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Tým', teamName)}
            ${infoRow('Kontakt', `${contactName} &lt;<a href="mailto:${contactEmail}" style="color:#7cb9ff;">${contactEmail}</a>&gt;`)}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Hráči</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Potvrdit nebo zamítnout v <a href="https://admin.kunstradbasketball.de" style="color:#7cb9ff;">administračním panelu</a>.</p>
      `
    })
  };
}
