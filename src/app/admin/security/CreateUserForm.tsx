"use client";

import { useKeptForm } from "@/lib/use-kept-form";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createUser } from "./actions";
import { MAX_NAME_LENGTH } from "@/lib/auth/user-name";
import { TemporaryPasswordNotice } from "@/components/TemporaryPasswordNotice";

export function CreateUserForm() {
  const [state, onSubmit, pending] = useKeptForm(createUser, undefined);
  const { t } = useI18n();

  const ROLES = [
    { value: "staff", label: t.admin.security.roles.staff },
    { value: "admin", label: t.admin.security.roles.admin },
    { value: "management", label: t.admin.security.roles.management },
    { value: "vet", label: t.admin.security.roles.vet },
    { value: "volunteer", label: t.admin.security.roles.volunteer },
    { value: "public_viewer", label: t.admin.security.roles.public_viewer },
  ];

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-muted">
          {t.admin.security.createForm.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="off"
          className="w-64 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-muted">
          {t.admin.security.createForm.name}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          maxLength={MAX_NAME_LENGTH}
          autoComplete="off"
          placeholder={t.admin.security.createForm.namePlaceholder}
          className="w-48 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-sm font-medium text-muted">
          {t.admin.security.createForm.role}
        </label>
        <select
          id="role"
          name="role"
          defaultValue="staff"
          className="w-40 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.add} disabled={pending}>
        {pending ? t.common.creating : t.admin.security.createForm.createButton}
      </ActionButton>
      {state && !state.ok && (
        <p className="w-full text-sm text-danger">{state.error}</p>
      )}
      <p className="w-full text-xs text-muted">{t.admin.security.createForm.tempPasswordNote}</p>
      {state?.ok && (
        <>
          <p className="w-full text-sm text-success">{state.success}</p>
          <TemporaryPasswordNotice email={state.email} password={state.temporaryPassword} />
        </>
      )}
    </form>
  );
}
