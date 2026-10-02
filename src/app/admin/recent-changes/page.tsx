import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { listAllUsers } from "@/lib/auth/access-requests";
import {
  AUDITED_TABLES,
  SYSTEM_ACTOR,
  fieldLabel,
  loadDetail,
  loadPage,
  parseFilters,
  showValue,
  type AuditEntry,
  type AuditFilters,
} from "@/lib/audit/recent-changes";
import { newestIdByRow, undoKind } from "@/lib/audit/undo";
import { UndoButton } from "./UndoButton";
import { formatDateTime } from "@/lib/format";
import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type T = Awaited<ReturnType<typeof getT>>["t"];

/**
 * Settings → Recent changes: a view of audit_log (0121), backlog DB-6 parts 2
 * and 3 (the Undo button). Admin only, checked here and again by the table's own RLS:
 * the page reads with the signed-in admin's client, never the service role,
 * so a refusal by the policy would show as an empty page, not a leak.
 *
 * Reading has no server action: filters, paging and "show values" are plain GET
 * links. The one write is Undo (./actions.ts, docs/decisions/2026-10-02-audit-undo.md). See lib/audit/recent-changes.ts and
 * docs/decisions/2026-10-02-recent-changes-page.md for why values are shown
 * for one opened row only and why the paging has no total.
 */
