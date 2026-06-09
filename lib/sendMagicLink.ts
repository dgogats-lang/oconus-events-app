import nodemailer from "nodemailer";

/**
 * Sends a magic-link / sign-in email to the given address.
 * Uses the same Resend SMTP relay as the NextAuth provider.
 */
export async function sendMagicLink(email: string) {
  const transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 587,
    secure: false,
    auth: {
      user: "resend",
      pass: process.env.AUTH_RESEND_KEY,
    },
  });

  const appUrl = process.env.NEXTAUTH_URL ?? "https://oconus-events-app.vercel.app";

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to: email,
    subject: "You've been invited to OCONUS Events",
    text: [
      "You've been added to a trip on OCONUS Events.",
      "",
      `Sign in here: ${appUrl}/login`,
      "",
      "Enter your email address and you'll receive a sign-in link.",
    ].join("\n"),
    html: `
      <p>You've been added to a trip on <strong>OCONUS Events</strong>.</p>
      <p><a href="${appUrl}/login">Sign in to get started →</a></p>
      <p style="color:#666;font-size:12px;">Enter your email address and you'll receive a sign-in link.</p>
    `,
  });
}
