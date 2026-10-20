"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export type SearchResident = {
  id: string;
  name: string;
  thai_name: string | null;
  code: string | null;
  where: string | null;
  photo: string | null;
};

const SHOWN = 30;

/** Search box for the maker's Residents tab. `recent` is the server's order: residents with the newest approved photos first. */
export function ResidentSearch({
  residents,
  placeholder,
  recentLabel,
  noMatch,
}: {
  residents: SearchResident[];
  placeholder: string;
  recentLabel: string;
  noMatch: string;
}) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const term = q.trim().toLowerCase();
  const list = useMemo(() => {
    if (!term) return residents.slice(0, SHOWN);
    return residents
      .filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.thai_name?.toLowerCase().includes(term) ||
          r.code?.toLowerCase().includes(term),
      )
      .slice(0, SHOWN);
  }, [residents, term]);

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={ref}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-11 w-full rounded border border-border bg-surface px-3 py-2 text-base text-foreground"
      />
      {!term && <p className="text-sm text-muted">{recentLabel}</p>}
      {list.length === 0 ? (
        <p className="text-base text-muted">{noMatch}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {list.map((r) => (
            <li key={r.id}>
              <Link
                href={`/memes/make?resident=${r.id}`}
                className="flex min-h-11 items-center gap-3 rounded border border-border px-3 py-2 text-base text-foreground hover:bg-surface-hover"
              >
                {r.photo ? (
                  <img src={r.photo} alt="" className="size-12 shrink-0 rounded object-cover" />
                ) : (
                  <span className="size-12 shrink-0 rounded bg-surface-hover" aria-hidden />
                )}
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">
                    {r.name}
                    {r.thai_name ? <span className="ml-2 text-muted">{r.thai_name}</span> : null}
                  </span>
                  {r.where ? <span className="truncate text-sm text-muted">{r.where}</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
