import { Resend } from 'resend';
import { env } from './env';
import { logger } from '../shared/logger';

/**
 * Email Transporter
 * 
 * Uses the Resend HTTP API (port 443) instead of SMTP (port 465/587).
 * Railway and many cloud providers block outbound SMTP ports,
 * but HTTPS is always available.
 * 
 * If RESEND_API_KEY is configured, uses real email delivery.
 * Otherwise, logs email content to console (dev convenience).
 */

const apiKey = env.SMTP_PASS; // Reuse the same env var — the value is the Resend API key
const isConfigured = Boolean(apiKey && apiKey !== 're_YOUR_API_KEY_HERE');

let resend: Resend | null = null;

if (isConfigured) {
  resend = new Resend(apiKey);
  logger.info('✅ Resend email client initialized (HTTP API)');
} else {
  logger.info('📧 Email not configured — emails will be logged to console');
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  const { to, subject, html } = options;

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: env.SMTP_FROM,
        to: [to],
        subject,
        html,
      });

      if (error) {
        logger.error({ error, to, subject }, '❌ Resend API returned an error');
        throw new Error(error.message);
      }

      logger.info({ emailId: data?.id, to }, '📧 Email sent successfully via Resend');
    } catch (err: any) {
      logger.error({ err, to, subject }, '❌ Failed to send email');
      throw err;
    }
  } else {
    // Dev fallback: log to console
    logger.info(
      { to, subject },
      `📧 [DEV EMAIL — Not configured]\n` +
      `  To: ${to}\n` +
      `  Subject: ${subject}\n` +
      `  Body (HTML): ${html.substring(0, 200)}...`
    );
  }
}
