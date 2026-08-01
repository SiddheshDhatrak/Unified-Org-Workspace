import { env } from './env';
import { logger } from '../shared/logger';

/**
 * Email Transporter — Brevo (Sendinblue) HTTP API
 * 
 * Uses Brevo's transactional email API over HTTPS (port 443).
 * Railway blocks outbound SMTP ports (465/587), so we use the HTTP API instead.
 * 
 * If SMTP_PASS (Brevo API key) is configured, uses real email delivery.
 * Otherwise, logs email content to console (dev convenience).
 */

const apiKey = env.SMTP_PASS;
const isConfigured = Boolean(apiKey && !apiKey.includes('YOUR_API_KEY_HERE'));

if (isConfigured) {
  logger.info('✅ Brevo email client initialized (HTTP API)');
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

  if (isConfigured) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey!,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: env.SMTP_FROM, name: 'Unified Workspace' },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error({ status: response.status, errorBody, to, subject }, '❌ Brevo API returned an error');
        throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json() as any;
      logger.info({ messageId: data.messageId, to }, '📧 Email sent successfully via Brevo');
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
