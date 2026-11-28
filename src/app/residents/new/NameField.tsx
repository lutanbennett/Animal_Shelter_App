"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { nearMatchReason, nextNumberedName, sameName } from "@/lib/residents/near-names";
import { ADOPTED, DECEASED } from "@/lib/residents/status";

/** Every resident, departed and dead included: "is this the same animal coming back?" (#dupnm). */
export type ExistingResident = {
  code: string | null;
  name: string;
  thaiName: string | null;
  otherNames: string | null;
  status: string | null;
};

const MAX_SHOWN = 5;

/**
 * The intake wizard's name box, with a warning under it when the name is
 * already taken or looks like an existing resident's. A warning only: the
 * volunteer may take the offered number, change the name, or carry on.
 * The matching is src/lib/residents/near-names.ts, the same rules the bulk
 * loader uses.
 */
export function NameField({
  existing,
  inputClass,
}: {
  existing: ExistingResident[];
  inputClass: string;
}) {
  const { t } = useI18n();
  const c = t.residents.new.nameCheck;
  const [name, setName] = useState("");
  const [thaiName, setThaiName] = useState("");
  const [otherNames, setOtherNames] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // The Thai name and other names boxes sit beside this one; follow them so
  // the Thai-name and other-name rules can fire.
  useEffect(() => {
    const form = inputRef.current?.form;
    const follow = (id: string, set: (v: string) => void) => {
      const box = form?.elements.namedItem(id);
      if (!(box instanceof HTMLInputElement)) return () => {};
      const read = () => set(box.value);
      box.addEventListener("input", read);
      return () => box.removeEventListener("input", read);
    };
    const stopThai = follow("thaiName", setThaiName);
    const stopOther = follow("otherNames", setOtherNames);
    return () => {
      stopThai();
      stopOther();
    };
  }, []);

  const check = useMemo(() => {
    const typed = name.trim();
    if (!typed) return null;
    const exact = existing.filter((r) => sameName(r.name, typed));
    const near = exact.length
      ? []
      : existing
          .map((r) => ({ r, reason: nearMatchReason(
              { name: typed, thaiName, otherNames },
              { name: r.name, thaiName: r.thaiName, otherNames: r.otherNames },
            ) }))
          .filter((m): m is { r: ExistingResident; reason: string } => m.reason !== null);
    if (!exact.length && !near.length) return null;
    return {
      exact,
      near,
      suggestion: exact.length ? nextNumberedName(typed, existing.map((r) => r.name)) : null,
    };
  }, [name, thaiName, otherNames, existing]);

  const reasonText = (reason: string) => {
    if (reason.startsWith("the same name once")) return c.reasons.bracket;
    if (reason.startsWith("one name is")) return c.reasons.tag;
    if (reason.startsWith("the same Thai")) return c.reasons.thai;
    if (reason.startsWith("close spelling")) return c.reasons.spelling;
    if (reason.startsWith("the same as another name")) return c.reasons.otherName;
    if (reason.startsWith("the same name with a number")) return c.reasons.numbered;
    return reason;
  };
  const who = (r: ExistingResident) =>
    `${r.code ? `${r.code} ` : ""}${r.name}${r.status === DECEASED || r.status === ADOPTED ? ` (${c.gone})` : ""}`;

  const listed = check
    ? check.exact.length
      ? check.exact.map((r) => who(r))
      : check.near.map(({ r, reason }) => `${who(r)}: ${reasonText(reason)}`)
    : [];

  return (
    <>
      <input
        ref={inputRef}
        id="name"
        name="name"
        required
        className={inputClass}
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-describedby={check ? "name-check" : undefined}
      />
      {check && (
        <div
          id="name-check"
          role="status"
          className="flex flex-col gap-1 rounded border border-warning/40 bg-warning/10 p-2 text-sm text-foreground"
        >
          <p className="font-medium">{check.exact.length ? c.taken : c.similar}</p>
          <ul className="list-disc pl-5">
            {listed.slice(0, MAX_SHOWN).map((line) => (
              <li key={line}>{line}</li>
            ))}
            {listed.length > MAX_SHOWN && <li>…</li>}
          </ul>
          <p className="text-muted">{c.sameAnimal}</p>
          {check.suggestion && (
            <p className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded border border-primary px-2 py-1 text-primary hover:bg-primary/10"
                onClick={() => {
                  setName(check.suggestion!);
                  inputRef.current?.focus();
                }}
              >
                {c.useNumbered.replace("{name}", check.suggestion)}
              </button>
              <span className="text-muted">{c.orEdit}</span>
            </p>
          )}
        </div>
      )}
    </>
  );
}
