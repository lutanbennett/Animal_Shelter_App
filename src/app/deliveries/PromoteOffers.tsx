"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import type { PromotionOffer } from "@/lib/management/described-lines";
import { promoteDescription } from "./promote-actions";

/**
 * Wordings typed on more than one line, each with an offer to add it to Settings → Medications or → Diets so it
 * starts counting as stock (0308). Nothing happens until somebody accepts, in one confirmed step that names how many
 * lines will be linked. Each button is drawn only when the login may do what its action asks (the page passes
 * mayMedication / mayDiet from canEditItemSettings, the same question promoteDescription asks), and the action
 * checks again.
 */
export function PromoteOffers({
  offers,
  mayMedication,
  mayDiet,
}: {
  offers: PromotionOffer[];
  mayMedication: boolean;
  mayDiet: boolean;
}) {
  const { t } = useI18n();
  const p = t.deliveries.promote;
  const router = useRouter();
  const write = useWriteCall();
  const [asking, setAsking] = useState<{ key: string; target: "medication" | "diet" } | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const accept = (offer: PromotionOffer, target: "medication" | "diet") => {
    setMessage(null);
    startTransition(async () => {
      const result = await write((requestId) =>
        promoteDescription({ target, key: offer.key, lineIds: offer.lineIds, unit: offer.unit }, requestId),
      );
      setAsking(null);
      if (!result.ok) {
        setMessage({ ok: false, text: result.error });
        return;
      }
      setMessage({ ok: true, text: p.done(result.name ?? offer.description, result.linked ?? offer.lineIds.length) });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded border border-border bg-surface p-3">
      <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
      <p className="text-xs text-muted">{p.hint}</p>
      <ul className="flex flex-col gap-2">
        {offers.map((offer) => {
          const confirming = asking?.key === offer.key ? asking.target : null;
          return (
            <li key={offer.key} className="flex flex-col gap-2 text-sm text-foreground">
              <span className="font-medium">{p.line(offer.description, offer.total)}</span>
              {confirming ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span>
                    {p.confirm(offer.description, offer.lineIds.length, confirming === "medication" ? p.medications : p.food)}
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => accept(offer, confirming)}
                    className="min-h-10 rounded bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {pending ? p.working : p.yes}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setAsking(null)}
                    className="min-h-10 rounded border border-border px-3 text-sm text-foreground hover:bg-surface-hover"
                  >
                    {p.cancel}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {mayMedication && (
                    <button
                      type="button"
                      onClick={() => setAsking({ key: offer.key, target: "medication" })}
                      className="min-h-10 rounded border border-border px-3 text-sm font-medium text-foreground hover:bg-surface-hover"
                    >
                      {p.addMedication}
                    </button>
                  )}
                  {mayDiet && (
                    <button
                      type="button"
                      onClick={() => setAsking({ key: offer.key, target: "diet" })}
                      className="min-h-10 rounded border border-border px-3 text-sm font-medium text-foreground hover:bg-surface-hover"
                    >
                      {p.addFood}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
