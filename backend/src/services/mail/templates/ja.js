import { html, pill, infoRow, playerRowsHtml, playersText, playerNamesText } from './layout.js';

const LANG = 'ja';

export function registrationSubmitted({ tournamentName, teamName, contactName, players }) {
  return {
    subject: `お申し込みを受け付けました – ${tournamentName}`,
    text: `${contactName} 様\n\n「${tournamentName}」へのお申し込みを受け付けました。\n\nチーム: ${teamName}\n選手: ${playersText(players)}\n\n内容を確認のうえ、追ってご連絡いたします。\n\nよろしくお願いいたします\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'お申し込みを受け付けました',
      preheader: `${tournamentName} へのお申し込みが届きました。`,
      body: `
        <p style="margin:0 0 20px;"><strong style="color:#fff;">${contactName}</strong> 様</p>
        <p style="margin:0 0 24px;">大会へのお申し込みを正常に受け付けました。内容を確認のうえ、できるだけ早くご連絡いたします。</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('大会', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('チーム', teamName)}
            ${infoRow('ステータス', pill('確認中', 'rgba(255,171,64,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">お申し込み選手</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">ご質問がございましたら、このメールにご返信ください。</p>
      `
    })
  };
}

export function registrationApproved({ tournamentName, teamName, contactName }) {
  return {
    subject: `お申し込みが確定しました – ${tournamentName}`,
    text: `${contactName} 様\n\nおめでとうございます！チーム「${teamName}」の「${tournamentName}」への参加が正式に確定しました。お会いできるのを楽しみにしております！\n\nよろしくお願いいたします\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: '参加決定！',
      preheader: `チーム ${teamName} の ${tournamentName} への参加が確定しました。`,
      body: `
        <p style="margin:0 0 20px;"><strong style="color:#fff;">${contactName}</strong> 様</p>
        <p style="margin:0 0 24px;font-size:16px;">おめでとうございます！チームの参加が決定しました！</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('大会', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('チーム', teamName)}
            ${infoRow('ステータス', pill('確定 ✓', 'rgba(64,200,120,0.25)'))}
          </tbody>
        </table>
        <p style="margin:0 0 12px;">大会の詳細情報は <a href="https://kunstradbasketball.de" style="color:#7cb9ff;">kunstradbasketball.de</a> でご覧いただけます。</p>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">お会いできるのを楽しみにしております！</p>
      `
    })
  };
}

export function registrationRejected({ tournamentName, teamName, contactName }) {
  return {
    subject: `お申し込みについて – ${tournamentName}`,
    text: `${contactName} 様\n\n誠に残念ながら、チーム「${teamName}」の「${tournamentName}」への参加をお受けすることができません。\n\nご質問がございましたら、このメールにご返信ください。\n\nよろしくお願いいたします\nKunstrad Basketball`,
    html: html({
      lang: LANG,
      title: 'お申し込みについて',
      preheader: `${tournamentName} へのお申し込みに関するご案内です。`,
      body: `
        <p style="margin:0 0 20px;"><strong style="color:#fff;">${contactName}</strong> 様</p>
        <p style="margin:0 0 24px;">誠に残念ながら、チームの本大会への参加をお受けすることができません。</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('大会', tournamentName)}
            ${infoRow('チーム', teamName)}
          </tbody>
        </table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;">ご質問がございましたら、このメールにご返信ください。喜んでお手伝いいたします。</p>
      `
    })
  };
}

export function adminNotification({ tournamentName, teamName, contactName, contactEmail, players }) {
  return {
    subject: `新規お申し込み: ${teamName} – ${tournamentName}`,
    text: `新規お申し込み:\n\n大会: ${tournamentName}\nチーム: ${teamName}\n連絡先: ${contactName} <${contactEmail}>\n選手: ${playerNamesText(players)}`,
    html: html({
      lang: LANG,
      title: '新規お申し込みを受信',
      preheader: `${teamName} が ${tournamentName} に申し込みました。`,
      body: `
        <p style="margin:0 0 24px;">新規お申し込みを受信しました:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.2);border-radius:10px;padding:20px;margin-bottom:24px;">
          <tbody>
            ${infoRow('大会', `<strong style="color:#fff;">${tournamentName}</strong>`)}
            ${infoRow('チーム', teamName)}
            ${infoRow('連絡先', `${contactName} &lt;<a href="mailto:${contactEmail}" style="color:#7cb9ff;">${contactEmail}</a>&gt;`)}
          </tbody>
        </table>
        <p style="margin:0 0 12px;color:rgba(255,255,255,0.6);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">選手</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tbody>${playerRowsHtml(players)}</tbody></table>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;"><a href="https://admin.kunstradbasketball.de" style="color:#7cb9ff;">管理パネル</a>で承認または却下してください。</p>
      `
    })
  };
}