export default async function RecentChangesPage(props: PageProps<"/admin/recent-changes">) {
  await requireAdminUser();
  const { t, locale } = await getT();
  const s = t.admin.recentChanges;
  const filters = parseFilters(await props.searchParams);

  const supabase = await createClient();
  const [page, users, detail] = await Promise.all([
    loadPage(supabase, filters),
    listAllUsers(createAdminClient()),
    filters.open ? loadDetail(supabase, filters.open) : Promise.resolve(null),
  ]);

  // An entry is undoable only while it is the newest change to its row; the
  // action checks again, this decides whether to offer the button.
  const newest = await newestIdByRow(
    supabase,
    page.entries.filter((e) => ["edit", "reinsert"].includes(undoKind(e))),
  );

  const actorLabel = new Map(
    users.users.map((u) => {
      const meta = u.user_metadata ?? {};
      const name =
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        null;
      return [u.id, name ? `${name} (${u.email ?? ""})` : (u.email ?? u.id)] as const;
    }),
  );

  // Links keep the current filters and change only what they name.
  const link = (over: Partial<Record<keyof AuditFilters, string | number | null>>) => {
    const merged: Record<string, string | number | null> = {
      table: filters.table,
      actor: filters.actor,
      from: filters.from,
      to: filters.to,
      row: filters.row,
      before: null,
      open: null,
      ...over,
    };
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v !== null && v !== "") qs.set(k, String(v));
    const text = qs.toString();
    return `/admin/recent-changes${text ? `?${text}` : ""}`;
  };

  const filtered = !!(filters.table || filters.actor || filters.from || filters.to || filters.row);
  const field = "rounded border border-border bg-surface px-2 py-1 text-sm text-foreground";

  const recordCell = (e: AuditEntry) => {
    const resident = e.table === "residents" ? e.rowId : e.residentId;
    const residentName = resident ? page.residentNames.get(resident) : undefined;
    const label =
      e.table === "residents"
        ? (residentName ?? e.name ?? s.unnamedRecord)
        : e.table === "contacts" || e.table === "attachments"
          ? (e.name ?? s.unnamedRecord)
          : null;
    const owner = e.table !== "residents" && e.table !== "contacts" ? residentName : null;
    return (
      <>
        <div className="text-foreground">
          {label ?? owner ?? (resident ? s.deletedResident : s.unnamedRecord)}
          {label && owner ? <span className="text-muted"> · {owner}</span> : null}
        </div>
        <div className="text-xs text-muted">
          {s.tables[e.table]}
          {resident && residentName && (
            <>
              {" · "}
              <Link className="underline" href={`/residents/${resident}`}>
                {residentName}
              </Link>
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{s.title}</h1>
        <p className="text-sm text-muted">{s.subtitle}</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        {filters.row && <input type="hidden" name="row" value={filters.row} />}
        <label className="flex flex-col gap-1 text-sm text-muted">
          {s.filters.table}
          <select name="table" defaultValue={filters.table ?? ""} className={field}>
            <option value="">{s.filters.anyTable}</option>
            {AUDITED_TABLES.map((tbl) => (
              <option key={tbl} value={tbl}>
                {s.tables[tbl]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          {s.filters.actor}
          <select name="actor" defaultValue={filters.actor ?? ""} className={field}>
            <option value="">{s.filters.anyActor}</option>
            <option value={SYSTEM_ACTOR}>{s.filters.system}</option>
            {[...actorLabel].map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          {s.filters.from}
          <input type="date" name="from" defaultValue={filters.from ?? ""} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          {s.filters.to}
          <input type="date" name="to" defaultValue={filters.to ?? ""} className={field} />
        </label>
        <button
          type="submit"
          className="rounded border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {s.filters.apply}
        </button>
        {filtered && (
          <Link href="/admin/recent-changes" className="py-2 text-sm text-muted underline">
            {s.filters.clear}
          </Link>
        )}
      </form>

      {filters.row && (
        <p className="text-sm text-muted">
          {s.filters.record}{" "}
          <Link className="underline" href={link({ row: null })}>
            {s.filters.allRecords}
          </Link>
        </p>
      )}

      {page.error && (
        <p className="text-sm text-danger">
          {s.couldntLoad}: {page.error}
        </p>
      )}
      {users.error && (
        <p className="text-sm text-danger">
          {t.admin.security.couldntLoadUsers}: {users.error}
        </p>
      )}

      {!page.error && page.entries.length === 0 ? (
        <p className="text-sm text-muted">{filtered || filters.before ? s.none : s.emptyLog}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">{s.cols.when}</th>
                <th className="px-3 py-2 font-medium">{s.cols.who}</th>
                <th className="px-3 py-2 font-medium">{s.cols.what}</th>
                <th className="px-3 py-2 font-medium">{s.cols.record}</th>
                <th className="px-3 py-2 font-medium">{s.cols.fields}</th>
              </tr>
            </thead>
            <tbody>
              {page.entries.map((e) => {
                const isOpen = filters.open === e.id;
                return (
                  <tr key={e.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-muted">
                      {formatDateTime(e.at, locale)}
                    </td>
                    <td className="px-3 py-2">
                      {e.actor ? (actorLabel.get(e.actor) ?? s.unknownUser) : s.filters.system}
                    </td>
                    <td className="px-3 py-2 font-medium text-foreground">{s.kinds[e.kind]}</td>
                    <td className="px-3 py-2">
                      {recordCell(e)}
                      <Link className="text-xs text-muted underline" href={link({ row: e.rowId })}>
                        {s.history}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-muted">
                        {e.kind === "edited"
                          ? e.changed.length > 0
                            ? e.changed.map(fieldLabel).join(", ")
                            : s.onlyTimestamp
                          : s.noFields}
                      </div>
                      <Link
                        className="text-xs underline"
                        href={link({ before: filters.before, open: isOpen ? null : e.id })}
                      >
                        {isOpen ? s.hideValues : s.showValues}
                      </Link>
                      {isOpen && <Detail detail={detail} s={s} changed={e.changed} op={e.op} />}
                      <UndoCell e={e} newest={newest.get(`${e.table}:${e.rowId}`)} s={s} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-4 text-sm">
        {filters.before && (
          <Link className="underline" href={link({})}>
            {s.newest}
          </Link>
        )}
        {page.nextBefore && (
          <Link className="underline" href={link({ before: page.nextBefore })}>
            {s.older}
          </Link>
        )}
      </div>
    </main>
  );
}

function UndoCell({
  e,
  newest,
  s,
}: {
  e: AuditEntry;
  newest: number | undefined;
  s: T["admin"]["recentChanges"];
}) {
  const what = undoKind(e);
  const u = s.undo;
  if (what === "added") return null;
  if (what !== "edit" && what !== "reinsert") {
    return <p className="mt-1 text-xs text-muted">{u.notOffered[what]}</p>;
  }
  if (newest !== e.id) return <p className="mt-1 text-xs text-muted">{u.later}</p>;
  return (
    <div className="mt-1">
      <UndoButton
        id={e.id}
        confirmText={what === "edit" ? u.confirmEdit : u.confirmDelete}
        words={u.words}
      />
    </div>
  );
}

function Detail({
  detail,
  s,
  changed,
  op,
}: {
  detail: Awaited<ReturnType<typeof loadDetail>>;
  s: T["admin"]["recentChanges"];
  changed: string[];
  op: string;
}) {
  if (!detail) return <p className="mt-2 text-xs text-muted">{s.detail.gone}</p>;
  // An edit lists only what changed; an add or delete lists the whole row.
  const keys = op === "UPDATE" ? changed : Object.keys(detail.after ?? detail.before ?? {}).sort();
  return (
    <div className="mt-2 rounded border border-border bg-surface p-2">
      <p className="mb-1 text-xs text-muted">{s.detail.warning}</p>
      <table className="w-full text-xs">
        <thead className="text-muted">
          <tr>
            <th className="py-1 pr-2 text-left font-medium">{s.detail.field}</th>
            {op !== "INSERT" && <th className="py-1 pr-2 text-left font-medium">{s.detail.before}</th>}
            {op !== "DELETE" && <th className="py-1 text-left font-medium">{s.detail.after}</th>}
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k} className="border-t border-border align-top">
              <td className="py-1 pr-2 text-muted">{fieldLabel(k)}</td>
              {op !== "INSERT" && <td className="break-all py-1 pr-2">{showValue(detail.before?.[k])}</td>}
              {op !== "DELETE" && <td className="break-all py-1">{showValue(detail.after?.[k])}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
