"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useWriteCall } from "@/lib/use-write-form";
import { createRole } from "./actions";
import { roleKeyFromName } from "./role-key";

/**
 * Create a role (Admin, with the authenticator app, only: the page draws this for no one else and createRole() refuses
 * anyone else). Shows the key the role will use before it is made. The new role has no cards; on success the page opens it
 * so the next step, giving it cards, is on the screen already.
 */
export function CreateRoleForm({ labels }: { labels: { open: string; heading: string; name: string; nameTh: string; keyIs: string; keyNeedsLatin: string; noCards: string; submit: string; cancel: string } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [error, setError] = useState<string | null>(null);
  const writeCreate = useWriteCall();
  const key = roleKeyFromName(name);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 self-start rounded-md border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
        {labels.open}
      </button>
    );
  }
  return (
    <form
      aria-label={labels.heading}
      className="flex flex-col gap-3 rounded-md border border-border bg-surface p-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await writeCreate((requestId) => createRole(name, nameTh, requestId));
          if (!result.ok) { setError(result.error); return; }
          router.push(`/admin/who-does-what?role=${result.key}`);
          router.refresh();
        });
      }}
    >
      <h2 className="text-base font-semibold text-foreground">{labels.heading}</h2>
      <label className="flex flex-col gap-1 text-sm text-foreground">
        {labels.name}
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className="min-h-11 rounded-md border border-border bg-background px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-foreground">
        {labels.nameTh}
        <input value={nameTh} onChange={(e) => setNameTh(e.target.value)} maxLength={80} className="min-h-11 rounded-md border border-border bg-background px-3 py-2" />
      </label>
      <p className="text-sm text-muted [overflow-wrap:anywhere]">{name.trim() && !key ? labels.keyNeedsLatin : key ? labels.keyIs.replace("{key}", key) : ""}</p>
      <p className="text-sm text-muted">{labels.noCards}</p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending || !key} className="min-h-11 rounded-md border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {labels.submit}
        </button>
        <button type="button" disabled={pending} onClick={() => { setOpen(false); setError(null); }} className="min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground">
          {labels.cancel}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
    </form>
  );
}
