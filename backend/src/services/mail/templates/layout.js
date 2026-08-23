// Gemeinsames HTML-Layout und Bausteine fuer alle Mail-Templates.
// Das Styling entspricht dem bisherigen Design (dunkles Turnier-Layout).

export function html({ lang = 'de', title, preheader, body }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0b1a2b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1a2b;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#0f2240;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1a3a6e,#0d2347);padding:32px 40px;">
          <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Kunstrad Basketball</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">${title}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px;color:#c8d8f0;font-size:15px;line-height:1.7;">${body}</td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;">Kunstrad Basketball · <a href="https://kunstradbasketball.de" style="color:rgba(255,255,255,0.4);">kunstradbasketball.de</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function pill(text, color) {
  return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${color};font-size:12px;font-weight:600;letter-spacing:0.06em;">${text}</span>`;
}

export function infoRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;color:rgba(255,255,255,0.45);font-size:13px;white-space:nowrap;padding-right:16px;">${label}</td>
    <td style="padding:8px 0;color:#e0ecff;font-size:14px;">${value}</td>
  </tr>`;
}

export function playerRowsHtml(players = []) {
  return players
    .map(
      (p, i) =>
        `<tr><td style="padding:4px 0;color:rgba(255,255,255,0.45);font-size:13px;">${i + 1}.</td><td style="padding:4px 8px;color:#e0ecff;font-size:14px;">${p.name}</td><td style="padding:4px 0;color:rgba(255,255,255,0.4);font-size:13px;">${p.jerseyNumber ? `#${p.jerseyNumber}` : '–'}</td></tr>`
    )
    .join('');
}

export function playersText(players = []) {
  return players.map((p) => `${p.name}${p.jerseyNumber ? ` #${p.jerseyNumber}` : ''}`).join(', ');
}

export function playerNamesText(players = []) {
  return players.map((p) => p.name).join(', ');
}
