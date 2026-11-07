"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Film, Play, Search, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import { formatDuration, matchesReelSearch } from "@/lib/reels/form";
import { PLATFORMS, type Platform } from "@/lib/memes/platforms";
import { SharedOn } from "../memes/PlatformIcon";

/** The grid's own view of a reel: what the server loaded, minus the posts themselves. */
export type LibraryReel = {
  id: string;
  description: string;
  tags: string[];
  duration_ms: number | null;
  date_taken: string;
  residents: { id: string; name: string; thai_name: string | null }[];
  unnamedCount: number;
  platforms: Platform[];
};

const NOT_POSTED = "none";
const selectClass =
  "min-h-11 w-full rounded border border-border bg-background px-2 py-1 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 sm:text-sm";

/**
 * The library grid, phone first, shaped like the meme library (src/app/memes/MemeLibrary.tsx): the server hands every
 * non-archived reel and the page narrows in memory. A tile shows a play badge, the length, the date taken, the start
 * of the description and where it was posted. No thumbnail: nothing reads a still out of a video, and a tile must not
 * pull a video from Drive just to be drawn.
 */
export function ReelLibrary({ reels, tags }: { reels: LibraryReel[]; tags: string[] }) {
  const { t, locale } = useI18n();
  const r = t.reels;
  const [search, setSearch] = useState("");
  const [resident, setResident] = useState("");
  const [tag, setTag] = useState("");
  const [platform, setPlatform] = useState("");

  const residents = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; thai_name: string | null }>();
    for (const reel of reels) for (const x of reel.residents) byId.set(x.id, x);
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [reels]);

  const shown = useMemo(
    () =>
      reels.filter(
        (reel) =>
          matchesReelSearch(reel, search) &&
          (!resident || reel.residents.some((x) => x.id === resident)) &&
          (!tag || reel.tags.includes(tag)) &&
          (!platform || (platform === NOT_POSTED ? reel.platforms.length === 0 : reel.platforms.includes(platform as Platform))),
      ),
    [reels, search, resident, tag, platform],
  );

  const filtering = search.trim() !== "" || resident !== "" || tag !== "" || platform !== "";
  const residentName = (x: { name: string; thai_name: string | null }) => (locale === "th" && x.thai_name ? x.thai_name : x.name);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded border border-border bg-surface p-3">
        <label className="relative block">
          <span className="sr-only">{r.search}</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={r.search} className={`${selectClass} pl-8`} />
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            {r.filters.resident}
            <select value={resident} onChange={(e) => setResident(e.target.value)} className={selectClass}>
              <option value="">{r.filters.anyResident}</option>
              {residents.map((x) => (
                <option key={x.id} value={x.id}>
                  {residentName(x)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            {r.filters.tag}
            <select value={tag} onChange={(e) => setTag(e.target.value)} className={selectClass}>
              <option value="">{r.filters.anyTag}</option>
              {tags.map((x) => (
                <option key={x} value={x}>
                  #{x}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            {r.filters.platform}
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={selectClass}>
              <option value="">{r.filters.anyPlatform}</option>
              <option value={NOT_POSTED}>{r.filters.notPostedYet}</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {t.memes.platforms[p]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm text-muted">
          <span>{r.count(shown.length)}</span>
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setResident("");
                setTag("");
                setPlatform("");
              }}
              className="inline-flex min-h-11 items-center gap-1 rounded px-2 text-sm font-medium text-primary hover:bg-surface-hover md:min-h-9"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              {r.filters.clear}
            </button>
          )}
        </div>
      </div>

      {reels.length === 0 ? (
        <p className="rounded border border-dashed border-border p-6 text-center text-base text-muted">{r.empty}</p>
      ) : shown.length === 0 ? (
        <p className="rounded border border-dashed border-border p-6 text-center text-base text-muted">{r.noMatch}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((reel) => {
            const length = formatDuration(reel.duration_ms);
            return (
              <li key={reel.id}>
                <Link
                  href={`/reels/${reel.id}`}
                  className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <div className="relative flex aspect-square items-center justify-center bg-surface-hover text-muted">
                    <Film aria-hidden="true" className="h-10 w-10" />
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground">
                      <Play aria-hidden="true" className="h-3 w-3" />
                      <span className="sr-only">{r.play}</span>
                      {length}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2">
                    <span className="text-xs text-muted">{formatDate(reel.date_taken, locale)}</span>
                    <span className="line-clamp-2 text-sm font-medium text-foreground">{reel.description || r.noDescription}</span>
                    {reel.residents.length > 0 && (
                      <span className="line-clamp-1 text-xs text-muted">{reel.residents.map(residentName).join(", ")}</span>
                    )}
                    {reel.unnamedCount > 0 && <span className="line-clamp-1 text-xs text-muted">{r.taggedUnseen(reel.unnamedCount)}</span>}
                    <span className="mt-auto pt-1">
                      <SharedOn platforms={reel.platforms} names={t.memes.platforms} notSharedYet={r.notPostedYet} sharedOn={r.postedOn} />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
