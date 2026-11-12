"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ADOPTER_NOTE_MAX_CHARS } from "@/lib/adopter/limits";
import { sendAdopterUpdate } from "./actions";

/** The one control on the page. It is drawn only for a resident adopter_residents() returned, the card-free scope its action asks again. */
export function AdopterUpdateForm({ residentId }: { residentId: string }) {
  const { t } = useI18n();
  const a = t.adopterUpdate;
  const router = useRouter();
  const [words, setWords] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(ev) => {
        ev.preventDefault();
        setError(null);
        setSent(false);
        start(async () => {
          const r = await sendAdopterUpdate(residentId, words);
          if (r.ok) {
            setWords("");
            setSent(true);
            router.refresh();
          } else {
            setError(r.error);
          }
        });
      }}
    >
      <label className="text-sm font-medium text-foreground" htmlFor={`words-${residentId}`}>{a.wordsLabel}</label>
      <textarea
        id={`words-${residentId}`}
        value={words}
        onChange={(ev) => setWords(ev.target.value)}
        maxLength={ADOPTER_NOTE_MAX_CHARS}
        rows={4}
        className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
      />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || !words.trim()} className="rounded bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {pending ? a.sending : a.send}
        </button>
        {sent && <span role="status" className="text-sm text-foreground">{a.sentWaiting}</span>}
        {error && <span role="alert" className="text-sm text-red-700">{error}</span>}
      </div>
    </form>
  );
}
