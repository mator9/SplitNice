import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe NextAuth configuration.
 *
 * This file must NOT import Prisma, database adapters, or any Node-only
 * module so it can be used inside Next.js middleware (Edge Runtime).
 *
 * The full Node configuration in auth.ts spreads this and adds the
 * PrismaAdapter + JWT/session callbacks that need database access.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
