"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { Fragment, useMemo, useState, useTransition } from "react";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ActionResult } from "@/lib/action-result";
import { likelyDuplicates } from "@/lib/vets/doctors";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import {
  deleteDoctor,
  mergeDoctors,
  renameDoctor,
  setDoctorActive,
} from "./actions";

export type DoctorRow = {
  id: string;
  name: string;
  /** Still works at this clinic (the link's flag, 0125). */
  active: boolean;
  /** A login is linked to this doctor (user_id). Their links are an admin's to edit. */
  hasLogin: boolean;
  /** The other clinics they work at, by name. */
  otherClinics: string[];
  /** Visits linked to this doctor, all statuses. Any at all blocks delete. */
  visit_count: number;
  last_visit: string | null;
};

/** A doctor who is not on this clinic's list: who "same person as…" can merge into. */
export type ElsewhereDoctor = {
  id: string;
  name: string;
  hasLogin: boolean;
  clinics: string[];
};

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

const smallButton =
  "rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

const primaryButton =
  "rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50";

const COLUMNS = 3;

type MergeTarget = { id: string; name: string; active: boolean; hasLogin: boolean; clinics: string[] };

const mergeLabel = (d: ReturnType<typeof useI18n>["t"]["management"]["vetDoctors"], row: MergeTarget) =>
  d.merge.option(row.active ? row.name : d.merge.leftOption(row.name), row.clinics);

