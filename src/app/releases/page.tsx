import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAppEnv } from "@/lib/app-env";
import { loadCurrentRole } from "@/lib/auth/app-access";
import manual from "@/lib/manual/en";
import { asManualRole, isForRole } from "@/lib/manual/filter";
import { noteRoles, noteText, releases, unreleased, type ReleaseNote } from "@/lib/releases";
import { createClient } from "@/lib/supabase/server";
import { OpenReleaseFromHash } from "./OpenReleaseFromHash";

export const metadata: Metadata = {
  title: "Release notes · Lanna Care for Animals",
};

/**
 * What each environment is called on this page. Until the cutover the
 * build app-env calls "production" is lannacare.org — UAT for good
 * (docs/decisions.md) — so it is still labelled UAT, matching the `[UAT]`
 * its release mail carries (wrangler.jsonc RELEASE_MAIL_ENV). The cutover
 * sets UAT_PROJECT_REF in app-env and changes production's label here to
 * "Production" in the same commit.
 */
const ENV_LABEL = { dev: "Dev", uat: "UAT", production: "UAT" } as const;

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/** A note as the page shows it: `mine` when it is for the reader's role or for everyone. */
type ViewNote = { text: string; mine: boolean };

/**
 * The release notes register (src/lib/releases.ts), newest first, for
 * every signed-in role. English only, like the manual. A page is always
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
  const [{ view }, role] = await Promise.all([
    searchParams,
    createClient().then(loadCurrentRole).then(asManualRole),
  ]);
  const appEnv = getAppEnv();
  const envLabel = ENV_LABEL[appEnv];
  const roleName = role ? manual.roleNames[role] : null;
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
        <h1 className="text-2xl font-semibold text-foreground">Release notes</h1>
        <p className="text-sm text-muted">
          What has changed in the system, newest first. Admins get an email
          when a major release goes live.
        </p>
      </header>

      {roleName && <FilterBar roleName={roleName} showAll={showAll} />}

      <div className="flex max-w-3xl flex-col gap-4">
        {/* Only where the next release is being built: on dev and test the
            notes waiting for a release are worth seeing; live, they'd be
            promises about code that isn't there. */}
        {appEnv === "dev" && pending.length > 0 && (
          <section className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-4">
            <h2 className="text-base font-semibold text-foreground">
              Not released yet
            </h2>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-foreground">
              {pending.map((note, i) => (
                <Note key={i} note={note} roleName={roleName} />
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
                <span className="text-sm text-muted">{formatDate(release.date)}</span>
                <span className="ml-auto flex gap-2">
                  {notes.length === 0 && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
                      Nothing for {roleName}
                    </span>
                  )}
                  {release.major && (
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Major
                    </span>
                  )}
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
                    {envLabel}
                  </span>
                </span>
              </summary>
              {notes.length > 0 ? (
                <ul className="flex list-disc flex-col gap-1 pr-4 pb-4 pl-11 text-sm text-foreground">
                  {notes.map((note, i) => (
                    <Note key={i} note={note} roleName={roleName} />
                  ))}
                </ul>
              ) : (
                <p className="pr-4 pb-4 pl-11 text-sm text-muted">
                  Nothing in this release changes what the {roleName} role does
                  {" — "}
                  {release.notes.length === 1
                    ? "its one change is for other roles."
                    : `its ${release.notes.length} changes are for other roles.`}{" "}
                  <Link
                    href={`/releases?view=all#v${release.version}`}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Show everything
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

function FilterBar({ roleName, showAll }: { roleName: string; showAll: boolean }) {
  return (
    <div className="flex max-w-3xl flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-foreground">
        <span>
          {showAll
            ? `Showing every change, greyed where it isn't for the ${roleName} role.`
            : `Showing the changes for the ${roleName} role, and the ones for everyone.`}
        </span>
        <Link
          href={showAll ? "/releases" : "/releases?view=all"}
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          {showAll ? `Show only the ${roleName} role` : "Show everything"}
        </Link>
      </p>
      {!showAll && (
        <p className="text-xs text-muted">
          Every release stays in the list, so the numbers run in order; one with
          nothing for your role says so.
        </p>
      )}
    </div>
  );
}

/** `roleName` is the reader's role, when the page knows it: a note outside it is greyed and says so. */
function Note({ note, roleName }: { note: ViewNote; roleName: string | null }) {
  if (note.mine || !roleName) return <li>{note.text}</li>;
  return (
    <li className="opacity-60">
      {note.text}{" "}
      <span className="text-xs font-medium text-muted">Not for the {roleName} role</span>
    </li>
  );
}
