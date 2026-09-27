import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import manual from "@/lib/manual/en";
import { asManualRole, isForRole } from "@/lib/manual/filter";
import { createClient } from "@/lib/supabase/server";
import { loadCurrentRole } from "@/lib/auth/app-access";
import screenshotSizes from "@/lib/manual/screenshot-sizes.json";
import { TocScroller } from "./TocScroller";
import { UntilFound } from "./UntilFound";
import type {
  ManualCallout,
  ManualRole,
  ManualScreenshot,
  ManualSection,
  ManualTopic,
} from "@/lib/manual/types";

export const metadata: Metadata = {
  title: `${manual.title} · Lanna Care for Animals`,
};

/** Pixel size of each PNG, written by scripts/manual-screenshots.mjs. */
const SCREENSHOT_SIZES: Record<string, { width: number; height: number } | undefined> =
  screenshotSizes;

const ROLE_ORDER: ManualRole[] = ["admin", "management", "staff", "vet", "volunteer"];

const CALLOUT_STYLES: Record<
  ManualCallout["kind"],
  { icon: typeof Info; className: string; label: string }
> = {
  tip: { icon: Lightbulb, className: "border-success/40 bg-success/10 text-success", label: "Tip" },
  note: { icon: Info, className: "border-info/40 bg-info/10 text-info", label: "Note" },
  warning: {
    icon: AlertTriangle,
    className: "border-danger/40 bg-danger/10 text-danger",
    label: "Careful",
  },
};

/**
 * The in-app user manual. Content comes from src/lib/manual/en.ts (English
 * only for now — the Thai edition is a later pass once the app settles);
 * this file is just the layout: a sticky table of contents beside the
 * sections on wide screens, a collapsible one above them on a phone.
 *
 * The page scrolls on the window (nothing between here and <body> sets
 * overflow, and the app header scrolls away with it), so the sticky
 * contents are measured against the viewport: top-6 plus an equal gap at
 * the bottom is 100dvh - 3rem. The heading stays put and the list below it
 * scrolls in its own box.
 *
 * It opens filtered to the reader's role: a topic tagged with other roles
 * is tucked away (hidden until found — Find on page and #anchors still
 * reach it, greyed), and a section left with none of the reader's topics
 * goes with its intro, since the intro describes the whole section. An
 * untagged topic is everyone's and always shows. ?view=all shows the lot,
 * greying what isn't the reader's, because "can I do this?" deserves a
 * greyed answer rather than none (backlog, "A role-based manual").
 */
export default async function ManualPage({ searchParams }: PageProps<"/manual">) {
  const [{ view }, role] = await Promise.all([
    searchParams,
    createClient().then(loadCurrentRole).then(asManualRole),
  ]);
  const showAll = view === "all";
  const sections: ViewSection[] = manual.sections.map((section) => ({
    section,
    topics: section.topics.map((topic) => ({ topic, mine: isForRole(topic.roles, role) })),
  }));
  const myTopicCount = sections.reduce(
    (n, { topics }) => n + topics.filter((t) => t.mine).length,
    0,
  );
  const roleName = role ? manual.roleNames[role] : null;

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{manual.title}</h1>
        <p className="max-w-3xl text-sm text-muted">{manual.subtitle}</p>
        <p className="text-xs text-muted">{manual.version}</p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Phone: collapsible contents above the text. */}
        <details className="rounded-lg border border-border bg-surface lg:hidden">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
            Contents
          </summary>
          <div className="border-t border-border px-4 py-3">
            <Toc sections={sections} showAll={showAll} />
          </div>
        </details>

        {/* Desktop: sticky contents beside the text, with their own scroll bar. */}
        <aside className="hidden w-56 shrink-0 lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100dvh-3rem)] lg:flex-col">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Contents
          </h2>
          <TocScroller>
            <Toc sections={sections} showAll={showAll} />
          </TocScroller>
        </aside>

        <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-12">
          {roleName && (
            <FilterBar roleName={roleName} showAll={showAll} count={myTopicCount} />
          )}
          <RolesTable role={role} />
          {sections.map(({ section, topics }) => {
            const Icon = section.icon;
            const tucked = !showAll && !topics.some((t) => t.mine);
            return (
              <section
                key={section.id}
                id={section.id}
                hidden={tucked}
                data-until-found={tucked || undefined}
                className="flex scroll-mt-6 flex-col gap-6"
              >
                <div className="flex flex-col gap-2 border-b border-border pb-4">
                  <h2 className="flex items-center gap-3 text-xl font-semibold text-foreground">
                    <Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-primary" />
                    {section.title}
                  </h2>
                  <p className="text-sm text-muted">{section.intro}</p>
                </div>
                {topics.map(({ topic, mine }) => (
                  <Topic
                    key={topic.id}
                    topic={topic}
                    notMine={mine ? null : roleName}
                    tucked={!showAll && !mine}
                  />
                ))}
              </section>
            );
          })}
        </div>
      </div>
      <UntilFound />
    </main>
  );
}

type ViewSection = {
  section: ManualSection;
  /** `mine`: for the reader's role, or for everyone. */
  topics: { topic: ManualTopic; mine: boolean }[];
};

function FilterBar({
  roleName,
  showAll,
  count,
}: {
  roleName: string;
  showAll: boolean;
  count: number;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-foreground">
        <span>
          {showAll
            ? manual.filter.showingEverything(roleName)
            : manual.filter.showingRole(roleName, count)}
        </span>
        <Link
          href={showAll ? "/manual" : "/manual?view=all"}
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          {showAll ? manual.filter.showOnlyRole(roleName) : manual.filter.showEverything}
        </Link>
      </p>
      {!showAll && <p className="text-xs text-muted">{manual.filter.findHint}</p>}
    </div>
  );
}

