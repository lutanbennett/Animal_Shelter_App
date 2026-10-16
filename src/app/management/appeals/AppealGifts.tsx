"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import { formatBahtExact, formatDate } from "@/lib/format";
import { moveGiftOutOfAppeal, moveGiftsToAppeal } from "./actions";

export type GiftItem = {
  id: string;
  receivedOn: string;
  donor: string;
  /** Baht, or null for a gift in kind. */
  amount: number | null;
};

/**
 * What is counted on the appeal, and the gifts recorded "for the resident"
 * that can be moved onto it. A move changes the same donation (it does not
 * copy it), so the public figure goes up by exactly what leaves the resident.
 */
export function AppealGifts({
  appealId,
  closed,
  canMove,
  counted,
  movable,
}: {
  appealId: string;
  closed: boolean;
  canMove: boolean;
  counted: GiftItem[];
  movable: GiftItem[];
}) {
  const { t, locale } = useI18n();
  const g = t.appealsAdmin.gifts;
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const money = (n: number) => formatBahtExact(n, locale);
  const amountText = (x: GiftItem) => (x.amount == null ? g.inKind : money(x.amount));
  const pickedTotal = movable.filter((m) => picked.has(m.id)).reduce((s, m) => s + Math.round((m.amount ?? 0) * 100), 0) / 100;

  function toggle(id: string, on: boolean) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function moveAcross() {
    const ids = [...picked];
    if (!(await confirm({ body: g.moveConfirm(ids.length, money(pickedTotal)) }))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await moveGiftsToAppeal(appealId, ids);
      if (!result.ok) return setMessage({ type: "error", text: result.error });
      setPicked(new Set());
      setMessage({ type: "ok", text: g.moved(result.moved) });
      router.refresh();
    });
  }

  async function takeOut(id: string) {
    if (!(await confirm({ body: g.moveOutConfirm }))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await moveGiftOutOfAppeal(appealId, id);
      if (!result.ok) return setMessage({ type: "error", text: result.error });
      setMessage({ type: "ok", text: g.movedOut });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {counted.length === 0 ? (
        <p className="text-sm text-muted">{g.none}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{g.listHeading}</h3>
          <ul className="flex flex-col divide-y divide-border rounded border border-border">
            {counted.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm">
                <span className="w-28 text-muted">{formatDate(x.receivedOn, locale)}</span>
                <span className="min-w-0 flex-1 text-foreground" lang="und">{x.donor}</span>
                <span className="font-medium tabular-nums text-foreground">{amountText(x)}</span>
                <Link href={`/management/donations/${x.id}`} className="inline-flex min-h-11 items-center text-primary underline">{g.open}</Link>
                {canMove && !closed && (
                  <button type="button" disabled={pending} onClick={() => takeOut(x.id)} className="min-h-11 rounded border border-border px-3 text-sm text-foreground hover:bg-surface-hover disabled:opacity-60">
                    {g.moveOut}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {closed ? (
        <p className="text-sm text-muted">{g.closedNote}</p>
      ) : canMove ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{g.movableHeading}</h3>
          {movable.length === 0 ? (
            <p className="text-sm text-muted">{g.movableNone}</p>
          ) : (
            <>
              <p className="text-sm text-muted">{g.movableHint}</p>
              <ul className="flex flex-col divide-y divide-border rounded border border-border">
                {movable.map((x) => (
                  <li key={x.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1 text-sm">
                    <label className="flex min-h-11 flex-1 items-center gap-3">
                      <input type="checkbox" checked={picked.has(x.id)} onChange={(e) => toggle(x.id, e.target.checked)} />
                      <span className="w-28 text-muted">{formatDate(x.receivedOn, locale)}</span>
                      <span className="min-w-0 flex-1 text-foreground" lang="und">{x.donor}</span>
                    </label>
                    <span className="font-medium tabular-nums text-foreground">{amountText(x)}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={pending || picked.size === 0}
                onClick={moveAcross}
                className="min-h-11 self-start rounded bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
              >
                {g.move(picked.size)}
              </button>
            </>
          )}
        </div>
      ) : null}

      {message && (
        <p role={message.type === "error" ? "alert" : "status"} className={`rounded border px-3 py-2 text-sm ${message.type === "error" ? "border-danger bg-danger/10 text-danger" : "border-success/50 bg-success/10 text-success"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
