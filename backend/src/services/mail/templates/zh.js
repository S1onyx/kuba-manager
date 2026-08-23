import { html, pill, infoRow, playerRowsHtml, playersText, playerNamesText } from './layout.js';

const LANG = 'zh';

export function registrationSubmitted({ tournamentName, teamName, contactName, players }) {
  return {
    subject: `报名已收到 – ${tournamentName}`,
    text: `您好 ${contactName}，\n\n我们已收到您对"${tournamentName}"的报名。\n\n球队：${teamName}\n队员：${playersText(players)}\n\n我们将审核您的报名，并尽快与您联系。\n\n祝好\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: '报名已收到',
      preheader: `您对 ${tournamentName} 的报名已送达我们。`,
      body: `
        <p style="margin:0 0 20px;">您好 <strong style="color:#fff;">${contactName}</strong>，</p>
        <p style="margin:0 0 24px;">您的赛事报名已成功收到。我们将进行审核，并尽快通知您结果。</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('赛事', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('球队', teamName)}
            ${infoRow('状态', pill('审核中', 'rgba(255,171,64,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">已报名队员</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">如有任何疑问，直接回复本邮件即可。</p>
      `
    })
  };
}

export function registrationApproved({ tournamentName, teamName, contactName }) {
  return {
    subject: `报名已确认 – ${tournamentName}`,
    text: `您好 ${contactName}，\n\n恭喜！您的球队"${teamName}"已正式获得"${tournamentName}"的参赛资格。期待与您相见！\n\n祝好\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: '您已入选！',
      preheader: `球队 ${teamName} 已确认参加 ${tournamentName}。`,
      body: `
        <p style="margin:0 0 20px;">您好 <strong style="color:#fff;">${contactName}</strong>，</p>
        <p style="margin:0 0 24px;font-size:16px;">恭喜——您的球队已入选！</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('赛事', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('球队', teamName)}
            ${infoRow('状态', pill('已确认 ✓', 'rgba(64,200,120,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;">有关赛事的更多信息，请访问 <a href="https://kunstradbasketball.de" style="color:#7cb9ff;">kunstradbasketball.de</a>。</p>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">期待与您相见！</p>
      `
    })
  };
}

export function registrationRejected({ tournamentName, teamName, contactName }) {
  return {
    subject: `报名事宜 – ${tournamentName}`,
    text: `您好 ${contactName}，\n\n很遗憾，我们无法接受您的球队"${teamName}"参加"${tournamentName}"。\n\n如有任何疑问，请回复本邮件。\n\n祝好\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: '关于您的报名',
      preheader: `关于您对 ${tournamentName} 的报名。`,
      body: `
        <p style="margin:0 0 20px;">您好 <strong style="color:#fff;">${contactName}</strong>，</p>
        <p style="margin:0 0 24px;">很遗憾，我们无法接受您的球队参加本次赛事。</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('赛事', tournamentName)}
            ${infoRow('球队', teamName)}
          </tbody>
        </table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">如有任何疑问，请直接回复本邮件——我们很乐意为您提供帮助。</p>
      `
    })
  };
}

export function adminNotification({ tournamentName, teamName, contactName, contactEmail, players }) {
  return {
    subject: `新报名：${teamName} – ${tournamentName}`,
    text: `新报名：\n\n赛事：${tournamentName}\n球队：${teamName}\n联系人：${contactName} <${contactEmail}>\n队员：${playerNamesText(players)}`,
    html: html({
      lang: LANG,
      title: '收到新报名',
      preheader: `${teamName} 已报名参加 ${tournamentName}。`,
      body: `
        <p style="margin:0 0 24px;">收到一份新报名：</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('赛事', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('球队', teamName)}
            ${infoRow('联系人', `${contactName} &lt;<a href="mailto:${contactEmail}" style="color:#7cb9ff;">${contactEmail}</a>&gt;`)}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">队员</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">请在<a href="https://admin.kunstradbasketball.de" style="color:#7cb9ff;">管理面板</a>中确认或拒绝。</p>
      `
    })
  };
}
