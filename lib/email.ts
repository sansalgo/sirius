import { Resend } from "resend";

// Lazily instantiated so module-load in build/test environments without
// RESEND_API_KEY set doesn't throw.
let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
  }
  return _resend;
}

const APP_NAME = "Sirius";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "noreply@sirius.app";
const SUPPORT_EMAIL = process.env.BILLING_SUPPORT_EMAIL ?? "support@sirius.app";

// ---------------------------------------------------------------------------
// Base layout
// ---------------------------------------------------------------------------

function emailLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:24px 40px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">${APP_NAME}</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f5;padding:24px 40px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#71717a;text-align:center;">
                ${APP_NAME} · Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#71717a;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function primaryButton(label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background:#18181b;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;margin:24px 0;">${label}</a>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#18181b;letter-spacing:-0.5px;">${text}</h1>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">${text}</p>`;
}

function mutedText(text: string) {
  return `<p style="margin:16px 0 0;font-size:13px;color:#71717a;">${text}</p>`;
}

// ---------------------------------------------------------------------------
// Send helper (logs in dev, sends in production)
// ---------------------------------------------------------------------------

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailArgs) {
  if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }

  await getResend().emails.send({ from: FROM_ADDRESS, to, subject, html });
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail({
  to,
  name,
  companyName,
}: {
  to: string;
  name: string;
  companyName: string;
}) {
  const html = emailLayout(`
    ${heading(`Welcome to ${APP_NAME}, ${name}!`)}
    ${paragraph(`Your workspace <strong>${companyName}</strong> is ready. You're now on the Free plan — up to 10 team seats, full access to recognition, rewards, and challenges.`)}
    ${paragraph("Start by configuring your point settings, then invite your team.")}
    ${primaryButton("Go to Dashboard", `${APP_URL}/dashboard`)}
    ${mutedText("If you didn't create this account, you can safely ignore this email.")}
  `);

  await sendEmail({ to, subject: `Welcome to ${APP_NAME}!`, html });
}

export async function sendEmployeeInvitationEmail({
  to,
  inviteeName,
  inviterName,
  companyName,
  inviteUrl,
}: {
  to: string;
  inviteeName: string;
  inviterName: string;
  companyName: string;
  inviteUrl: string;
}) {
  const html = emailLayout(`
    ${heading(`You've been invited to ${companyName}`)}
    ${paragraph(`Hi ${inviteeName},`)}
    ${paragraph(`<strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on ${APP_NAME} — a platform for employee recognition, rewards, and challenges.`)}
    ${paragraph("Click the button below to accept your invitation and set your password. This link expires in <strong>7 days</strong>.")}
    ${primaryButton("Accept Invitation", inviteUrl)}
    ${mutedText("If you weren't expecting this invitation, you can safely ignore this email.")}
  `);

  await sendEmail({
    to,
    subject: `${inviterName} invited you to join ${companyName} on ${APP_NAME}`,
    html,
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const html = emailLayout(`
    ${heading("Reset your password")}
    ${paragraph(`Hi ${name},`)}
    ${paragraph("We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.")}
    ${primaryButton("Reset Password", resetUrl)}
    ${mutedText("If you didn't request a password reset, you can safely ignore this email. Your password won't change.")}
  `);

  await sendEmail({ to, subject: `Reset your ${APP_NAME} password`, html });
}

export async function sendEmailVerificationEmail({
  to,
  name,
  verifyUrl,
}: {
  to: string;
  name: string;
  verifyUrl: string;
}) {
  const html = emailLayout(`
    ${heading("Verify your email address")}
    ${paragraph(`Hi ${name},`)}
    ${paragraph("Please verify your email address to unlock full access to your workspace.")}
    ${primaryButton("Verify Email", verifyUrl)}
    ${mutedText("This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.")}
  `);

  await sendEmail({ to, subject: `Verify your ${APP_NAME} email`, html });
}
