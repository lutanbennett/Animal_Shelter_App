/**
 * Options for the Supabase auth cookie on all three client factories
 * (browser, server, proxy). `secure` keeps it off plain HTTP; it is
 * production-only because a Secure cookie is not sent to
 * http://localhost, which would sign every local session out. The Pi's
 * `next start` speaks HTTP behind the tunnel, but the flag is just an
 * attribute on Set-Cookie, and visitors reach it over HTTPS.
 */
export const authCookieOptions = {
  secure: process.env.NODE_ENV === "production",
};
