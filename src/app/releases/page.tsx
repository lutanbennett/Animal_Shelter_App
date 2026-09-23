import type { Metadata } from "next";
import { getAppEnv } from "@/lib/app-env";
import { releases, unreleased } from "@/lib/releases";

export const metadata: Metadata = {
  title: "Release notes · Lanna Care for Animals",
};

/**
 * What each environment is called on this page. lannacare.org and the
 * database behind it are UAT for good (docs/decisions.md), so the build
 * app-env still calls "production" is labelled UAT here, matching the
 * `[UAT]` its release mail carries (wrangler.jsonc RELEASE_MAIL_ENV). The
 * cutover adds a real "uat" to AppEnv and this becomes a plain lookup.
 */
const ENV_LABEL = { dev: "Dev", production: "UAT" } as const;

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

        {releases.map((release) => (
          <article
            key={release.version}
            id={`v${release.version}`}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                {release.version}
                <span className="font-normal text-muted"> · {release.title}</span>
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
            </div>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-foreground">
              {release.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </main>
  );
}
