/**
 * Standalone SMTP test — run with: node scripts/test-email.js
 *
 * Tests the exact same nodemailer config used in lib/auth.ts.
 * Run this BEFORE debugging Next.js so you can see raw SMTP errors.
 *
 * Requires: npm install nodemailer (already in package.json if auth is wired)
 * Reads: AUTH_RESEND_KEY and EMAIL_FROM from .env.local
 */

const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// ── Load .env.local manually ──────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) {
      const val = rest.join("=").trim().replace(/^["']|["']$/g, ""); // strip surrounding quotes
      process.env[key.trim()] = val;
    }
  }
  console.log("✓ Loaded .env.local\n");
} else {
  console.error("✗ .env.local not found — set AUTH_RESEND_KEY manually\n");
}

const RESEND_KEY = process.env.AUTH_RESEND_KEY;
const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
const TO = process.argv[2] ?? FROM; // pass a target email as arg, falls back to FROM

if (!RESEND_KEY) {
  console.error("✗ AUTH_RESEND_KEY is not set. Check your .env.local");
  process.exit(1);
}

console.log(`Sending test email:
  From: ${FROM}
  To:   ${TO}
`);

// ── Test 1: Port 587 (STARTTLS) ───────────────────────────────────────────────
async function testPort(port, secure) {
  const label = `smtp.resend.com:${port} (${secure ? "SSL" : "STARTTLS"})`;
  console.log(`Testing ${label} ...`);

  const transport = nodemailer.createTransport({
    host: "smtp.resend.com",
    port,
    secure,
    auth: { user: "resend", pass: RESEND_KEY },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    debug: true,    // prints SMTP conversation
    logger: false,  // set true for full logs
  });

  try {
    await transport.verify();
    console.log(`  ✓ ${label} — connection OK`);

    const info = await transport.sendMail({
      from: FROM,
      to: TO,
      subject: "OCONUS App — SMTP test",
      text: "If you received this, nodemailer SMTP is working.",
    });
    console.log(`  ✓ Email sent! Message ID: ${info.messageId}\n`);
    return true;
  } catch (err) {
    console.error(`  ✗ ${label} — FAILED`);
    console.error(`    ${err.code ?? err.message}\n`);
    return false;
  }
}

(async () => {
  // Try 587 first (STARTTLS — most firewalls allow it)
  const ok587 = await testPort(587, false);
  if (ok587) process.exit(0);

  // Fall back to 465 (SSL)
  const ok465 = await testPort(465, true);
  if (ok465) process.exit(0);

  console.log(`
Both SMTP ports are blocked. Options:
  1. Use Gmail SMTP with an App Password (see auth.ts comment)
  2. Check if a corporate VPN or router firewall is blocking port 587/465
  3. Try tethering to your phone to bypass the local network restriction
`);
  process.exit(1);
})();
