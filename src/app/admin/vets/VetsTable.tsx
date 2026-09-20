"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { deleteVet, updateVet } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type VetRow = {
  id: string;
  name: string;
  clinic_name: string | null;
  contact_info: string | null;
  /** Logged visits, all statuses — a vet with any can't be deleted. */
  visit_count: number;
};

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

function VetRowItem({ vet }: { vet: VetRow }) {
  const { t } = useI18n();
  const [name, setName] = useState(vet.name);
  const [clinicName, setClinicName] = useState(vet.clinic_name ?? "");
  const [contactInfo, setContactInfo] = useState(vet.contact_info ?? "");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName(vet.name);
    setClinicName(vet.clinic_name ?? "");
    setContactInfo(vet.contact_info ?? "");
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateVet(vet.id, { name, clinicName, contactInfo });
        setEditing(false);
        setMessage({ type: "success", text: t.common.saved });
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : t.common.failedToSave,
        });
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(t.admin.vets.deleteConfirm(vet.name))) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await deleteVet(vet.id);
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : t.common.failedToDelete,
        });
      }
    });
  }

  return (
    <Fragment>
      <tr className="align-top hover:bg-surface-hover">
        <td className="px-4 py-2">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} min-w-40`}
            />
          ) : (
            <Link
              href={`/vets/${vet.id}`}
              className="font-medium text-foreground hover:underline"
            >
              {vet.name}
            </Link>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder={t.admin.vets.createForm.clinicPlaceholder}
              className={`${inputClass} min-w-40`}
            />
          ) : (
            <span className="text-muted">{vet.clinic_name ?? t.common.dash}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <textarea
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder={t.admin.vets.createForm.contactPlaceholder}
              rows={2}
              className={`${inputClass} min-w-56`}
            />
          ) : (
            <span className="whitespace-pre-line text-muted">
              {vet.contact_info ?? t.common.dash}
            </span>
          )}
        </td>
        <td className="px-4 py-2 text-muted">
          <Link href={`/vets/${vet.id}`} className="hover:underline">
            {t.admin.vets.table.visitCount(vet.visit_count)}
          </Link>
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSave}
                  className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                >
                  {t.common.save}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setEditing(false);
                    reset();
                  }}
                  className="rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover"
                >
                  {t.common.cancel}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground"
              >
                {t.common.edit}
              </button>
            )}
            <button
              type="button"
              disabled={isPending || vet.visit_count > 0}
              title={
                vet.visit_count > 0
                  ? t.admin.vets.errors.hasVisits(vet.visit_count)
                  : undefined
              }
              onClick={handleDelete}
              className="rounded border border-danger/40 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.common.delete}
            </button>
          </div>
        </td>
      </tr>
      {message && (
        <tr>
          <td
            colSpan={5}
            className={`px-4 pb-2 text-xs ${
              message.type === "error" ? "text-danger" : "text-success"
            }`}
          >
            {message.text}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function VetsTable({ vets }: { vets: VetRow[] }) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{t.admin.vets.table.name}</th>
            <th className="px-4 py-2 font-medium">{t.admin.vets.table.clinic}</th>
            <th className="px-4 py-2 font-medium">{t.admin.vets.table.contact}</th>
            <th className="px-4 py-2 font-medium">{t.admin.vets.table.visits}</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {vets.map((vet) => (
            <VetRowItem key={vet.id} vet={vet} />
          ))}
          {vets.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted">
                {t.admin.vets.table.noVets}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
