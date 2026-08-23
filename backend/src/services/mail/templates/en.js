import { html, pill, infoRow, playerRowsHtml, playersText, playerNamesText } from './layout.js';

const LANG = 'en';

export function registrationSubmitted({ tournamentName, teamName, contactName, players }) {
  return {
    subject: `Registration received – ${tournamentName}`,
    text: `Hi ${contactName},\n\nwe have received your registration for "${tournamentName}".\n\nTeam: ${teamName}\nPlayers: ${playersText(players)}\n\nWe will review your registration and get back to you soon.\n\nBest regards\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'Registration received',
      preheader: `Your registration for ${tournamentName} has reached us.`,
      body: `
        <p style="margin:0 0 20px;">Hi <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">your registration for the tournament has been received successfully. We will review it and let you know as soon as possible.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Tournament', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Team', teamName)}
            ${infoRow('Status', pill('Pending', 'rgba(255,171,64,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Registered players</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">If you have any questions, just reply to this email.</p>
      `
    })
  };
}

export function registrationApproved({ tournamentName, teamName, contactName }) {
  return {
    subject: `Registration confirmed – ${tournamentName}`,
    text: `Hi ${contactName},\n\nGreat news! Your team "${teamName}" has been officially confirmed for "${tournamentName}". We look forward to seeing you!\n\nBest regards\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'You are in!',
      preheader: `Team ${teamName} has been confirmed for ${tournamentName}.`,
      body: `
        <p style="margin:0 0 20px;">Hi <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:16px;">Congratulations – your team is in!</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Tournament', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Team', teamName)}
            ${infoRow('Status', pill('Confirmed ✓', 'rgba(64,200,120,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;">You can find more information about the tournament at <a href="https://kunstradbasketball.de" style="color:#7cb9ff;">kunstradbasketball.de</a>.</p>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">We look forward to seeing you!</p>
      `
    })
  };
}

export function registrationRejected({ tournamentName, teamName, contactName }) {
  return {
    subject: `Registration – ${tournamentName}`,
    text: `Hi ${contactName},\n\nunfortunately we cannot consider your team "${teamName}" for "${tournamentName}".\n\nIf you have any questions, just reply to this email.\n\nBest regards\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'About your registration',
      preheader: `Information about your registration for ${tournamentName}.`,
      body: `
        <p style="margin:0 0 20px;">Hi <strong style="color:#fff;">${contactName}</strong>,</p>
        <p style="margin:0 0 24px;">unfortunately we cannot consider your team for this tournament.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Tournament', tournamentName)}
            ${infoRow('Team', teamName)}
          </tbody>
        </table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">If you have any questions, just reply to this email – we are happy to help.</p>
      `
    })
  };
}

export function adminNotification({ tournamentName, teamName, contactName, contactEmail, players }) {
  return {
    subject: `New registration: ${teamName} – ${tournamentName}`,
    text: `New registration:\n\nTournament: ${tournamentName}\nTeam: ${teamName}\nContact: ${contactName} <${contactEmail}>\nPlayers: ${playerNamesText(players)}`,
    html: html({
      lang: LANG,
      title: 'New registration received',
      preheader: `${teamName} has registered for ${tournamentName}.`,
      body: `
        <p style="margin:0 0 24px;">A new registration has been received:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('Tournament', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('Team', teamName)}
            ${infoRow('Contact', `${contactName} &lt;<a href="mailto:${contactEmail}" style="color:#7cb9ff;">${contactEmail}</a>&gt;`)}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Players</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">Confirm or reject in the <a href="https://admin.kunstradbasketball.de" style="color:#7cb9ff;">admin panel</a>.</p>
      `
    })
  };
}
