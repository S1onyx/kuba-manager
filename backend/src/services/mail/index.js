import { Resend } from 'resend';
import {
  renderTemplate,
  normalizeLanguage,
  SUPPORTED_MAIL_LANGUAGES,
  DEFAULT_MAIL_LANGUAGE
} from './templates/index.js';

export { renderTemplate, normalizeLanguage, SUPPORTED_MAIL_LANGUAGES, DEFAULT_MAIL_LANGUAGE };

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM = process.env.MAIL_FROM || 'noreply@info.kunstradbasketball.de';
const REPLY_TO = process.env.MAIL_REPLY_TO || FROM;
const ADMIN_EMAILS = (process.env.ADMIN_NOTIFICATION_EMAIL || '')
  .split(',').map((e) => e.trim()).filter(Boolean);

async function send({ to, subject, text, htmlContent }) {
  const resend = getResend();
  if (!resend) { console.log('[mail] RESEND_API_KEY not set, skipping:', subject); return; }
  const recipients = Array.isArray(to) ? to : [to];
  const { error } = await resend.emails.send({ from: FROM, to: recipients, reply_to: REPLY_TO, subject, text, html: htmlContent });
  if (error) console.error('[mail] Send error:', error);
}

export async function sendRegistrationConfirmation({ to, tournamentName, teamName, contactName, players, language }) {
  const rendered = renderTemplate('registrationSubmitted', language, { tournamentName, teamName, contactName, players });
  await send({ to, subject: rendered.subject, text: rendered.text, htmlContent: rendered.html });
}

export async function sendRegistrationApproved({ to, tournamentName, teamName, contactName, language }) {
  const rendered = renderTemplate('registrationApproved', language, { tournamentName, teamName, contactName });
  await send({ to, subject: rendered.subject, text: rendered.text, htmlContent: rendered.html });
}

export async function sendRegistrationRejected({ to, tournamentName, teamName, contactName, language }) {
  const rendered = renderTemplate('registrationRejected', language, { tournamentName, teamName, contactName });
  await send({ to, subject: rendered.subject, text: rendered.text, htmlContent: rendered.html });
}

// Admin-Benachrichtigung geht an den Veranstalter und bleibt bewusst immer Deutsch.
export async function sendRegistrationNotification({ tournamentName, teamName, contactName, contactEmail, players }) {
  if (!ADMIN_EMAILS.length) return;
  const rendered = renderTemplate('adminNotification', DEFAULT_MAIL_LANGUAGE, { tournamentName, teamName, contactName, contactEmail, players });
  await send({ to: ADMIN_EMAILS, subject: rendered.subject, text: rendered.text, htmlContent: rendered.html });
}
