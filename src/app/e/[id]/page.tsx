import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { placeName } from "@/lib/enclosures/names";
import { loadPublicEnclosure } from "@/lib/enclosures/public";
import { enclosureTagPath, isUuid, residentTagPath } from "@/lib/tags/links";
import { PublicHeader } from "@/app/adopt/PublicHeader";
import { PublicFooter } from "@/app/adopt/PublicFooter";
import { ResidentCard } from "@/app/adopt/ResidentCard";

/**
 * The address on an enclosure's QR code (src/lib/tags/links.ts), shaped
 * like /r/ so a kennel's code and a resident's card behave alike
 * (docs/decisions.md, 2026-09-24): a signed-in user is sent on to the
 * enclosure page; a visitor stays here and sees the enclosure's name, its
 * zone and everyone living in it, each card linking to their /r/ page.
 *
 * The visitor's page reads public_enclosures (0079) and nothing else — no
 * capacity, notes or maintenance. The view has no row for the Lifecycle
 * pseudo-enclosures (Hospital, Fostered…), so their ids 404 exactly as an
 * unknown id does, and a visitor can't tell the two apart.
 *
 * Signed in, there is no lookup: /enclosures/[id] 404s on its own, and a
 * Lifecycle enclosure is still an enclosure page to staff. The redirect is
 * temporary — browsers cache 308s, which would pin a printed code to
 * today's page layout, and to whoever was signed in.
 */
export async function generateMetadata(
  props: PageProps<"/e/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const [supabase, { t, locale }, origin] = await Promise.all([
    createClient(),
    getT(),
    getSiteOrigin(),
  ]);
  const enclosure = await loadPublicEnclosure(supabase, id);
  if (!enclosure) return { title: t.header.appName };
  return {
    title: `${placeName(locale, enclosure.name, enclosure.name_th)} · ${t.header.appName}`,
    ...(origin ? { metadataBase: origin } : {}),
    // Not a page to be found by search: it exists for the code.
    robots: { index: false },
  };
}

export default async function EnclosureTagPage(props: PageProps<"/e/[id]">) {
  const { id } = await props.params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(`/enclosures/${id}`);

  const [enclosure, { t, locale }] = await Promise.all([
    loadPublicEnclosure(supabase, id),
    getT(),
  ]);
  if (!enclosure) notFound();

  const c = t.enclosureCard;
  const signInHref = `/login?next=${encodeURIComponent(enclosureTagPath(id))}`;

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10 sm:px-12">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
              {c.zone}: {placeName(locale, enclosure.zone_name, enclosure.zone_name_th)}
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{enclosure.name}</h1>
          {enclosure.name_th && (
            <p className="text-base text-muted">{enclosure.name_th}</p>
          )}
        </div>

        <section aria-labelledby="residents-heading" className="flex flex-col gap-4">
          <h2 id="residents-heading" className="text-lg font-semibold text-foreground">
            {c.residentsHeading}
          </h2>
          {enclosure.residents.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {enclosure.residents.map((resident) => (
                <ResidentCard
                  key={resident.id}
                  resident={resident}
                  t={t}
                  href={residentTagPath(resident.resident_code)}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
              {c.empty}
            </p>
          )}
        </section>

        {/* Staff who scanned while signed out: sign in and come straight back. */}
        <p className="flex flex-wrap items-center gap-2 border-t border-border pt-6 text-sm text-muted">
          <LogIn className="h-4 w-4" aria-hidden />
          {t.residentCard.staffHint}
          <Link href={signInHref} className="font-medium text-foreground underline hover:text-primary">
            {c.staffSignIn}
          </Link>
        </p>
      </div>

      <PublicFooter />
    </main>
  );
}
