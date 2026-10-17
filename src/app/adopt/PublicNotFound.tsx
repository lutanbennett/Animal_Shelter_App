import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { HappyEndings, type RecentAdoption } from "./HappyEndings";

/**
 * The public site's "not found" page: the public header and footer, one kind
 * message and three ways on. Shared by the not-found.tsx of /adopt, /our-work,
 * /r and /e.
 *
 * It says the same thing for every missing id, on purpose. It never asks WHY
 * an id is gone: telling "adopted" from "hidden" or "deceased" would mean
 * reading the residents table, and a hidden animal is hidden for a reason
 * somebody at the shelter chose. The only data it reads is
 * `public_recent_adoptions`, the view already shown on /adopt
 * (docs/decisions/2026-10-14-public-site-visitor-fold.md).
 */
export async function PublicNotFound() {
  const [supabase, { t, locale }] = await Promise.all([createClient(), getT()]);
  const { data } = await supabase
    .from("public_recent_adoptions")
    .select("id, resident_id, name, species, profile_photo_drive_file_id, adopted_on")
    .order("adopted_on", { ascending: false })
    .limit(8)
    .returns<RecentAdoption[]>();
  const link =
    "inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary";

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:px-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{t.adopt.notFound.heading}</h1>
          <p className="text-muted">{t.adopt.notFound.body}</p>
        </div>
        <nav aria-label={t.adopt.notFound.links} className="flex flex-wrap gap-2">
          <Link href="/adopt" className={link}>{t.adopt.profile.allAnimals}</Link>
          <Link href="/our-work" className={link}>{t.adopt.ourWorkNav}</Link>
          <Link href="/" className={link}>{t.publicNav.home}</Link>
        </nav>
        <HappyEndings recent={data ?? []} t={t} locale={locale} />
      </div>
      <PublicFooter />
    </main>
  );
}
