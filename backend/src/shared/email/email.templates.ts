/**
 * Inline HTML email templates for transactional emails.
 * All styles are inlined for maximum email client compatibility.
 */

export interface InvitationEmailData {
  orgName: string;
  inviterName: string;
  role: string;
  inviteLink: string;
  expiresInDays: number;
}

export function buildInvitationEmailHtml(data: InvitationEmailData): string {
  const { orgName, inviterName, role, inviteLink, expiresInDays } = data;

  const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to ${orgName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                Unified Workspace
              </h1>
              <p style="margin: 6px 0 0; font-size: 12px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1.5px;">
                Organization Invitation
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 40px 24px;">
              <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
                Hi there! 👋
              </p>
              <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
                <strong style="color: #111827;">${inviterName}</strong> has invited you to join
                <strong style="color: #111827;">${orgName}</strong> as a
                <span style="display: inline-block; background-color: #eef2ff; color: #4338ca; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.3px;">${roleLabel}</span>.
              </p>
              <p style="margin: 0 0 28px; font-size: 15px; color: #374151; line-height: 1.6;">
                Click the button below to create your account and start collaborating:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.2px; box-shadow: 0 2px 6px rgba(79,70,229,0.35);">
                      Accept Invitation &amp; Register →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback Link -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 6px 0 0; font-size: 12px; color: #6366f1; word-break: break-all; line-height: 1.5;">
                ${inviteLink}
              </p>
            </td>
          </tr>

          <!-- Expiry Notice -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px;">
                <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                  ⏳ This invitation expires in <strong>${expiresInDays} days</strong>. After that, you'll need to request a new invitation from your administrator.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.5;">
                This email was sent by Unified Workspace on behalf of ${orgName}.<br>
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
