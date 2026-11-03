"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { DateInput } from "@/components/DateInput";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import { monthInputValue } from "@/lib/bills/utility";
import { recordUtilityBill } from "./actions";

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

type Kind = { id: string; label: string; parentId: string | null };
type Place = { id: string; name: string };
type Account = { id: string; label: string; premisesId: string | null; kindId: string | null };

/** Record a utility bill with no photo. Drawn only on a page that already asked bills.utilities, and recordUtilityBill asks it again. */
export function UtilityForm({ kinds, places, accounts, today }: { kinds: Kind[]; places: Place[]; accounts: Account[]; today: string }) {
  const { t } = useI18n();
  const u = t.bills.utilities;
  const router = useRouter();
  const write = useWriteCall();
  const [kindId, setKindId] = useState("");
  const [premisesId, setPremisesId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(monthInputValue(today));
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const parentOfKind = kinds.find((k) => k.id === kindId)?.parentId;
  const choices = accounts.filter(
    (a) => (!premisesId || !a.premisesId || a.premisesId === premisesId) && (!a.kindId || a.kindId === kindId || a.kindId === parentOfKind),
  );

  const save = () =>
    startTransition(async () => {
      setMessage(null);
      const result = await write((id) => recordUtilityBill({ kindId, premisesId, accountId, amount, date, coversMonth: month, note }, id));
      if (!result.ok) {
        setMessage({ ok: false, text: result.error });
        return;
      }
      setMessage({ ok: true, text: u.recorded });
      setAmount("");
      setNote("");
      router.refresh();
    });

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-lg font-semibold text-foreground">{u.record}</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {u.kind}
          <select
            value={kindId}
            onChange={(e) => {
              setKindId(e.target.value);
              setAccountId("");
            }}
            className={`${inputClass} w-48`}
          >
            <option value="">{u.chooseKind}</option>
            {kinds.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {t.bills.page.placeLabel}
          <select
            value={premisesId}
            onChange={(e) => {
              setPremisesId(e.target.value);
              setAccountId("");
            }}
            className={`${inputClass} w-48`}
          >
            <option value="">{t.bills.page.placeNone}</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {t.bills.page.accountLabel}
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={`${inputClass} w-56`}>
            <option value="">{t.bills.page.accountNone}</option>
            {choices.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {u.covers}
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputClass} w-44`} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {t.bills.page.date}
          <DateInput value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} w-44`} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {t.bills.page.cost}
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} w-36`}
          />
        </label>
        <label className="flex min-w-0 flex-1 basis-48 flex-col gap-1 text-sm font-medium text-muted">
          {t.bills.page.note}
          <input value={note} onChange={(e) => setNote(e.target.value)} className={`${inputClass} w-full`} />
        </label>
      </div>
      <div>
        <ActionButton variant="primary" icon={ACTION_ICONS.save} disabled={pending} onClick={save}>
          {u.save}
        </ActionButton>
      </div>
      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
