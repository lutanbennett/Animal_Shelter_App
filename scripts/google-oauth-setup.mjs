// One-time script to mint a Google OAuth refresh token for Drive access.
//
// Usage:
//   node --env-file=.env.local scripts/google-oauth-setup.mjs
//
// Requires GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET to already
// be set (in .env.local or the environment) from a Desktop-app OAuth client
// created in Google Cloud Console. Opens a consent URL for you to visit in
// your own browser while logged into the target Google account; once you
// approve, this script's local server catches the redirect and prints the
// refresh token to paste into .env.local as GOOGLE_OAUTH_REFRESH_TOKEN.
import { google } from "googleapis";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Console output can be buffered when this script runs as a background/
// redirected process on Windows, so also mirror key output to a status file
// outside the repo that can be polled/read directly.
const statusFile = path.join(os.tmpdir(), "lanna-google-oauth-status.json");
function writeStatus(data) {
  fs.writeFileSync(statusFile, JSON.stringify(data, null, 2));
}

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET.\n" +
      "Set them in .env.local first, then run:\n" +
      "  node --env-file=.env.local scripts/google-oauth-setup.mjs",
  );
  process.exit(1);
}

const PORT = 8991;
const redirectUri = `http://127.0.0.1:${PORT}/oauth2callback`;

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive"],
});

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/oauth2callback")) {
    res.writeHead(404).end();
    return;
  }

  const url = new URL(req.url, redirectUri);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/plain" }).end(`OAuth error: ${error}`);
    console.error(`\nOAuth error: ${error}`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/plain" }).end("Missing code param.");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res
      .writeHead(200, { "Content-Type": "text/plain" })
      .end("Authenticated. You can close this tab and return to the terminal.");

    console.log("\nSuccess. Add this to .env.local:\n");
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}\n`);

    if (!tokens.refresh_token) {
      writeStatus({
        state: "error",
        message:
          "No refresh_token was returned — this happens if the account already " +
          "granted this app consent before. In Google Cloud Console, remove the " +
          "app's access under https://myaccount.google.com/permissions for the " +
          "test account, then re-run this script.",
      });
    } else {
      writeStatus({ state: "success", refresh_token: tokens.refresh_token });
    }
  } catch (err) {
    console.error("\nFailed to exchange code for tokens:", err.message);
    writeStatus({ state: "error", message: `Token exchange failed: ${err.message}` });
    res.writeHead(500).end("Token exchange failed — see terminal.");
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log("Open this URL in a browser logged into the TEST Google account:\n");
  console.log(authUrl);
  console.log(`\nWaiting for consent redirect on ${redirectUri} ...`);
  writeStatus({ state: "waiting", authUrl });
});
