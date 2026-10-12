// Offline check that the backup script and the status tile agree on where backups live.
// Run: node scripts/check-backup-folder.mjs
// The bug (2026-10-02 to 10-13): backup.mjs uploaded to BACKUP_DRIVE_FOLDER_ID, set only on the Pi,
// while the tile ran on the Worker without it and looked under the root. No code disagreed;
// the settings did. So this pins the single rule and that both sides use it.
import { readFileSync } from "node:fs";
import { describeBackupFolder, resolveBackupFolder } from "./lib/backup-folder.mjs";
import { RUNTIME_CONFIG } from "./lib/runtime-config.mjs";

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : ` — ${detail}`}`);
  if (!ok) failures++;
};
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

let r = resolveBackupFolder({ BACKUP_DRIVE_FOLDER_ID: "B", GOOGLE_DRIVE_ROOT_FOLDER_ID: "R" });
check("explicit id wins over the root", r.source === "explicit" && r.folderId === "B");
r = resolveBackupFolder({ GOOGLE_DRIVE_ROOT_FOLDER_ID: "R" });
check("root alone means Backups under it", r.source === "root" && r.rootId === "R");
check("blank explicit id counts as unset", resolveBackupFolder({ BACKUP_DRIVE_FOLDER_ID: "  ", GOOGLE_DRIVE_ROOT_FOLDER_ID: "R" }).source === "root");
check("nothing set is none", resolveBackupFolder({}).source === "none");
check("the description names the setting used", describeBackupFolder(resolveBackupFolder({ BACKUP_DRIVE_FOLDER_ID: "B" })).includes("BACKUP_DRIVE_FOLDER_ID"));

check("backup.mjs uses the shared rule", /resolveBackupFolder\(/.test(read("./backup.mjs")));
check("the status tile uses the shared rule", /resolveBackupFolder\(/.test(read("../src/lib/status/health.ts")));
check("neither side reads BACKUP_DRIVE_FOLDER_ID itself", !/env\.BACKUP_DRIVE_FOLDER_ID|process\.env\.BACKUP_DRIVE_FOLDER_ID/.test(read("./backup.mjs") + read("../src/lib/status/health.ts")));
const entry = RUNTIME_CONFIG.find((c) => c.name === "BACKUP_DRIVE_FOLDER_ID");
check("the setting is declared for both the Worker and the Pi", entry?.where === "both", String(entry?.where));

process.exit(failures ? 1 : 0);
