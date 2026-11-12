import { env } from './env';

/**
 * Transactional email through Resend's HTTP API (no SDK needed).
 *
 * Without RESEND_API_KEY: in development the message is printed to the server
 * log so links stay clickable locally; in production it throws, and callers
 * decide whether that should fail the request.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain-text body. Also used to build the simple HTML version. */
  text: string;
  /** Optional call-to-action rendered as a button in the HTML version. */
  action?: { label: string; url: string };
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderEmailHtml(message: EmailMessage): string {
  const paragraphs = message.text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  const button = message.action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(message.action.url)}" style="background:#f59e0b;color:#1c1003;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:12px;display:inline-block">${escapeHtml(message.action.label)}</a></p>
<p style="margin:0 0 16px;font-size:13px;color:#64748b">Si el botón no funciona, copiá este link en tu navegador:<br>${escapeHtml(message.action.url)}</p>`
    : '';
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.55;color:#0f172a;max-width:520px;margin:0 auto;padding:24px">
<p style="font-size:20px;font-weight:700;margin:0 0 20px">Careff</p>
${paragraphs}${button}
</div>`;
}

function renderEmailText(message: EmailMessage): string {
  return message.action
    ? `${message.text}\n\n${message.action.label}: ${message.action.url}`
    : message.text;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const text = renderEmailText(message);

  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is not configured; cannot send email');
    }
    console.warn(
      `[email] RESEND_API_KEY not set — not sending.\nTo: ${message.to}\nSubject: ${message.subject}\n\n${text}\n`,
    );
    return;
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      text,
      html: renderEmailHtml(message),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Resend responded ${response.status}: ${detail}`);
  }
}
