// Checks that the Google Drive credentials in an env file still work:
// the refresh token mints an access token, and the root folder is there
// and not in the trash. Exits 1 if not, naming Google's reason.
//
// The deployed Workers' secrets can't be read back, so for lannacare.org
// and test.lannacare.org the same check is the line at the top of Settings
// (/admin, src/app/admin/DriveStatus.tsx). This one is for the local env
// files, and for a freshly minted token before it is set as a secret.
//
// Read-only: nothing is created in Drive. Plain fetch, like
// src/lib/google/drive.ts, rather than googleapis.
//
// Usage:
//   node --env-file=.env.local scripts/check-drive-token.mjs
//
// Background: on 2026-09-25 the token expired seven days after it was
// minted (the Drive client's project was still in Testing) and every
// upload on UAT failed before anyone noticed.

// process.exitCode rather than process.exit(): exiting with a fetch just
// finished trips a libuv assertion on Windows.
async function main() {
  const required = [
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "GOOGLE_OAUTH_REFRESH_TOKEN",
    "GOOGLE_DRIVE_ROOT_FOLDER_ID",
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    console.error(`FAIL: not set: ${missing.join(", ")}. Pass --env-file=<file>.`);
    return 1;
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const token = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !token.access_token) {
    console.error(
      `FAIL: token refresh (${tokenRes.status}): ${token.error ?? "?"}${token.error_description ? `: ${token.error_description}` : ""}`,
    );
    if (token.error === "invalid_grant") {
      console.error(
        "  The refresh token is expired or revoked. If the client's consent screen is in Testing, publish it; then mint a new one with scripts/google-oauth-setup.mjs.",
      );
    } else if (token.error === "invalid_client") {
      console.error("  The OAuth client ID/secret is wrong or the client was deleted.");
    }
    return 1;
  }
  console.log("OK: refresh token mints an access token.");

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  const rootRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(rootId)}?fields=name,trashed`,
    { headers: { Authorization: `Bearer ${token.access_token}` } },
  );
  const root = await rootRes.json().catch(() => ({}));
  if (!rootRes.ok) {
    console.error(`FAIL: root folder ${rootId} (${rootRes.status}): ${root.error?.message ?? "?"}`);
    return 1;
  }
  if (root.trashed) {
    console.error(`FAIL: root folder "${root.name}" is in the trash.`);
    return 1;
  }
  console.log(`OK: root folder "${root.name}".`);
  return 0;
}

process.exitCode = await main();
