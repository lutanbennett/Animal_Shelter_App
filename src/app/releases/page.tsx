import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { getAppEnv } from "@/lib/app-env";
import { releases, unreleased } from "@/lib/releases";
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

/**
 * The release notes register (src/lib/releases.ts), newest first, for
 * every signed-in role. English only, like the manual. A page is always
 * the build it describes, so every entry here is live on this site and
 * carries this site's environment.
 */
export default function ReleasesPage() {
  const appEnv = getAppEnv();
  const envLabel = ENV_LABEL[appEnv];

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

      <div className="flex max-w-3xl flex-col gap-4">
        {/* Only where the next release is being built: on dev and test the
            notes waiting for a release are worth seeing; live, they'd be
            promises about code that isn't there. */}
        {appEnv === "dev" && unreleased.length > 0 && (
          <section className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-4">
            <h2 className="text-base font-semibold text-foreground">
              Not released yet
            </h2>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-foreground">
              {unreleased.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </section>
        )}

        {releases.map((release, index) => (
          // One row each, so the page doesn't grow a screenful per release;
          // the newest starts open, being the one people come to read. The
          // id sits on the <details> so OpenReleaseFromHash can open
          // whatever a #v0.2.0 link targets.
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
                  className="size-4 shrink-0 self-center text-muted transition-transform group-open:rotate-90 motion-reduce:transition-none"
                />
                <span>
                  {release.version}
                  <span className="font-normal text-muted"> · {release.title}</span>
                </span>
              </h2>
              <span className="text-sm text-muted">{formatDate(release.date)}</span>
              <span className="ml-auto flex gap-2">
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
            <ul className="flex list-disc flex-col gap-1 pr-4 pb-4 pl-11 text-sm text-foreground">
              {release.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </main>
  );
}
