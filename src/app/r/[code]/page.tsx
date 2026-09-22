import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { localizedField } from "@/lib/translations/localize";
import {
  compatibilityLabel,
  energyLevelLabel,
  speciesLabel,
  sexLabel,
  sizeLabel,
} from "@/lib/i18n/enum-labels";
import { formatAge, formatDate } from "@/lib/format";
import { loadResidentCard } from "@/lib/residents/card";
import { residentTagPath } from "@/lib/tags/links";
import { PublicHeader } from "@/app/adopt/PublicHeader";
import { PublicFooter } from "@/app/adopt/PublicFooter";

/**
 * The page behind a resident's RFID card (src/lib/tags/links.ts): the
 * R-code, so the card never carries a database id; a raw UUID is
 * accepted too for an older link.
 *
 * Who scanned decides what they get (docs/decisions.md, 2026-09-22): a
 * signed-in user is sent on to the hub; a visitor stays here and sees
 * the resident's public card — photo, name, age, sex, temperament and
 * the rest of public_resident_cards (0067) — for *any* resident, so a
 * card never dead-ends on a sign-in page. The route is therefore public
 * (src/lib/public-paths.ts) and reads with whatever key the request
 * has; the view is what limits what comes back.
 *
 * The hub redirect is temporary: a cached 308 would pin a printed card
 * to today's layout, and to whoever was signed in.
 */
export async function generateMetadata(
  props: PageProps<"/r/[code]">,
): Promise<Metadata> {
  const { code } = await props.params;
  const [supabase, { t }, origin] = await Promise.all([
    createClient(),
    getT(),
    getSiteOrigin(),
  ]);
  const resident = await loadResidentCard(supabase, code);
  if (!resident) return { title: t.header.appName };
  const title = `${resident.name} · ${t.header.appName}`;
  return {
    title,
    ...(origin ? { metadataBase: origin } : {}),
    // Not a page to be found by search: it exists for the card.
    robots: { index: false },
  };
}

export default async function ResidentCardPage(props: PageProps<"/r/[code]">) {
  const { code } = await props.params;
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    resident,
    { t, locale },
  ] = await Promise.all([supabase.auth.getUser(), loadResidentCard(supabase, code), getT()]);

  if (!resident) notFound();
  if (user) redirect(`/residents/${resident.id}`);

  const c = t.residentCard;
  const d = t.adopt.details;
  const text = {
    bio: localizedField(locale, resident.bio, resident.translations, "bio"),
    temperament: localizedField(
      locale,
      resident.temperament_notes,
      resident.translations,
      "temperament_notes",
    ),
  };

  const details = [
    resident.species && { label: d.species, value: speciesLabel(t, resident.species) },
    resident.breed && { label: d.breed, value: resident.breed },
    resident.sex && { label: d.sex, value: sexLabel(t, resident.sex) },
    resident.size && { label: d.size, value: sizeLabel(t, resident.size) },
    resident.colour && { label: d.colour, value: resident.colour },
    resident.estimated_age_years != null && {
      label: d.age,
      value: formatAge(t, resident.estimated_age_years, resident.age_estimated_on),
    },
    resident.intake_date && {
      label: c.withUsSince,
      value: formatDate(resident.intake_date, locale),
    },
  ].filter(Boolean) as { label: string; value: string }[];

  // Same fit chips as the adoption profile; the block hides when none set.
  const r = t.adopt.recommendation;
  const recommendation = [
    resident.good_with_dogs && {
      label: r.goodWithDogs,
      value: compatibilityLabel(t, resident.good_with_dogs),
      tone: resident.good_with_dogs,
    },
    resident.good_with_cats && {
      label: r.goodWithCats,
      value: compatibilityLabel(t, resident.good_with_cats),
      tone: resident.good_with_cats,
    },
    resident.good_with_children && {
      label: r.goodWithChildren,
      value: compatibilityLabel(t, resident.good_with_children),
      tone: resident.good_with_children,
    },
    resident.energy_level && {
      label: r.energyLevel,
      value: energyLevelLabel(t, resident.energy_level),
      tone: "neutral",
    },
  ].filter(Boolean) as { label: string; value: string; tone: string }[];
  const toneClass: Record<string, string> = {
    Yes: "border-success/40 bg-success/10 text-success",
    No: "border-danger/40 bg-danger/10 text-danger",
    Unknown: "border-border bg-background text-muted",
    neutral: "border-primary/40 bg-primary/10 text-primary",
  };

  // A card scanned after the animal has gone says so, gently, and
  // nothing else about them beyond the profile itself.
  const gone =
    resident.status === "Adopted"
      ? c.adopted(resident.name)
      : resident.status === "Deceased"
        ? c.passed(resident.name)
        : null;

  const signInHref = `/login?next=${encodeURIComponent(residentTagPath(code))}`;

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10 sm:px-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {resident.profile_photo_drive_file_id ? (
            <img
              src={driveImageUrl(resident.profile_photo_drive_file_id)}
              alt={resident.name}
              className="aspect-square w-full rounded-lg border border-border object-cover"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-border bg-surface text-sm text-muted">
              {c.noPhoto}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {resident.ready_for_adoption && resident.status === "Resident" && (
                  <span className="rounded bg-success px-2 py-1 text-xs font-semibold text-success-foreground">
                    {t.adopt.availableForAdoption}
                  </span>
                )}
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                  {resident.resident_code}
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-foreground">{resident.name}</h1>
              {resident.thai_name && (
                <p className="text-base text-muted">{resident.thai_name}</p>
              )}
            </div>

            {gone && (
              <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
                {gone}
              </p>
            )}

            {details.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {details.map((detail) => (
                  <div key={detail.label}>
                    <dt className="text-muted">{detail.label}</dt>
                    <dd className="text-foreground">{detail.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {resident.is_desexed === true && (
              <ul className="flex flex-wrap gap-2" aria-label={t.adopt.health.heading}>
                <li className="rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  ✓ {t.adopt.health.desexed}
                </li>
              </ul>
            )}

            {text.bio && (
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-foreground">
                  {t.adopt.about(resident.name)}
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                  {text.bio}
                </p>
              </div>
            )}

            {text.temperament && (
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-foreground">
                  {t.adopt.temperament}
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                  {text.temperament}
                </p>
              </div>
            )}

            {recommendation.length > 0 && (
              <section
                aria-labelledby="recommendation-heading"
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
              >
                <h2 id="recommendation-heading" className="text-sm font-semibold text-foreground">
                  {r.heading(resident.name)}
                </h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {recommendation.map((item) => (
                    <div key={item.label} className="flex flex-col gap-1">
                      <dt className="text-xs text-muted">{item.label}</dt>
                      <dd>
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClass[item.tone]}`}
                        >
                          {item.value}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {resident.is_public_visible && resident.status === "Resident" && (
              <Link
                href={`/adopt/${resident.id}`}
                className="w-fit rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
              >
                {c.fullProfile(resident.name)}
              </Link>
            )}
          </div>
        </div>

        {/* Staff who scanned while signed out: sign in and come straight back. */}
        <p className="flex flex-wrap items-center gap-2 border-t border-border pt-6 text-sm text-muted">
          <LogIn className="h-4 w-4" aria-hidden />
          {c.staffHint}
          <Link href={signInHref} className="font-medium text-foreground underline hover:text-primary">
            {c.staffSignIn}
          </Link>
        </p>
      </div>

      <PublicFooter />
    </main>
  );
}
