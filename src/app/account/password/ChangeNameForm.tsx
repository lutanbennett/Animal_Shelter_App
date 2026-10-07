"use client";

import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { changeOwnName, type ChangeNameState } from "./actions";
import { MAX_NAME_LENGTH } from "@/lib/auth/user-name";
import { useI18n } from "@/lib/i18n/I18nProvider";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/** The signed-in person's own name, beside Change password. Controlled, like that form, so a refusal keeps what was typed. */
export function ChangeNameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [state, formAction, pending] = useActionState(changeOwnName, undefined as ChangeNameState);
  const { t } = useI18n();
  const n = t.account.name;

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form method="post" onSubmit={onSubmit} className="flex max-w-md flex-col gap-2">
      <h2 className="text-lg font-semibold text-foreground">{n.heading}</h2>
      <label htmlFor="name" className="text-sm font-medium text-muted">
        {n.label}
      </label>
      <input
        id="name"
        name="name"
        type="text"
        value={name}
        onChange={(ev) => setName(ev.target.value)}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="name"
        placeholder={n.placeholder}
        className={inputClass}
      />
      <p className="text-xs text-muted">{n.hint}</p>
      {state && "error" in state && <p className="text-sm text-danger">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-success">{n.saved}</p>}
      <div>
        <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save} disabled={pending}>
          {pending ? t.common.saving : n.submit}
        </ActionButton>
      </div>
    </form>
  );
}
