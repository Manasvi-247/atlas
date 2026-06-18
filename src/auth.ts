import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

/**
 * Full server-side Auth.js instance: the edge-safe config plus the Prisma
 * adapter (persists users/accounts). Use `auth()` in server components and
 * route handlers; `handlers` powers /api/auth/[...nextauth].
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
});
