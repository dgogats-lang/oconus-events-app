import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config — no Node.js-only modules (no nodemailer).
 * Used by middleware.ts which runs on the Edge Runtime.
 * The full config (with nodemailer provider) lives in auth.ts.
 */
export const authConfig = {
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
    error: "/login",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  providers: [], // nodemailer added in auth.ts
} satisfies NextAuthConfig;
