import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NodemailerProvider from "next-auth/providers/nodemailer";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";

// This file runs in the Node.js runtime only (API routes).
// Middleware uses auth.config.ts which is edge-safe (no nodemailer).
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      // On sign-in, user object is present — copy id and role into the JWT
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "STAFF";
      }
      return token;
    },
    session({ session, token }) {
      // JWT strategy: session is built from token, not DB user
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [
    NodemailerProvider({
      id: "resend", // matches signIn("resend", ...) in login/page.tsx
      // Resend SMTP relay — port 587 with STARTTLS (more firewall-friendly than 465)
      server: {
        host: "smtp.resend.com",
        port: 587,
        secure: false,
        auth: {
          user: "resend",
          pass: process.env.AUTH_RESEND_KEY,
        },
      },
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    }),
  ],
});
