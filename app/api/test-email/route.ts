import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  const apiKey = process.env.AUTH_RESEND_KEY;

  if (!apiKey || apiKey === "re_xxxx") {
    return NextResponse.json({ error: "AUTH_RESEND_KEY is not set or still placeholder" });
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "dgogats@gmail.com",
      subject: "Test from Ops app",
      text: "If you got this, Resend is working.",
    });

    if (error) return NextResponse.json({ error });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
