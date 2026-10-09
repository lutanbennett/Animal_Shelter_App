"use client";

import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { deleteVet, updateVet } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";

export type VetRow = {
  id: string;
  name: string;
  name_th: string | null;
  clinic_name: string | null;
  contact_info: string | null;
  notes: string | null;
  /** Logged visits, all statuses — a vet with any can't be deleted. */
  visit_count: number;
  /** Doctors on the clinic's list (doctors), active or not. */
  doctor_count: number;
};

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

function VetRowItem({ vet }: { vet: VetRow }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const [name, setName] = useState(vet.name);
  const [nameTh, setNameTh] = useState(vet.name_th ?? "");
  const [clinicName, setClinicName] = useState(vet.clinic_name ?? "");
  const [contactInfo, setContactInfo] = useState(vet.contact_info ?? "");
  const [notes, setNotes] = useState(vet.notes ?? "");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName(vet.name);
    setNameTh(vet.name_th ?? "");
    setClinicName(vet.clinic_name ?? "");
    setContactInfo(vet.contact_info ?? "");
    setNotes(vet.notes ?? "");
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateVet(vet.id, { name, nameTh, clinicName, contactInfo, notes });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setEditing(false);
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  async function handleDelete() {
    if (!await confirm({ body: t.management.vets.deleteConfirm(vet.name), confirmLabel: t.common.delete })) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteVet(vet.id);
      if (!result.ok) setMessage({ type: "error", text: result.error });
    });
  }

  return (
    <Fragment>
      <tr className="align-top hover:bg-surface-hover">
        <td className="px-4 py-2">
          {editing ? (
            <div className="flex flex-col gap-1">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputClass} min-w-40`}
              />
              <input
                value={nameTh}
                onChange={(e) => setNameTh(e.target.value)}
                placeholder={t.translations.thaiName}
                aria-label={t.translations.thaiName}
                title={t.translations.thaiNameOptionalHint}
                lang="th"
                className={`${inputClass} min-w-40`}
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <Link
                href={`/clinics/${vet.id}`}
                className="font-medium text-foreground hover:underline"
              >
                {vet.name}
              </Link>
              {vet.name_th && (
                <span lang="th" className="text-sm text-foreground">
                  {vet.name_th}
                </span>
              )}
            </div>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder={t.management.vets.createForm.clinicPlaceholder}
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
              placeholder={t.management.vets.createForm.contactPlaceholder}
              rows={2}
              className={`${inputClass} min-w-56`}
            />
          ) : (
            <span className="whitespace-pre-line text-muted">
              {vet.contact_info ?? t.common.dash}
            </span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.management.vets.createForm.notesPlaceholder}
              rows={2}
              className={`${inputClass} min-w-56`}
            />
          ) : (
            <span className="whitespace-pre-line text-muted">{vet.notes ?? t.common.dash}</span>
          )}
        </td>
        <td className="px-4 py-2 text-muted">
          <Link href={`/clinics/${vet.id}`} className="hover:underline">
            {t.management.vets.table.visitCount(vet.visit_count)}
          </Link>
        </td>
        <td className="px-4 py-2">
          <Link
            href={`/management/clinics/${vet.id}/doctors`}
            className="whitespace-nowrap text-primary hover:underline"
          >
            {vet.doctor_count > 0
              ? t.management.vets.table.doctorCount(vet.doctor_count)
              : t.management.vets.table.noDoctors}
          </Link>
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <ActionButton icon={ACTION_ICONS.save} variant="primary" compact disabled={isPending} onClick={handleSave}>
                  {t.common.save}
                </ActionButton>
                <ActionButton
                  icon={ACTION_ICONS.clear}
                  compact
                  disabled={isPending}
                  onClick={() => {
                    setEditing(false);
                    reset();
                  }}
                >
                  {t.common.cancel}
                </ActionButton>
              </>
            ) : (
              <RowActionButton
                onClick={() => setEditing(true)}
                label={t.common.edit}
                subject={vet.name}
                icon={ACTION_ICONS.edit}
              />
            )}
            <RowActionButton
              disabled={isPending || vet.visit_count > 0}
              onClick={handleDelete}
              label={t.common.delete}
              hint={
                vet.visit_count > 0
                  ? t.management.vets.errors.hasVisits(vet.visit_count)
                  : undefined
              }
              subject={vet.name}
              icon={ACTION_ICONS.delete}
              tone="danger"
            />
          </div>
        </td>
      </tr>
      {message && (
        <tr>
          <td
            colSpan={7}
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

export function ClinicsTable({ vets }: { vets: VetRow[] }) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{t.management.vets.table.name}</th>
            <th className="px-4 py-2 font-medium">{t.management.vets.table.clinic}</th>
            <th className="px-4 py-2 font-medium">{t.management.vets.table.contact}</th>
            <th className="px-4 py-2 font-medium">{t.management.vets.table.notes}</th>
            <th className="px-4 py-2 font-medium">{t.management.vets.table.visits}</th>
            <th className="px-4 py-2 font-medium">{t.management.vets.table.doctors}</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {vets.map((vet) => (
            <VetRowItem key={vet.id} vet={vet} />
          ))}
          {vets.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-muted">
                {t.management.vets.table.noVets}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
