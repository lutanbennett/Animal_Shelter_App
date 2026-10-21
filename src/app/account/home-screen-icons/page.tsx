import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadPermissions } from "@/lib/permissions/load";
import { routesFor } from "@/lib/permissions/routes";
import { iconCatalogue } from "@/lib/home-icons/catalogue";
import { HOME_ICONS_FOLDER } from "@/lib/home-icons/folder";
import { getDriveClient } from "@/lib/google/drive";
import { IconLibrary } from "./IconLibrary";

/**
 * Account → Home screen icons: a picture for each page this login can open, drawn from the route
 * registry exactly as its card is, to save to a phone for a Shortcut. Open to any signed-in login:
 * it shows only the pages routesFor() gives them. The full set for every card sits in a shared
 * Drive folder that scripts/sync-home-icons.mjs refreshes at each release.
 */
export default async function HomeScreenIconsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { t } = await getT();
  const perms = await loadPermissions();
  const icons = iconCatalogue(t, routesFor(perms));
  const driveUrl = await findDriveFolderUrl();
  const h = t.account.homeIcons;

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{h.title}</h1>
        <p className="text-sm text-muted">{h.intro}</p>
      </div>
      {driveUrl && (
        <p className="text-sm">
          <a href={driveUrl} target="_blank" rel="noreferrer" className="font-medium text-foreground underline hover:text-primary">
            {h.driveLink}
          </a>
          <span className="block text-xs text-muted">{h.driveHint}</span>
        </p>
      )}
      {icons.length === 0 ? <p className="text-sm text-muted">{h.none}</p> : <IconLibrary icons={icons} labels={h} />}
    </main>
  );
}

/** The shared folder's address, or null when Drive is not set up or the script has not made it yet. */
async function findDriveFolderUrl(): Promise<string | null> {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) return null;
  try {
    const files = await getDriveClient().listFiles({
      q: `'${rootId}' in parents and name = '${HOME_ICONS_FOLDER}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id)",
    });
    return files[0]?.id ? `https://drive.google.com/drive/folders/${files[0].id}` : null;
  } catch {
    return null;
  }
}
