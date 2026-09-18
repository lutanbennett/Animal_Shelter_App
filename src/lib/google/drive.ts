import { google } from "googleapis";

/**
 * Google Drive access for the shelter's Google account.
 *
 * The requirements doc (Section 5.2) assumed a Google Workspace service
 * account with domain-wide delegation. The shelter's storage is a personal
 * Gmail account (lannacareforanimals@gmail.com in production; a dev account
 * during development — see docs/decisions.md), and domain-wide delegation
 * doesn't exist for personal accounts. Instead, this uses OAuth2 with a
 * refresh token obtained once (via the standard OAuth consent flow, run
 * manually against that Google account) and stored as an env var — the
 * server then acts as that account indefinitely without further per-user
 * OAuth friction.
 *
 * Required env vars: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET,
 * GOOGLE_OAUTH_REFRESH_TOKEN. See .env.example.
 */
function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  );

  client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });

  return client;
}

export function getDriveClient() {
  return google.drive({ version: "v3", auth: getOAuthClient() });
}
