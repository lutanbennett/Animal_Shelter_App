import { google } from "googleapis";
import { loadEnv } from "./lib/env.mjs";
const env = loadEnv("test");
const oauth = new google.auth.OAuth2(env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET);
oauth.setCredentials({ refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth: oauth });
const FOLDER = "application/vnd.google-apps.folder";
const [cmd, ...a] = process.argv.slice(2);
const list = async (id) => (await drive.files.list({ q: `'${id}' in parents and trashed = false`, fields: "files(id,name,mimeType,size,modifiedTime)", pageSize: 1000 })).data.files ?? [];
async function walk(id, indent = "  ") { for (const f of await list(id)) { console.log(`${indent}${f.name}${f.mimeType === FOLDER ? "/" : `  (${f.size} B, ${f.modifiedTime})`}  [${f.id}]`); if (f.mimeType === FOLDER) await walk(f.id, indent + "  "); } }
if (cmd === "get") for (const id of a) console.log((await drive.files.get({ fileId: id, fields: "id,name,mimeType,parents,trashed" })).data);
if (cmd === "tree") for (const id of a) { console.log(`== ${id}`); await walk(id); }
