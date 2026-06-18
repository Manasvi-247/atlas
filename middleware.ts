import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge middleware: uses the adapter-free config so it runs on the edge runtime.
// The `authorized` callback in authConfig decides access and redirects
// unauthenticated users to /signin.
export default NextAuth(authConfig).auth;

export const config = {
  // Run on everything except Next internals, the API (routes guard themselves),
  // the static landing bundle, and files with an extension.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|landing.html|.*\\.).*)"],
};
