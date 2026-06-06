import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use the edge-safe config — nodemailer (Node.js-only) stays out of middleware.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Protect all routes except login, auth callbacks, and static assets
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|manifest.json|icons).*)"],
};
