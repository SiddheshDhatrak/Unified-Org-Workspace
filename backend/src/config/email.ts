import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from '../shared/logger';

/**
 * SMTP Email Transporter
 * 
 * If SMTP_HOST is configured, uses real SMTP delivery.
 * Otherwise, logs email content to console (dev/eval convenience).
 */

const isSmtpConfigured = Boolean(env.SMTP_HOST);

let transporter: nodemailer.Transporter | null = null;

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: (env.SMTP_USER && env.SMTP_PASS)
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
  });

  // Verify connection on boot
  transporter.verify()
    .then(() => logger.info('✅ SMTP transporter verified and ready'))
    .catch((err) => logger.warn({ err }, '⚠️ SMTP transporter verification failed — emails may not be delivered'));
} else {
  logger.info('📧 SMTP not configured — emails will be logged to console');
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  const { to, subject, html } = options;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      });
      logger.info({ messageId: info.messageId, to }, '📧 Email sent successfully');
    } catch (err: any) {
      logger.error({ err, to, subject }, '❌ Failed to send email');
      throw err;
    }
  } else {
    // Dev fallback: log to console
    logger.info(
      { to, subject },
      `📧 [DEV EMAIL — SMTP not configured]\n` +
      `  To: ${to}\n` +
      `  Subject: ${subject}\n` +
      `  Body (HTML): ${html.substring(0, 200)}...`
    );
  }
}