function Toc({ sections, showAll }: { sections: ViewSection[]; showAll: boolean }) {
  return (
    <nav aria-label="Manual contents" className="flex flex-col gap-1 text-sm">
      <a href="#roles-table" className="rounded px-2 py-1 text-muted hover:bg-surface-hover hover:text-foreground aria-[current=location]:bg-surface-hover aria-[current=location]:text-foreground">
        Roles at a glance
      </a>
      {sections.map(({ section, topics }) => {
        const shown = showAll ? topics : topics.filter((t) => t.mine);
        if (shown.length === 0) return null;
        return (
          <div key={section.id} className="flex flex-col">
            <a
              href={`#${section.id}`}
              className="rounded px-2 py-1 font-medium text-foreground hover:bg-surface-hover aria-[current=location]:bg-surface-hover"
            >
              {section.title}
            </a>
            <div className="ml-2 flex flex-col border-l border-border pl-2">
              {shown.map(({ topic, mine }) => (
                <a
                  key={topic.id}
                  href={`#${topic.id}`}
                  className={`rounded px-2 py-1 text-xs text-muted hover:bg-surface-hover hover:text-foreground aria-[current=location]:bg-surface-hover aria-[current=location]:text-foreground ${
                    mine ? "" : "opacity-60"
                  }`}
                >
                  {topic.title}
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function RolesTable({ role }: { role: ManualRole | null }) {
  return (
    <section id="roles-table" className="flex scroll-mt-6 flex-col gap-3">
      <h2 className="text-lg font-semibold text-foreground">Roles at a glance</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <tbody>
            {ROLE_ORDER.map((r) => (
              <tr key={r} className="border-b border-border last:border-b-0">
                <th
                  scope="row"
                  className="w-32 bg-surface px-3 py-2 text-left align-top font-medium text-foreground"
                >
                  <RoleBadge role={r} />
                  {r === role && (
                    <span className="mt-1 block text-xs font-normal text-muted">
                      {manual.filter.you}
                    </span>
                  )}
                </th>
                <td className={`px-3 py-2 ${r === role ? "text-foreground" : "text-muted"}`}>
                  {manual.roleSummary[r]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RoleBadge({ role }: { role: ManualRole }) {
  return (
    <span className="inline-block rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {manual.roleNames[role]}
    </span>
  );
}

/**
 * `notMine` is the reader's role name when the topic isn't for it: the
 * topic is greyed and says so. `tucked` hides it until found.
 */
function Topic({
  topic,
  notMine,
  tucked,
}: {
  topic: ManualTopic;
  notMine: string | null;
  tucked: boolean;
}) {
  return (
    <article
      id={topic.id}
      hidden={tucked}
      data-until-found={tucked || undefined}
      className={`flex scroll-mt-6 flex-col gap-3 ${notMine ? "opacity-60" : ""}`}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{topic.title}</h3>
        {topic.path && (
          <p className="font-mono text-xs text-muted">{topic.path}</p>
        )}
        {topic.roles && (
          <p className="flex flex-wrap items-center gap-1 text-xs text-muted">
            <span className="mr-1">Who:</span>
            {ROLE_ORDER.filter((r) => topic.roles?.includes(r)).map((role) => (
              <RoleBadge key={role} role={role} />
            ))}
          </p>
        )}
        {notMine && (
          <p className="text-xs font-medium text-muted">{manual.filter.notForRole(notMine)}</p>
        )}
      </div>

      {topic.intro && <p className="text-sm text-foreground">{topic.intro}</p>}

      {topic.steps && (
        <ol className="flex list-decimal flex-col gap-2 pl-6 text-sm text-foreground marker:font-semibold marker:text-primary">
          {topic.steps.map((step, i) => (
            <li key={i} className="pl-1">
              {step}
            </li>
          ))}
        </ol>
      )}

      {topic.screenshot && <Screenshot shot={topic.screenshot} />}

      {topic.callouts?.map((callout, i) => (
        <Callout key={i} callout={callout} />
      ))}
    </article>
  );
}

function Screenshot({ shot }: { shot: ManualScreenshot }) {
  // The file's own size, so the browser reserves the space before the lazy
  // image arrives. Without it every screenshot is zero-height until it
  // loads, and a deep link like /manual#weight lands on the topic and is
  // then pushed down the page as the pictures above it fill in. Missing
  // only for a src with no PNG on disk yet.
  const size = SCREENSHOT_SIZES[shot.src];
  return (
    <figure className={`flex flex-col gap-2 ${shot.mobile ? "items-center" : ""}`}>
      {/* Plain <img>: screenshots are static files under public/manual and
          the app already opts out of next/image optimisation. */}
      <img
        src={shot.src}
        alt={shot.alt}
        width={size?.width}
        height={size?.height}
        loading="lazy"
        className={`h-auto rounded-lg border border-border bg-surface ${
          shot.mobile ? "w-full max-w-xs" : "w-full"
        }`}
      />
      {shot.caption && (
        <figcaption className="text-center text-xs text-muted">{shot.caption}</figcaption>
      )}
    </figure>
  );
}

function Callout({ callout }: { callout: ManualCallout }) {
  const { icon: Icon, className, label } = CALLOUT_STYLES[callout.kind];
  return (
    <div className={`flex gap-3 rounded-lg border p-3 text-sm ${className}`}>
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-foreground">
        <span className="font-semibold">{label}: </span>
        {callout.text}
      </p>
    </div>
  );
}
