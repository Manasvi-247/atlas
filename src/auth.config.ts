import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe auth config (no database adapter) — shared by the middleware and
 * the full server config. Keeps the Prisma adapter out of the edge runtime.
 */
export const authConfig = {
  providers: [Google],
  pages: { signIn: "/signin" },
  session: { strategy: "jwt" },
  callbacks: {
    // Carry the user id from the adapter onto the JWT, then expose it on the session.
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token?.id && session.user) session.user.id = token.id as string;
      return session;
    },
    // Gatekeeper used by the middleware. Public paths are open; everything else
    // requires a signed-in user (Auth.js redirects to the signIn page).
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/" ||
        pathname === "/signin" ||
        pathname.startsWith("/landing");
      if (isPublic) return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
