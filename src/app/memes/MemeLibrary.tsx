"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { driveImageUrl } from "@/lib/google/drive-client";
import { matchesSearch } from "@/lib/memes/form";
import { SOURCE_KINDS, type SourceKind } from "@/lib/memes/sources";
import { PLATFORMS, type Platform } from "@/lib/memes/platforms";
import { SharedOn } from "./PlatformIcon";

/** The grid's own view of a meme: what the server loaded, minus the shares themselves. */
export type LibraryMeme = {
  id: string;
  drive_file_id: string;
  title: string;
  caption_en: string | null;
  caption_th: string | null;
  tags: string[];
  residents: { id: string; name: string; thai_name: string | null }[];
  platforms: Platform[];
  source_kind: SourceKind | null;
};

const NOT_SHARED = "none";
const NO_SOURCE = "unrecorded";
const selectClass =
  "min-h-11 w-full rounded border border-border bg-background px-2 py-1 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 sm:text-sm";

/**
 * The library grid, phone first: two columns at 375 px, newest first, each tile showing the picture, the title and
 * where it has gone. Filters and search are in memory: the server hands every non-archived meme (a few hundred at
 * most) and the page narrows without a round trip, so a phone on shelter wifi gets an answer per keystroke.
 */
export function MemeLibrary({ memes, tags }: { memes: LibraryMeme[]; tags: string[] }) {
  const { t, locale } = useI18n();
  const m = t.memes;
  const [search, setSearch] = useState("");
  const [resident, setResident] = useState("");
  const [tag, setTag] = useState("");
  const [platform, setPlatform] = useState("");
  const [source, setSource] = useState("");

  const residents = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; thai_name: string | null }>();
    for (const meme of memes) for (const r of meme.residents) byId.set(r.id, r);
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [memes]);

  const shown = useMemo(
    () =>
      memes.filter(
        (meme) =>
          matchesSearch(meme, search) &&
          (!resident || meme.residents.some((r) => r.id === resident)) &&
          (!tag || meme.tags.includes(tag)) &&
          (!source || (source === NO_SOURCE ? meme.source_kind === null : meme.source_kind === source)) &&
          (!platform || (platform === NOT_SHARED ? meme.platforms.length === 0 : meme.platforms.includes(platform as Platform))),
      ),
    [memes, search, resident, tag, platform, source],
  );

  const filtering = search.trim() !== "" || resident !== "" || tag !== "" || platform !== "" || source !== "";
  const residentName = (r: { name: string; thai_name: string | null }) =>
    locale === "th" && r.thai_name ? r.thai_name : r.name;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded border border-border bg-surface p-3">
        <label className="relative block">
          <span className="sr-only">{m.search}</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={m.search}
            className={`${selectClass} pl-8`}
          />
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs text-muted">
            {m.filters.resident}
            <select value={resident} onChange={(e) => setResident(e.target.value)} className={selectClass}>
              <option value="">{m.filters.anyResident}</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {residentName(r)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            {m.filters.tag}
            <select value={tag} onChange={(e) => setTag(e.target.value)} className={selectClass}>
              <option value="">{m.filters.anyTag}</option>
              {tags.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            {m.filters.platform}
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={selectClass}>
              <option value="">{m.filters.anyPlatform}</option>
              <option value={NOT_SHARED}>{m.filters.notSharedYet}</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {m.platforms[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            {m.filters.source}
            <select value={source} onChange={(e) => setSource(e.target.value)} className={selectClass}>
              <option value="">{m.filters.anySource}</option>
              {SOURCE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {m.maker.sources[k]}
                </option>
              ))}
              <option value={NO_SOURCE}>{m.filters.unrecordedSource}</option>
            </select>
          </label>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm text-muted">
          <span>{m.count(shown.length)}</span>
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setResident("");
                setTag("");
                setPlatform("");
                setSource("");
              }}
              className="inline-flex min-h-11 items-center gap-1 rounded px-2 text-sm font-medium text-primary hover:bg-surface-hover md:min-h-9"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              {m.filters.clear}
            </button>
          )}
        </div>
      </div>

      {memes.length === 0 ? (
        <p className="rounded border border-dashed border-border p-6 text-center text-base text-muted">{m.empty}</p>
      ) : shown.length === 0 ? (
        <p className="rounded border border-dashed border-border p-6 text-center text-base text-muted">{m.noMatch}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((meme) => (
            <li key={meme.id}>
              <Link
                href={`/memes/${meme.id}`}
                className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <div className="aspect-square bg-surface-hover">
                  {/* A plain <img>: the photo route is dynamic and never goes through /_next/image (next.config.ts). */}
                  <img
                    src={driveImageUrl(meme.drive_file_id, 400)}
                    alt={m.imageAlt(meme.title)}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 p-2">
                  <span className="line-clamp-2 text-sm font-medium text-foreground">{meme.title}</span>
                  {meme.residents.length > 0 && (
                    <span className="line-clamp-1 text-xs text-muted">{meme.residents.map(residentName).join(", ")}</span>
                  )}
                  <span className="mt-auto pt-1">
                    <SharedOn platforms={meme.platforms} names={m.platforms} notSharedYet={m.notSharedYet} sharedOn={m.sharedOn} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
