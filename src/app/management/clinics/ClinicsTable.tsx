"use client";

import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { deleteClinic, updateClinic } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";

export type ClinicRow = {
  id: string;
  name: string;
  name_th: string | null;
  contact_info: string | null;
  notes: string | null;
  /** Logged visits, all statuses — a clinic with any can't be deleted. */
  visit_count: number;
  /** Doctors on the clinic's list (doctors), active or not. */
  doctor_count: number;
};

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

function ClinicRowItem({ clinic }: { clinic: ClinicRow }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const [name, setName] = useState(clinic.name);
  const [nameTh, setNameTh] = useState(clinic.name_th ?? "");
  const [contactInfo, setContactInfo] = useState(clinic.contact_info ?? "");
  const [notes, setNotes] = useState(clinic.notes ?? "");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName(clinic.name);
    setNameTh(clinic.name_th ?? "");
    setContactInfo(clinic.contact_info ?? "");
    setNotes(clinic.notes ?? "");
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateClinic(clinic.id, { name, nameTh, contactInfo, notes });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setEditing(false);
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  async function handleDelete() {
    if (!await confirm({ body: t.management.vets.deleteConfirm(clinic.name), confirmLabel: t.common.delete })) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteClinic(clinic.id);
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
                href={`/clinics/${clinic.id}`}
                className="font-medium text-foreground hover:underline"
              >
                {clinic.name}
              </Link>
              {clinic.name_th && (
                <span lang="th" className="text-sm text-foreground">
                  {clinic.name_th}
                </span>
              )}
            </div>
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
              {clinic.contact_info ?? t.common.dash}
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
            <span className="whitespace-pre-line text-muted">{clinic.notes ?? t.common.dash}</span>
          )}
        </td>
        <td className="px-4 py-2 text-muted">
          <Link href={`/clinics/${clinic.id}`} className="hover:underline">
            {t.management.vets.table.visitCount(clinic.visit_count)}
          </Link>
        </td>
        <td className="px-4 py-2">
          <Link
            href={`/management/clinics/${clinic.id}/doctors`}
            className="whitespace-nowrap text-primary hover:underline"
          >
            {clinic.doctor_count > 0
              ? t.management.vets.table.doctorCount(clinic.doctor_count)
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
                subject={clinic.name}
                icon={ACTION_ICONS.edit}
              />
            )}
            <RowActionButton
              disabled={isPending || clinic.visit_count > 0}
              onClick={handleDelete}
              label={t.common.delete}
              hint={
                clinic.visit_count > 0
                  ? t.management.vets.errors.hasVisits(clinic.visit_count)
                  : undefined
              }
              subject={clinic.name}
              icon={ACTION_ICONS.delete}
              tone="danger"
            />
          </div>
        </td>
      </tr>
      {message && (
        <tr>
          <td
            colSpan={6}
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

export function ClinicsTable({ clinics }: { clinics: ClinicRow[] }) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{t.management.vets.table.name}</th>
            <th className="px-4 py-2 font-medium">{t.management.vets.table.contact}</th>
            <th className="px-4 py-2 font-medium">{t.management.vets.table.notes}</th>
            <th className="px-4 py-2 font-medium">{t.management.vets.table.visits}</th>
            <th className="px-4 py-2 font-medium">{t.management.vets.table.doctors}</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {clinics.map((clinic) => (
            <ClinicRowItem key={clinic.id} clinic={clinic} />
          ))}
          {clinics.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-muted">
                {t.management.vets.table.noVets}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
