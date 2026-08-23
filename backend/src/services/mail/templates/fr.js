import { html, pill, infoRow, playerRowsHtml, playersText, playerNamesText } from './layout.js';

const LANG = 'fr';

export function registrationSubmitted({ tournamentName, teamName, contactName, players }) {
  return {
    subject: `Inscription reçue – ${tournamentName}`,
    text: `Bonjour ${contactName},\n\nnous avons bien reçu ton inscription pour « ${tournamentName} ».\n\nÉquipe : ${teamName}\nJoueuses et joueurs : ${playersText(players)}\n\nNous allons vérifier ton inscription et te donnerons une réponse très vite.\n\nSportivement\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Inscription reçue',
      preheader: `Ton inscription pour ${tournamentName} est bien arrivée.`,
      body: `
        <p style="margin:0 0 20px;">Bonjour <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">ton inscription au tournoi est bien arrivée. Nous allons la vérifier et te donnerons une réponse dès que possible.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Tournoi', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Équipe', teamName)}
            ${infoRow('Statut', pill('En attente', 'rgba(255,171,64,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Joueuses et joueurs inscrits</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">En cas de questions, réponds simplement à cet e-mail.</p>
      `
    })
  };
}

export function registrationApproved({ tournamentName, teamName, contactName }) {
  return {
    subject: `Inscription confirmée – ${tournamentName}`,
    text: `Bonjour ${contactName},\n\nFélicitations ! Ton équipe « ${teamName} » est officiellement confirmée pour « ${tournamentName} ». Nous nous réjouissons de vous voir !\n\nSportivement\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Vous êtes des nôtres !',
      preheader: `L’équipe ${teamName} est confirmée pour ${tournamentName}.`,
      body: `
        <p style="margin:0 0 20px;">Bonjour <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:16px;">Félicitations – votre équipe est de la partie !</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Tournoi', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Équipe', teamName)}
            ${infoRow('Statut', pill('Confirmé ✓', 'rgba(64,200,120,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;">Tu trouveras plus d’informations sur le tournoi sur <a href="https://kunstradbasketball.de" style="color:#7cb9ff;">kunstradbasketball.de</a>.</p>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Nous nous réjouissons de vous voir !</p>
      `
    })
  };
}

export function registrationRejected({ tournamentName, teamName, contactName }) {
  return {
    subject: `Inscription – ${tournamentName}`,
    text: `Bonjour ${contactName},\n\nmalheureusement, nous ne pouvons pas prendre en compte ton équipe « ${teamName} » pour « ${tournamentName} ».\n\nEn cas de questions, réponds à cet e-mail.\n\nSportivement\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Au sujet de ton inscription',
      preheader: `Information concernant ton inscription pour ${tournamentName}.`,
      body: `
        <p style="margin:0 0 20px;">Bonjour <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">malheureusement, nous ne pouvons pas prendre en compte ton équipe pour ce tournoi.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Tournoi', tournamentName)}
            ${infoRow('Équipe', teamName)}
          </tbody>
        </table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">En cas de questions, réponds simplement à cet e-mail – nous sommes là pour t’aider.</p>
      `
    })
  };
}

export function adminNotification({ tournamentName, teamName, contactName, contactEmail, players }) {
  return {
    subject: `Nouvelle inscription : ${teamName} – ${tournamentName}`,
    text: `Nouvelle inscription :\n\nTournoi : ${tournamentName}\nÉquipe : ${teamName}\nContact : ${contactName} <${contactEmail}>\nJoueuses et joueurs : ${playerNamesText(players)}`,
    html: html({
      lang: LANG,
      title: 'Nouvelle inscription reçue',
      preheader: `${teamName} s’est inscrit pour ${tournamentName}.`,
      body: `
        <p style="margin:0 0 24px;">Une nouvelle inscription est arrivée :</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Tournoi', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Équipe', teamName)}
            ${infoRow('Contact', `${contactName} &lt;<a href="mailto:${contactEmail}" style="color:#7cb9ff;">${contactEmail}</a>&gt;`)}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Joueuses et joueurs</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Confirmer ou refuser dans le <a href="https://admin.kunstradbasketball.de" style="color:#7cb9ff;">panneau d’administration</a>.</p>
      `
    })
  };
}
