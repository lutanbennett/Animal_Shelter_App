import { checkDriveConnection } from "@/lib/google/drive";
import { getT } from "@/lib/i18n/get-t";

/**
 * One line on Settings saying whether the app can reach the shelter's
 * Drive. On 2026-09-25 the refresh token expired and the first anyone knew
 * was a manager's logo upload failing on UAT; this puts the same check
 * where an admin looks, before a user hits it. The detail is Google's own
 * text, shown here because an admin is who fixes it.
 *
 * Rendered inside <Suspense> so the tiles don't wait on Google.
 */
export async function DriveStatus() {
  const { t } = await getT();
  const d = t.admin.landing.drive;
  const result = await checkDriveConnection();

  if (result.ok) {
    return <p className="text-sm text-success">{d.ok}</p>;
  }
  return (
    <div className="flex flex-col gap-1 rounded border border-danger/40 bg-danger/5 px-3 py-2">
      <p className="text-sm font-medium text-danger">{result.notConnected ? d.notConnected : d.failed}</p>
      <p className="break-words text-xs text-muted">{result.detail}</p>
    </div>
  );
}
