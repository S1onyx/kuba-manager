import express from 'express';
import { Resend } from 'resend';

const router = express.Router();

const ADMIN_EMAILS = (process.env.ADMIN_NOTIFICATION_EMAIL || '')
  .split(',').map((e) => e.trim()).filter(Boolean);

const FROM = process.env.MAIL_FROM || 'noreply@info.kunstradbasketball.de';

// Resend inbound webhook — forwards incoming emails to admin addresses
router.post('/email', express.json(), async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !ADMIN_EMAILS.length) {
      return res.status(200).json({ ok: true });
    }

    const fromAddr = payload.from || 'Unbekannt';
    const subject = payload.subject || '(kein Betreff)';
    const textBody = payload.text || payload.html || '(kein Inhalt)';
    const toAddr = payload.to || '';

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return res.status(200).json({ ok: true });

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAILS,
      reply_to: fromAddr,
      subject: `Weiterleitung: ${subject}`,
      text: `Von: ${fromAddr}\nAn: ${toAddr}\nBetreff: ${subject}\n\n---\n\n${textBody}`,
      html: `<p><strong>Von:</strong> ${fromAddr}<br><strong>An:</strong> ${toAddr}<br><strong>Betreff:</strong> ${subject}</p><hr><div style="white-space:pre-wrap;">${textBody}</div>`
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[inbound] Fehler beim Weiterleiten:', err);
    res.status(200).json({ ok: true }); // Always 200 to Resend
  }
});

export default router;
