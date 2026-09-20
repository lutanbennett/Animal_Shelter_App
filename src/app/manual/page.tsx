import type { Metadata } from "next";
import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import manual from "@/lib/manual/en";
import type {
  ManualCallout,
  ManualRole,
  ManualScreenshot,
  ManualTopic,
} from "@/lib/manual/types";

export const metadata: Metadata = {
  title: `${manual.title} · Lanna Care for Animals`,
};

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
 */
export default function ManualPage() {
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
            <Toc />
          </div>
        </details>

        {/* Desktop: sticky contents beside the text. */}
        <aside className="hidden w-56 shrink-0 lg:sticky lg:top-6 lg:block">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Contents
          </h2>
          <Toc />
        </aside>

        <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-12">
          <RolesTable />
          {manual.sections.map((section) => {
            const Icon = section.icon;
            return (
              <section
                key={section.id}
                id={section.id}
                className="flex scroll-mt-6 flex-col gap-6"
              >
                <div className="flex flex-col gap-2 border-b border-border pb-4">
                  <h2 className="flex items-center gap-3 text-xl font-semibold text-foreground">
                    <Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-primary" />
                    {section.title}
                  </h2>
                  <p className="text-sm text-muted">{section.intro}</p>
                </div>
                {section.topics.map((topic) => (
                  <Topic key={topic.id} topic={topic} />
                ))}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function Toc() {
  return (
    <nav aria-label="Manual contents" className="flex flex-col gap-1 text-sm">
      <a href="#roles-table" className="rounded px-2 py-1 text-muted hover:bg-surface-hover hover:text-foreground">
        Roles at a glance
      </a>
      {manual.sections.map((section) => (
        <div key={section.id} className="flex flex-col">
          <a
            href={`#${section.id}`}
            className="rounded px-2 py-1 font-medium text-foreground hover:bg-surface-hover"
          >
            {section.title}
          </a>
          <div className="ml-2 flex flex-col border-l border-border pl-2">
            {section.topics.map((topic) => (
              <a
                key={topic.id}
                href={`#${topic.id}`}
                className="rounded px-2 py-1 text-xs text-muted hover:bg-surface-hover hover:text-foreground"
              >
                {topic.title}
              </a>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function RolesTable() {
  return (
    <section id="roles-table" className="flex scroll-mt-6 flex-col gap-3">
      <h2 className="text-lg font-semibold text-foreground">Roles at a glance</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <tbody>
            {ROLE_ORDER.map((role) => (
              <tr key={role} className="border-b border-border last:border-b-0">
                <th
                  scope="row"
                  className="w-32 bg-surface px-3 py-2 text-left align-top font-medium text-foreground"
                >
                  <RoleBadge role={role} />
                </th>
                <td className="px-3 py-2 text-muted">{manual.roleSummary[role]}</td>
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

function Topic({ topic }: { topic: ManualTopic }) {
  return (
    <article id={topic.id} className="flex scroll-mt-6 flex-col gap-3">
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
  return (
    <figure className={`flex flex-col gap-2 ${shot.mobile ? "items-center" : ""}`}>
      {/* Plain <img>: screenshots are static files under public/manual and
          the app already opts out of next/image optimisation. */}
      <img
        src={shot.src}
        alt={shot.alt}
        loading="lazy"
        className={`rounded-lg border border-border bg-surface ${
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
