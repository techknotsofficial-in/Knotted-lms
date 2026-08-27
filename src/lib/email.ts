import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.EMAIL_FROM || "Knotted LMS <onboarding@resend.dev>";

export interface SendOtpEmailParams {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password" | "change-email";
}

/**
 * Send transactional OTP Email using Resend with Monochrome styling.
 * If Resend API restricts delivery (free tier account owner only), gracefully prints
 * the OTP code directly in the terminal console for instant login.
 */
export async function sendOtpEmail({ email, otp, type }: SendOtpEmailParams) {
  const subject =
    type === "sign-in"
      ? `${otp} is your Knotted login verification code`
      : `${otp} is your Knotted verification code`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Knotted Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAFA; margin: 0; padding: 40px 20px; color: #09090B;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 20px; padding: 36px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);">
    <div style="margin-bottom: 24px; text-align: center;">
      <h1 style="color: #09090B; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Knotted<span style="color: #71717A;">.</span></h1>
      <p style="color: #71717A; font-size: 13px; margin-top: 4px;">Tying knowledge into unbreakable knots</p>
    </div>

    <div style="background-color: #F4F4F5; border-radius: 14px; border: 1px solid #E4E4E7; padding: 24px; text-align: center; margin-bottom: 24px;">
      <p style="font-size: 14px; color: #71717A; margin: 0 0 12px 0;">Use the following 6-digit one-time code to authenticate your account:</p>
      <div style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #09090B; background-color: #FFFFFF; padding: 12px 24px; border-radius: 10px; border: 1px solid #E4E4E7;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #71717A; margin-top: 14px; margin-bottom: 0;">This code is valid for 10 minutes and should not be shared with anyone.</p>
    </div>

    <p style="font-size: 12px; color: #71717A; text-align: center; margin: 0;">
      If you did not request this email, you can safely ignore it.
    </p>
  </div>
</body>
</html>
  `;

  // Always log prominently to terminal for instant copy-paste in dev
  console.log(`\n======================================================`);
  console.log(`🔐 [KNOTTED AUTH OTP for ${email}]:  >>> ${otp} <<<`);
  console.log(`======================================================\n`);

  if (resend) {
    try {
      const response = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject,
        html,
      });

      if (response.error) {
        console.warn(`ℹ️ Resend notice: Free testing tier only delivers live inbox emails to account owner.`);
        console.log(`🔑 Use console OTP [${otp}] to log in as [${email}].`);
        return { success: true, mode: "console_fallback", code: otp };
      }

      return { success: true, id: response.data?.id };
    } catch (err) {
      console.warn("Resend network dispatch bypassed:", err);
      return { success: true, mode: "logged_fallback", code: otp };
    }
  }

  return { success: true, mode: "console", code: otp };
}
