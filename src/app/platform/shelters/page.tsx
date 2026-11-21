import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CHOOSER_PATH } from "@/lib/auth/chooser-path";
import { getT } from "@/lib/i18n/get-t";
import { isPlatformHostname, platformHost, requestHost } from "@/lib/site-hosts";
import { createClient } from "@/lib/supabase/server";

/**
 * The shelter chooser (#apxld): the shelters this login holds a role at, each a plain link to that shelter's own
 * address (sign-in happens again there). Signed out: sent to the ordinary sign-in, which says nothing about shelters.
 * Signed in with no shelter, or on a shelter's own address: not-found, the same as an address that does not exist.
 * Every entry is a link to another address, so there is no action here that needs a card.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.productAdmin.chooser.title, robots: { index: false, follow: false } };
}

export default async function ChooserPage() {
  const h = await headers();
  if (platformHost() && !isPlatformHostname(requestHost((n) => h.get(n)) ?? "")) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(CHOOSER_PATH)}`);

  const { data } = await supabase.rpc("my_shelters");
  const rows = ((data ?? []) as { shelter_id: string; name: string; host: string }[])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  if (rows.length === 0) notFound();

  const { t } = await getT();
  const c = t.admin.productAdmin.chooser;
  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <div className="max-w-prose">
        <h1 className="text-2xl font-semibold text-foreground">{c.title}</h1>
        <p className="mt-2 text-foreground">{c.lead}</p>
      </div>
      <ul className="flex max-w-prose flex-col gap-3">
        {rows.map((r) => (
          <li key={r.shelter_id}>
            <a
              href={`https://${r.host}/`}
              className="flex items-center justify-between gap-3 rounded border border-border px-4 py-3 text-foreground hover:text-primary"
            >
              <span className="font-medium">{r.name}</span>
              <span className="text-sm text-muted">{c.open}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
