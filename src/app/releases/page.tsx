import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAppEnv } from "@/lib/app-env";
import { loadCurrentRole } from "@/lib/auth/app-access";
import { formatDate } from "@/lib/format";
import { getT } from "@/lib/i18n/get-t";
import { asManualRole, isForRole } from "@/lib/manual/filter";
import { noteRoles, noteText, releases, unreleased, type ReleaseNote } from "@/lib/releases";
import { createClient } from "@/lib/supabase/server";
import { OpenReleaseFromHash } from "./OpenReleaseFromHash";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t.releases.title} · ${t.header.appName}` };
}

/**
 * What each environment is called on this page. Until the cutover the
 * build app-env calls "production" is lannacare.org — UAT for good
 * (docs/decisions.md) — so it is still labelled UAT, matching the `[UAT]`
 * its release mail carries (wrangler.jsonc RELEASE_MAIL_ENV). The cutover
 * sets UAT_PROJECT_REF in app-env and changes production's label here to
 * "Production" in the same commit.
 */
const ENV_LABEL = { dev: "Dev", uat: "UAT", production: "UAT" } as const;

/** A note as the page shows it: `mine` when it is for the reader's role or for everyone. */
type ViewNote = { text: string; mine: boolean };

/**
 * The release notes register (src/lib/releases.ts), newest first, for
 * every signed-in role. The page's own words follow the reader's language;
 * the notes themselves are English only, like the manual, and the page says so. A page is always
 * the build it describes, so every entry here is live on this site and
 * carries this site's environment.
 *
 * It opens on the reader's role, as /manual does (`isForRole`: an untagged
 * note is everyone's and always shows). Every release stays in the list
 * with its number, whatever survives the filter: releases are numbered for
 * the whole app, and a list jumping from 0.7.0 to 0.4.0 reads as a broken
 * page. A release with nothing for the reader says so instead of listing
 * nothing. ?view=all shows every note, greying the ones that are not the
 * reader's (docs/decisions.md, "Release notes by role").
 */
export default async function ReleasesPage({ searchParams }: PageProps<"/releases">) {
  const [{ view }, role, { t, locale }] = await Promise.all([
    searchParams,
    createClient().then(loadCurrentRole).then(asManualRole),
    getT(),
  ]);
  const r = t.releases;
  const appEnv = getAppEnv();
  const envLabel = ENV_LABEL[appEnv];
  // The environment tag is for whoever runs the system: to everyone else
  // "Dev" on every release is a developer's word on a staff screen.
  const showEnv = role === "admin";
  const roleName = role ? r.roleNames[role] : null;
  const showAll = view === "all" || !roleName;
  /** The notes this view lists: the reader's, or all of them under Show everything. */
  const shown = (notes: ReleaseNote[]): ViewNote[] =>
    notes
      .map((note) => ({ text: noteText(note), mine: isForRole(noteRoles(note), role) }))
      .filter((n) => showAll || n.mine);
  const pending = shown(unreleased);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-6">
      <OpenReleaseFromHash />
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{r.title}</h1>
        <p className="text-sm text-muted">{r.intro}</p>
        {locale !== "en" && <p className="text-sm text-muted">{r.englishOnly}</p>}
      </header>

      {roleName && <FilterBar roleName={roleName} showAll={showAll} r={r} />}

      <div className="flex max-w-3xl flex-col gap-4">
        {/* Only where the next release is being built: on dev and test the
            notes waiting for a release are worth seeing; live, they'd be
            promises about code that isn't there. */}
        {appEnv === "dev" && pending.length > 0 && (
          <section className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-4">
            <h2 className="text-base font-semibold text-foreground">
              {r.notReleasedYet}
            </h2>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-foreground">
              {pending.map((note, i) => (
                <Note key={i} note={note} roleName={roleName} r={r} />
              ))}
            </ul>
          </section>
        )}

        {releases.map((release, index) => {
          // One row each, so the page doesn't grow a screenful per release;
          // the newest starts open, being the one people come to read. The
          // id sits on the <details> so OpenReleaseFromHash can open
          // whatever a #v0.2.0 link targets.
          const notes = shown(release.notes);
          return (
            <details
              key={release.version}
              id={`v${release.version}`}
              open={index === 0}
              className="group scroll-mt-4 rounded-lg border border-border bg-surface"
            >
              <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                <h2 className="flex items-baseline gap-2 text-lg font-semibold text-foreground">
                  <ChevronRight
                    aria-hidden
                    className="mt-1.5 size-4 shrink-0 self-start text-muted transition-transform group-open:rotate-90 motion-reduce:transition-none"
                  />
                  <span>
                    {release.version}
                    <span className="font-normal text-muted"> · {release.title}</span>
                  </span>
                </h2>
                <span className="text-sm text-muted">{formatDate(release.date, locale)}</span>
                <span className="ml-auto flex gap-2">
                  {notes.length === 0 && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
                      {r.nothingFor(roleName ?? "")}
                    </span>
                  )}
                  {release.major && (
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {r.major}
                    </span>
                  )}
                  {showEnv && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
                      {envLabel}
                    </span>
                  )}
                </span>
              </summary>
              {notes.length > 0 ? (
                <ul className="flex list-disc flex-col gap-1 pr-4 pb-4 pl-11 text-sm text-foreground">
                  {notes.map((note, i) => (
                    <Note key={i} note={note} roleName={roleName} r={r} />
                  ))}
                </ul>
              ) : (
                <p className="pr-4 pb-4 pl-11 text-sm text-muted">
                  {r.nothingInRelease(roleName ?? "", release.notes.length)}{" "}
                  <Link
                    href={`/releases?view=all#v${release.version}`}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {r.showEverything}
                  </Link>
                </p>
              )}
            </details>
          );
        })}
      </div>
    </main>
  );
}

type Words = Awaited<ReturnType<typeof getT>>["t"]["releases"];

function FilterBar({ roleName, showAll, r }: { roleName: string; showAll: boolean; r: Words }) {
  return (
    <div className="flex max-w-3xl flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-foreground">
        <span>
          {showAll ? r.showingAll(roleName) : r.showingMine(roleName)}
        </span>
        <Link
          href={showAll ? "/releases" : "/releases?view=all"}
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          {showAll ? r.showOnlyMine(roleName) : r.showEverything}
        </Link>
      </p>
      {!showAll && (
        <p className="text-xs text-muted">{r.keptInList}</p>
      )}
    </div>
  );
}

/** `roleName` is the reader's role, when the page knows it: a note outside it is greyed and says so. */
function Note({ note, roleName, r }: { note: ViewNote; roleName: string | null; r: Words }) {
  if (note.mine || !roleName) return <li>{note.text}</li>;
  return (
    <li className="opacity-60">
      {note.text}{" "}
      <span className="text-xs font-medium text-muted">{r.notForRole(roleName)}</span>
    </li>
  );
}
