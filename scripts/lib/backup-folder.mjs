// Where the backups live, decided in one place. scripts/backup.mjs (uploads) and
// checkBackup() in src/lib/status/health.ts (looks) both call this, so the two
// cannot disagree about the rule; they can only be given different settings,
// and `source` says which setting each used so that shows up in logs and on the tile.
//
//   BACKUP_DRIVE_FOLDER_ID set          -> that folder, used as is ("explicit")
//   else GOOGLE_DRIVE_ROOT_FOLDER_ID    -> the folder named Backups under it ("root")
//   neither                             -> nothing ("none")
export function resolveBackupFolder(env) {
  const explicit = env.BACKUP_DRIVE_FOLDER_ID?.trim();
  if (explicit) return { source: "explicit", folderId: explicit, rootId: null };
  const rootId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim();
  if (rootId) return { source: "root", folderId: null, rootId };
  return { source: "none", folderId: null, rootId: null };
}

/** One line saying which setting was used, for the backup log and the status tile. */
export function describeBackupFolder(r) {
  if (r.source === "explicit") return "BACKUP_DRIVE_FOLDER_ID (the folder named directly)";
  if (r.source === "root") return "the Backups folder under GOOGLE_DRIVE_ROOT_FOLDER_ID (BACKUP_DRIVE_FOLDER_ID is not set here)";
  return "no folder setting";
}
