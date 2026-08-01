import { sendMail } from '../../config/email';
import { env } from '../../config/env';
import { buildInvitationEmailHtml } from './email.templates';
import { logger } from '../logger';

export interface SendInvitationEmailParams {
  recipientEmail: string;
  token: string;
  orgName: string;
  inviterName: string;
  role: string;
  expiresInDays?: number;
}

/**
 * Sends an organization invitation email with a registration link.
 * 
 * Fire-and-forget: errors are logged but never propagate to the caller,
 * so invitation creation always succeeds even if email delivery fails.
 */
export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<void> {
  const { recipientEmail, token, orgName, inviterName, role, expiresInDays = 7 } = params;

  const inviteLink = `${env.FRONTEND_URL}/register?token=${encodeURIComponent(token)}`;

  const html = buildInvitationEmailHtml({
    orgName,
    inviterName,
    role,
    inviteLink,
    expiresInDays,
  });

  const subject = `You're invited to join ${orgName} on Unified Workspace`;

  try {
    await sendMail({ to: recipientEmail, subject, html });
  } catch (err: any) {
    // Fire-and-forget: log and swallow — invitation record is already persisted
    logger.error(
      { err, recipientEmail, orgName },
      '⚠️ Invitation email delivery failed — invitation record exists, user can still be re-invited'
    );
  }
}