function DoctorRowItem({
  vetId,
  doctor,
  mergeTargets,
  duplicates,
  isAdmin,
}: {
  vetId: string;
  doctor: DoctorRow;
  /** Any other doctor, here or at another clinic: the "same person as…" choices. */
  mergeTargets: MergeTarget[];
  /** Other doctors whose name looks like this one's. */
  duplicates: MergeTarget[];
  isAdmin: boolean;
}) {
  const { t, locale } = useI18n();
  const confirm = useConfirm();
  const d = t.management.vetDoctors;
  const [name, setName] = useState(doctor.name);
  const [mode, setMode] = useState<"view" | "edit" | "merge">("view");
  const [mergeInto, setMergeInto] = useState("");
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName(doctor.name);
    setMergeInto("");
    setMode("view");
    setMessage(null);
  }

  function run(action: () => Promise<ActionResult>, success?: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMode("view");
      if (success) setMessage({ type: "success", text: success });
    });
  }

  async function handleRename() {
    const next = name.trim().replace(/\s+/g, " ");
    if (next === doctor.name) {
      reset();
      return;
    }
    // A rename rewrites the name on every linked visit, past ones included.
    // Say how many before doing it.
    if (
      (doctor.visit_count > 0 || doctor.otherClinics.length > 0) &&
      !await confirm({ body: d.renameConfirm(doctor.name, next, doctor.visit_count, doctor.otherClinics) })
    ) {
      return;
    }
    run(() => renameDoctor(vetId, doctor.id, next), t.common.saved);
  }

  function openMerge() {
    // One obvious duplicate: start with it chosen.
    setMergeInto(duplicates.length === 1 ? duplicates[0].id : "");
    setMode("merge");
  }

  async function handleMerge() {
    const target = mergeTargets.find((row) => row.id === mergeInto);
    if (!target) return;
    if (!await confirm({ body: d.mergeConfirm(doctor.name, target.name, doctor.visit_count, target.clinics) })) return;
    run(() => mergeDoctors(vetId, doctor.id, target.id));
  }

  async function handleDelete() {
    if (!await confirm({ body: d.deleteConfirm(doctor.name), confirmLabel: t.common.delete })) return;
    run(() => deleteDoctor(vetId, doctor.id));
  }

  const renamedPreview = name.trim().replace(/\s+/g, " ");

  return (
    <Fragment>
      <tr className={`align-top hover:bg-surface-hover ${doctor.active ? "" : "text-muted"}`}>
        <td className="px-4 py-2">
          {mode === "edit" ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") reset();
              }}
              aria-label={d.table.name}
              autoFocus
              className={`${inputClass} min-w-48`}
            />
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="flex flex-wrap items-center gap-2">
                <span className={`font-medium ${doctor.active ? "text-foreground" : "text-muted"}`}>
                  {doctor.name}
                </span>
                {!doctor.active && (
                  <span className="rounded border border-border px-1.5 text-xs text-muted">
                    {d.leftBadge}
                  </span>
                )}
                {doctor.hasLogin && (
                  <span className="rounded border border-border px-1.5 text-xs text-muted">
                    {d.loginBadge}
                  </span>
                )}
              </span>
              {doctor.otherClinics.length > 0 && (
                <span className="text-xs text-muted">{d.alsoWorksAt(doctor.otherClinics)}</span>
              )}
              {duplicates.length > 0 && (
                <span className="text-xs text-warning">
                  {d.possibleDuplicate(duplicates.map((row) => mergeLabel(d, row)).join(", "))}
                </span>
              )}
            </div>
          )}
        </td>
        <td className="px-4 py-2 text-muted">
          <div className="flex flex-col">
            <span className="tabular-nums">{d.table.visitCount(doctor.visit_count)}</span>
            {doctor.last_visit && (
              <span className="text-xs">{d.table.lastVisit(formatDate(doctor.last_visit, locale))}</span>
            )}
          </div>
        </td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap items-center gap-2 md:min-w-[11rem]">
            {mode === "edit" && (
              <>
                <button type="button" disabled={isPending} onClick={handleRename} className={primaryButton}>
                  {t.common.save}
                </button>
                <button type="button" disabled={isPending} onClick={reset} className={smallButton}>
                  {t.common.cancel}
                </button>
              </>
            )}
            {mode === "merge" && (
              <>
                <select
                  value={mergeInto}
                  onChange={(e) => setMergeInto(e.target.value)}
                  aria-label={d.merge.into}
                  className="w-56 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">{d.merge.pickTarget}</option>
                  {mergeTargets.map((row) => (
                    <option key={row.id} value={row.id}>
                      {mergeLabel(d, row)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isPending || !mergeInto}
                  onClick={handleMerge}
                  className={primaryButton}
                >
                  {d.merge.button}
                </button>
                <button type="button" disabled={isPending} onClick={reset} className={smallButton}>
                  {t.common.cancel}
                </button>
              </>
            )}
            {mode === "view" && (
              <>
                <RowActionButton
                  disabled={isPending}
                  onClick={() => setMode("edit")}
                  label={d.rename}
                  subject={doctor.name}
                  icon={ACTION_ICONS.edit}
                />
                <RowActionButton
                  disabled={isPending || mergeTargets.length === 0}
                  onClick={openMerge}
                  label={d.merge.open}
                  subject={doctor.name}
                  icon={ACTION_ICONS.merge}
                />
                <RowActionButton
                  disabled={isPending || (doctor.hasLogin && !isAdmin)}
                  onClick={() =>
                    run(() => setDoctorActive(vetId, doctor.id, !doctor.active))
                  }
                  label={doctor.active ? d.markLeft : d.markActive}
                  hint={
                    doctor.hasLogin && !isAdmin
                      ? d.errors.loginLinksAdminOnly
                      : doctor.active
                        ? d.markLeftHint
                        : undefined
                  }
                  subject={doctor.name}
                  icon={doctor.active ? ACTION_ICONS.deactivate : ACTION_ICONS.activate}
                />
                <RowActionButton
                  disabled={isPending || doctor.visit_count > 0 || (doctor.hasLogin && !isAdmin)}
                  onClick={handleDelete}
                  label={t.common.delete}
                  hint={
                    doctor.visit_count > 0
                      ? d.errors.hasVisits(doctor.visit_count)
                      : doctor.hasLogin && !isAdmin
                        ? d.errors.loginLinksAdminOnly
                        : undefined
                  }
                  subject={doctor.name}
                  icon={ACTION_ICONS.delete}
                  tone="danger"
                />
              </>
            )}
          </div>
        </td>
      </tr>
      {mode === "edit" && doctor.visit_count > 0 && (
        <tr>
          <td colSpan={COLUMNS} className="px-4 pb-2 text-xs text-warning">
            {d.renameReach(doctor.visit_count, renamedPreview || doctor.name)}
          </td>
        </tr>
      )}
      {mode === "merge" && (
        <tr>
          <td colSpan={COLUMNS} className="px-4 pb-2 text-xs text-muted">
            {d.merge.hint(doctor.name, doctor.visit_count)}
          </td>
        </tr>
      )}
      {message && (
        <tr>
          <td
            colSpan={COLUMNS}
            className={`px-4 pb-2 text-xs ${message.type === "error" ? "text-danger" : "text-success"}`}
          >
            {message.text}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function DoctorsTable({
  vetId,
  doctors,
  elsewhere,
  isAdmin,
}: {
  vetId: string;
  doctors: DoctorRow[];
  elsewhere: ElsewhereDoctor[];
  isAdmin: boolean;
}) {
  const { t } = useI18n();
  const d = t.management.vetDoctors;

  const active = doctors.filter((doctor) => doctor.active);
  const left = doctors.filter((doctor) => !doctor.active);
  // Everyone a doctor might be the same person as: this clinic's list and
  // the other clinics'. Suggested by name core, never merged by it.
  const everyone = useMemo<MergeTarget[]>(
    () => [
      ...doctors.map((x) => ({ id: x.id, name: x.name, active: x.active, hasLogin: x.hasLogin, clinics: [] })),
      ...elsewhere.map((x) => ({ id: x.id, name: x.name, active: true, hasLogin: x.hasLogin, clinics: x.clinics })),
    ],
    [doctors, elsewhere],
  );
  const duplicates = useMemo(() => likelyDuplicates(everyone), [everyone]);
  const hereDuplicates = doctors.filter((doctor) => duplicates.has(doctor.id)).length;

  const row = (doctor: DoctorRow) => (
    <DoctorRowItem
      key={doctor.id}
      vetId={vetId}
      doctor={doctor}
      mergeTargets={everyone.filter((other) => other.id !== doctor.id)}
      duplicates={duplicates.get(doctor.id) ?? []}
      isAdmin={isAdmin}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      {hereDuplicates > 0 && (
        <p role="note" className="rounded border border-warning/40 bg-warning/5 px-4 py-2 text-sm text-foreground">
          {d.duplicatesNote(hereDuplicates)}
        </p>
      )}
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">{d.table.name}</th>
              <th className="px-4 py-2 font-medium">{d.table.visits}</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {active.map(row)}
            {doctors.length === 0 && (
              <tr>
                <td colSpan={COLUMNS} className="px-4 py-6 text-center text-muted">
                  {d.table.noDoctors}
                </td>
              </tr>
            )}
            {left.length > 0 && (
              <tr>
                <th
                  colSpan={COLUMNS}
                  scope="colgroup"
                  className="bg-surface px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted"
                >
                  {d.table.leftHeading(left.length)}
                </th>
              </tr>
            )}
            {left.map(row)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
