"use client";

import { useActionState } from "react";
import { submitEnquiry, type EnquiryState } from "./actions";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

const input = "w-full rounded border border-border bg-surface px-3 py-2 text-foreground";

export function EnquiryForm({ t }: { t: Dictionary["admin"]["productAdmin"]["enquiry"] }) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, null);
  if (state?.ok) return <p role="status" className="text-foreground">{t.thanks}</p>;
  const fix =
    state && !state.ok
      ? { shelterName: t.fixShelterName, contactName: t.fixContactName, email: t.fixEmail, phone: t.fixPhone, location: t.fixLocation, message: t.fixMessage }[state.problem]
      : null;
  return (
    <form action={action} className="flex max-w-prose flex-col gap-4">
      {fix && <p role="alert" className="text-sm text-red-600">{fix}</p>}
      <label className="flex flex-col gap-1 text-sm">{t.shelterName}<input name="shelterName" required maxLength={200} className={input} /></label>
      <label className="flex flex-col gap-1 text-sm">{t.contactName}<input name="contactName" required maxLength={200} className={input} /></label>
      <label className="flex flex-col gap-1 text-sm">{t.email}<input name="email" type="email" required maxLength={320} className={input} /></label>
      <label className="flex flex-col gap-1 text-sm">{t.phone}<input name="phone" maxLength={60} className={input} /></label>
      <label className="flex flex-col gap-1 text-sm">{t.location}<input name="location" maxLength={200} className={input} /></label>
      <label className="flex flex-col gap-1 text-sm">{t.message}<textarea name="message" rows={5} maxLength={4000} className={input} /></label>
      {/* Honeypot: hidden from people and the keyboard; a bot that fills it is silently ignored. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px" }}>
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" disabled={pending} className="self-start rounded bg-primary px-4 py-2 font-medium text-white disabled:opacity-60">
        {pending ? t.sending : t.send}
      </button>
    </form>
  );
}
