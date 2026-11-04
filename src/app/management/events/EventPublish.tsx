"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import { setEventPublished } from "./actions";

/** Put the event on the website, or take it off. Photos still wait for approval whatever this says. */
export function EventPublish({ eventId, published, cancelled, waitingPhotos }: { eventId: string; published: boolean; cancelled: boolean; waitingPhotos: number }) {
  const { t } = useI18n();
  const p = t.eventsAdmin.publish;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const publishCall = useWriteCall();
  const [error, setError] = useState<string | null>(null);

  function move(next: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await publishCall((requestId) => setEventPublished(eventId, next, requestId));
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <section className="flex max-w-3xl flex-col gap-2 rounded border border-border bg-surface p-4">
      <h2 className="text-base font-semibold text-foreground">{p.heading}</h2>
      <p className="text-sm text-foreground">{published ? p.on : p.off}</p>
      {cancelled && <p className="text-sm text-muted">{p.cancelled}</p>}
      {waitingPhotos > 0 && <p className="text-sm text-muted">{p.waiting(waitingPhotos)}</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button
        type="button"
        disabled={pending || (!published && cancelled)}
        onClick={() => move(!published)}
        className="min-h-11 self-start rounded bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {published ? p.unpublish : p.publish}
      </button>
    </section>
  );
}
