"use client";

import { useState, useTransition } from "react";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import type { ActionResult } from "@/lib/action-result";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createVetDoctorForLogin, linkVetDoctor, unlinkVetDoctor } from "./actions";
import type { ClinicOption, SecurityUser } from "./UsersTable";

export type DoctorOption = { id: string; name: string; clinics: string[] };

/**
 * A vet login's clinics (Settings → Security). They are not set here: they
 * are the clinics of the doctor the login is linked to (vet_doctors.user_id,
 * 0125), edited on the clinic's Doctors page, so there is one place that
 * says where a vet works. Here an admin picks the doctor, or makes one from
 * the login. Most doctors never get a login; unlinking leaves the doctor
 * and their visits as they are.
 */
export function VetDoctorLink({
  user,
  clinics,
  unlinkedDoctors,
  disabled,
}: {
  user: SecurityUser;
  clinics: ClinicOption[];
  unlinkedDoctors: DoctorOption[];
  disabled: boolean;
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const v = t.admin.security.table.vetDoctor;
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [pick, setPick] = useState("");
  const [name, setName] = useState(user.name ?? user.email.split("@")[0]);
  const [picked, setPicked] = useState<string[]>([]);

  function run(action: () => Promise<ActionResult>, success: string, onOk?: () => void) {
    setMessage(null);
    startTransition(async () => {
      let result: ActionResult;
      try {
        result = await action();
      } catch {
        result = { ok: false, error: v.failed };
      }
      if (result.ok) {
        onOk?.();
        setMessage({ type: "success", text: success });
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  async function handleUnlink() {
    if (!user.doctor) return;
    if (!(await confirm({ body: v.unlinkConfirm(user.doctor.name, user.email) }))) return;
    run(() => unlinkVetDoctor(user.id), v.unlinked);
  }

  return (
    <div className="mt-1 flex flex-col gap-1 text-xs text-muted">
      <span>{v.label}</span>
      {user.doctor ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-foreground">{user.doctor.name}</span>
          <span>
            {user.doctor.clinics.length > 0 ? v.worksAt(user.doctor.clinics) : v.worksNowhere}
          </span>
          <span>{v.editClinicsHint}</span>
          <div>
            <ActionButton compact icon={ACTION_ICONS.unlink} disabled={disabled || isPending} onClick={handleUnlink}>
              {v.unlink}
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="text-warning">{v.notLinked}</span>
          {!creating && (
            <>
              <select
                value={pick}
                disabled={disabled || isPending}
                onChange={(e) => setPick(e.target.value)}
                aria-label={v.pickDoctor}
                className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="">{v.pickDoctor}</option>
                {unlinkedDoctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.clinics.length ? `${d.name} — ${d.clinics.join(", ")}` : d.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  compact
                  icon={ACTION_ICONS.link}
                  disabled={disabled || isPending || !pick}
                  onClick={() => run(() => linkVetDoctor(user.id, pick), v.linked, () => setPick(""))}
                >
                  {v.link}
                </ActionButton>
                <ActionButton
                  compact
                  icon={ACTION_ICONS.add}
                  disabled={disabled || isPending}
                  onClick={() => setCreating(true)}
                >
                  {v.createOpen}
                </ActionButton>
              </div>
            </>
          )}
          {creating && (
            <div className="flex flex-col gap-2 rounded border border-border p-2">
              <label className="flex flex-col gap-0.5">
                {v.createName}
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
                />
              </label>
              <fieldset className="flex flex-col gap-1">
                <legend>{v.createClinics}</legend>
                {clinics.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-foreground">
                    <input
                      type="checkbox"
                      checked={picked.includes(c.id)}
                      onChange={(e) =>
                        setPicked((cur) => (e.target.checked ? [...cur, c.id] : cur.filter((id) => id !== c.id)))
                      }
                    />
                    {c.label}
                  </label>
                ))}
              </fieldset>
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  compact
                  icon={ACTION_ICONS.add}
                  disabled={isPending || !name.trim()}
                  onClick={() =>
                    run(() => createVetDoctorForLogin(user.id, name, picked), v.created, () => setCreating(false))
                  }
                >
                  {v.createButton}
                </ActionButton>
                <ActionButton compact icon={ACTION_ICONS.clear} disabled={isPending} onClick={() => setCreating(false)}>
                  {t.common.cancel}
                </ActionButton>
              </div>
            </div>
          )}
        </div>
      )}
      {message && (
        <span className={message.type === "error" ? "text-danger" : "text-success"}>{message.text}</span>
      )}
    </div>
  );
}
