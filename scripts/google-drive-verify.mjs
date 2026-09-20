// Verifies GOOGLE_OAUTH_* env vars work against Drive, and ensures a root
// folder exists for GOOGLE_DRIVE_ROOT_FOLDER_ID (creating one if unset).
//
// Mirrors src/lib/google/drive.ts's client setup directly (rather than
// importing that .ts file) to avoid depending on Node's TS-loading behavior
// for this one-off script.
//
// Usage:
//   node --env-file=.env.local scripts/google-drive-verify.mjs
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth: oauth2Client });

const about = await drive.about.get({ fields: "user(emailAddress)" });
console.log(`Authenticated as: ${about.data.user.emailAddress}`);

let rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

if (rootFolderId) {
  const folder = await drive.files.get({
    fileId: rootFolderId,
    fields: "id, name, trashed",
  });
  console.log(`Root folder OK: "${folder.data.name}" (${folder.data.id})`);
  if (folder.data.trashed) {
    console.warn("Warning: that folder is in the trash.");
  }
} else {
  console.log("GOOGLE_DRIVE_ROOT_FOLDER_ID is not set — creating a root folder...");
  const created = await drive.files.create({
    requestBody: {
      name: "Lanna Care - TEST",
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id, name",
  });
  rootFolderId = created.data.id;
  console.log(`\nCreated folder "${created.data.name}". Add this to .env.local:\n`);
  console.log(`GOOGLE_DRIVE_ROOT_FOLDER_ID=${rootFolderId}\n`);
}

const testFile = await drive.files.create({
  requestBody: {
    name: `auth-test-${new Date().toISOString()}.txt`,
    parents: [rootFolderId],
  },
  media: {
    mimeType: "text/plain",
    body: "Google Drive auth test from the Lanna Care for Animals app setup.",
  },
  fields: "id, name, webViewLink",
});

console.log(`Test file created: ${testFile.data.name} (${testFile.data.id})`);
console.log(`View it at: ${testFile.data.webViewLink}`);
console.log("\nGoogle Drive auth is working end-to-end.");
