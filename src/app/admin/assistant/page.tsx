import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { DateInput } from "@/components/DateInput";
import { getT } from "@/lib/i18n/get-t";
import { formatDateTime } from "@/lib/format";
import {
  COULD_NOT_HELP_STATUSES,
  SCREEN_LIMIT,
  answeredBy,
  filtersQuery,
  inferredResidentId,
  loadCouldNotHelp,
  modelSplit,
  parseCouldNotHelpFilters,
  residentNames,
} from "@/lib/assistant/could-not-help";

/**
 * Settings → Assistant log: what people typed at the assistant that it could not help with, so the
 * misses can be read, and exported as an eval set. Admin only, by the Admin rule and no card
 * (docs/decisions/2026-10-30-assistant-could-not-help-log.md). The one control that acts is the
 * export link; it asks the Admin rule, as does the route behind it.
 *
 * "Answered by" is the split between a model and the version 1 keyword reader, from the `model`
 * column 0289 added. The count above the table is the part that is read at a glance; the model id
 * itself is under the word on the row that has one, since a column of model strings is not scannable
 * (docs/decisions/2026-10-31-assistant-model-waits.md).
 */
export default async function AssistantLogPage(props: PageProps<"/admin/assistant">) {
  await requireAdminUser();
  const { t, locale } = await getT();
  const a = t.admin.assistantLog;
  const filters = parseCouldNotHelpFilters(await props.searchParams);
  const supabase = await createClient();

  const { rows, error } = await loadCouldNotHelp(supabase, filters, SCREEN_LIMIT);
  const names = await residentNames(supabase, rows.map(inferredResidentId).filter((x): x is string => !!x));
  const input = "min-h-11 rounded border border-border bg-background px-2 py-1 text-sm md:min-h-0";
  const split = modelSplit(rows);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{a.title}</h1>
        <p className="text-sm text-muted">{a.subtitle}</p>
      </div>

      {/* A plain GET form: it works before the page has hydrated, and the address holds the filter. */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-muted">
          {a.status}
          <select name="status" defaultValue={filters.status} className={input}>
            <option value="all">{a.statusAll}</option>
            {COULD_NOT_HELP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {a.statuses[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          {a.from}
          <DateInput name="from" defaultValue={filters.from} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          {a.to}
          <DateInput name="to" defaultValue={filters.to} className={input} />
        </label>
        <button type="submit" className="min-h-11 rounded border border-border px-3 py-1 text-sm text-foreground hover:bg-surface-hover md:min-h-0">
          {a.apply}
        </button>
        <Link href="/admin/assistant" className="inline-flex min-h-11 items-center px-2 text-sm text-primary hover:underline md:min-h-0">
          {a.clear}
        </Link>
        <a
          href={`/admin/assistant/export${filtersQuery(filters)}`}
          className="ml-auto inline-flex min-h-11 items-center rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground md:min-h-0"
        >
          {a.export}
        </a>
      </form>

      {error ? (
        <p className="text-sm text-danger">{a.loadFailed}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">{a.empty}</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            {rows.length >= SCREEN_LIMIT ? a.showingLimit({ count: rows.length }) : a.showing({ count: rows.length })}{" "}
            {a.split(split)}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">{a.when}</th>
                  <th className="py-2 pr-3 font-medium">{a.status}</th>
                  <th className="py-2 pr-3 font-medium">{a.typed}</th>
                  <th className="py-2 pr-3 font-medium">{a.about}</th>
                  <th className="py-2 font-medium">{a.answeredBy}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const rid = inferredResidentId(r);
                  const by = answeredBy(r);
                  return (
                    <tr key={r.id} className="border-t border-border align-top">
                      <td className="whitespace-nowrap py-2 pr-3">{formatDateTime(r.created_at, locale)}</td>
                      <td className="py-2 pr-3">{a.statuses[r.status]}</td>
                      {/* Exactly as typed, so the whitespace is kept. */}
                      <td className="whitespace-pre-wrap break-words py-2 pr-3">{r.request_text}</td>
                      <td className="py-2 pr-3">
                        {rid ? (
                          <Link href={`/residents/${rid}`} className="text-primary hover:underline">
                            {names.get(rid) ?? a.aResident}
                          </Link>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap py-2">
                        {by.kind === "keyword" ? (
                          <span className="text-muted">{a.byKeyword}</span>
                        ) : (
                          <>
                            {a.byModel}
                            <span className="block text-xs text-muted">{by.model}</span>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
