"use client";

import { useEffect } from "react";

/**
 * The sign-in UI is a modal rendered over the landing page (see public/landing.html).
 * This route exists only as the Auth.js `signIn` target for middleware redirects;
 * it sends the user to the landing with the modal auto-opened.
 */
export default function SignInRedirect() {
  useEffect(() => {
    window.location.replace("/?signin=1");
  }, []);
  return null;
}
