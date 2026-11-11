import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadPermissions } from "@/lib/permissions/load";
import { routesFor } from "@/lib/permissions/routes";
import { iconCatalogue } from "@/lib/home-icons/catalogue";
import { IconLibrary } from "./IconLibrary";

/**
 * Account → Home screen icons: a picture for each page this login can open, drawn from the route
 * registry exactly as its card is, to save to a phone for a Shortcut. Open to any signed-in login:
 * it shows only the pages they can open. Nothing here opens Drive: the app serves every icon itself.
 */
export default async function HomeScreenIconsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { t } = await getT();
  const perms = await loadPermissions();
  const icons = perms ? iconCatalogue(t, perms) : [];
  const h = t.account.homeIcons;

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{h.title}</h1>
        <p className="text-sm text-muted">{h.intro}</p>
      </div>
      {icons.length === 0 ? <p className="text-sm text-muted">{h.none}</p> : <IconLibrary icons={icons} labels={h} />}
    </main>
  );
}

