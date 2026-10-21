"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { RowActionButton } from "@/components/RowAction";
import type { ActionResult } from "@/lib/action-result";
import { GROUP_ICON_KEYS, groupIcon } from "@/lib/home/group-icons";
import { runCardOp, type CardOp } from "./CardControls";
import { addGroup, moveGroup, removeGroup, setCardGroup } from "./actions";

/**
 * The cards board: the role's cards in home-screen order, and every card it does not hold beside them. A laptop can drag
 * a card across to give it, back to take it away, or onto another to reorder (native HTML5 drag, as the maintenance board
 * does; no library). Drag is an addition: every tile keeps its Add / Remove / Move buttons, and below `md` the columns
 * stack (the role's cards first) with buttons only, because the Director works from a phone and a keyboard cannot drag.
 * A drop calls runCardOp(), the very function the buttons call, so it takes the same server action and leaves the same
 * audit row. docs/decisions/2026-10-14-cards-board-drag-and-buttons.md
 *
 * Groups (0241, docs/decisions/2026-10-21-tile-groups-app.md): the role's column is split into "on the home screen" and
 * one box per group. A card is dragged into a box, or placed with the "Where it shows" list beside it (the phone's way);
 * Up and Down move it among the cards in the same box. A group changes where a card shows and nothing else.
 */
export type Tile = { key: string; label: string; description: string; includes: string; href: string; warn?: boolean;
  /** Why this card cannot be given yet (it needs another role's card first); shown beside a disabled +. */
  blocked?: string;
  /** The group this held card sits in; null or absent = on the home directly. */
  group?: string | null };

export type BoardGroup = { id: string; label: string; icon: string };

type Step = () => Promise<ActionResult>;

export function CardBoard({
  roleKey,
  roleName,
  held,
  library,
  groups = [],
  canEdit,
  locked = false,
  verifyHref,
}: {
  roleKey: string;
  roleName: string;
  held: Tile[];
  library: Tile[];
  groups?: BoardGroup[];
  canEdit: boolean;
  /** An admin who has not verified: the board is read-only, so say why where the buttons would be. */
  locked?: boolean;
  verifyHref: string;
}) {
  const { t } = useI18n();
  const c = t.admin.whoDoesWhat.cardsView;
  const gc = t.admin.whoDoesWhat.groups;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  // One box filters both columns by name and description. Reordering stays on the full lists.
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const match = (x: Tile) => !q || `${x.label} ${x.description}`.toLowerCase().includes(q);
  const shownLibrary = library.filter(match);

  // The places a held card can be: the home itself (id null), then each group in its order.
  const places: { id: string | null; label: string; icon?: string }[] = [{ id: null, label: gc.onHome }, ...groups];
  const inPlace = (id: string | null) => held.filter((h) => (h.group ?? null) === id);

  function run(steps: Step[]) {
    setError(null);
    startTransition(async () => {
      for (const step of steps) {
        const result = await step();
        if (!result.ok) {
          setError(result.error);
          break;
        }
      }
      router.refresh();
    });
  }
  const cardOps = (ops: CardOp[]) => run(ops.map((op) => () => runCardOp(op)));

  const dragStart = (key: string, from: "held" | "library") => (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", `${from}:${key}`);
    e.dataTransfer.effectAllowed = "move";
  };
  const payload = (e: React.DragEvent) => {
    const [from, key] = e.dataTransfer.getData("text/plain").split(":");
    return (from === "held" || from === "library") && key ? { from, key } : null;
  };

  // Dropping on the role's column adds at the end (the Add button), on the home. Dropping a held card on a box puts it in
  // that place; dropping it on a tile of its own box puts it there in the order.
  function dropOnHeld(e: React.DragEvent, place: string | null, target?: string) {
    e.preventDefault();
    e.stopPropagation();
    setOver(null);
    const p = payload(e);
    if (!p) return;
    if (p.from === "library") {
      const why = library.find((x) => x.key === p.key)?.blocked;
      if (why) return setError(why);
      return cardOps([{ kind: "add", roleKey, card: p.key }]);
    }
    const card = held.find((h) => h.key === p.key);
    if (!card) return;
    if ((card.group ?? null) !== place) return run([() => setCardGroup(roleKey, p.key, place)]);
    if (!target || target === p.key) return;
    // Reordering is the Move buttons pressed as many times as it takes: each step is the same action and the same audit row.
    const keys = inPlace(place).map((h) => h.key);
    const from = keys.indexOf(p.key);
    const to = keys.indexOf(target);
    if (from < 0 || to < 0) return;
    cardOps(Array.from({ length: Math.abs(to - from) }, () => ({ kind: to > from ? "down" : "up", roleKey, card: p.key }) as CardOp));
  }
  function dropOnLibrary(e: React.DragEvent) {
    e.preventDefault();
    setOver(null);
    const p = payload(e);
    if (p?.from === "held") cardOps([{ kind: "remove", roleKey, card: p.key }]);
  }
  const allow = (zone: string) => (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setOver(zone);
  };

  const tile = (tl: Tile, side: "held" | "library", i: number, count: number) => (
    <li
      key={tl.key}
      draggable={canEdit}
      onDragStart={canEdit ? dragStart(tl.key, side) : undefined}
      onDragOver={side === "held" ? allow(`tile:${tl.key}`) : undefined}
      onDragLeave={() => setOver(null)}
      onDrop={side === "held" ? (e) => dropOnHeld(e, tl.group ?? null, tl.key) : undefined}
      className={`flex min-w-0 flex-col justify-between gap-2 rounded-lg border bg-surface p-3 ${
        side === "library" ? "border-dashed" : ""
      } ${over === `tile:${tl.key}` ? "border-primary" : "border-border"} ${canEdit ? "md:cursor-grab md:active:cursor-grabbing" : ""}`}
    >
      <Link href={tl.href} className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{tl.label}</span>
        <span className="line-clamp-2 text-xs text-muted [overflow-wrap:anywhere]">{tl.description}</span>
        {tl.includes && <span className="text-xs text-muted [overflow-wrap:anywhere]">{c.includesNote(tl.includes)}</span>}
        {tl.warn && <span className="text-xs font-medium text-danger [overflow-wrap:anywhere]">{c.noTile}</span>}
      </Link>
      {locked && (
        <div className="flex flex-wrap gap-1">
          {side === "library" ? (
            <RowActionButton icon={Plus} label={c.addFor(tl.label)} hint={c.lockedAddFor(tl.label)} disabled onClick={() => {}} />
          ) : (
            <RowActionButton icon={X} tone="danger" label={c.removeFor(tl.label)} hint={c.lockedRemoveFor(tl.label)} disabled onClick={() => {}} />
          )}
        </div>
      )}
      {canEdit && (
        <div className="flex flex-wrap gap-1">
          {side === "library" ? (
            <>
              <RowActionButton
                icon={Plus}
                label={tl.blocked ? c.needsApproverFor(tl.label) : c.addFor(tl.label)}
                hint={tl.blocked}
                disabled={pending || !!tl.blocked}
                onClick={() => cardOps([{ kind: "add", roleKey, card: tl.key }])}
              />
              {tl.blocked && <span className="min-w-0 self-center text-xs text-muted [overflow-wrap:anywhere]">{tl.blocked}</span>}
            </>
          ) : (
            <>
              {i > 0 && <RowActionButton icon={ArrowUp} label={c.moveUpFor(tl.label)} disabled={pending} onClick={() => cardOps([{ kind: "up", roleKey, card: tl.key }])} />}
              {i < count - 1 && (
                <RowActionButton icon={ArrowDown} label={c.moveDownFor(tl.label)} disabled={pending} onClick={() => cardOps([{ kind: "down", roleKey, card: tl.key }])} />
              )}
              <RowActionButton icon={X} tone="danger" label={c.removeFor(tl.label)} disabled={pending} onClick={() => cardOps([{ kind: "remove", roleKey, card: tl.key }])} />
              {groups.length > 0 && (
                <select
                  aria-label={gc.placeFor(tl.label)}
                  title={gc.placeFor(tl.label)}
                  value={tl.group ?? ""}
                  disabled={pending}
                  onChange={(e) => run([() => setCardGroup(roleKey, tl.key, e.target.value || null)])}
                  className="min-h-11 min-w-0 max-w-full rounded-md border border-border bg-background px-2 text-sm text-foreground"
                >
                  {places.map((pl) => (
                    <option key={pl.id ?? ""} value={pl.id ?? ""}>
                      {pl.label}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );

  const lockedNote = locked && (
    <p role="note" className="rounded-md border border-border bg-surface p-2 text-sm text-foreground">
      {c.lockedNote}{" "}
      <Link href={verifyHref} className="font-medium text-primary underline">
        {c.verifyLink}
      </Link>
    </p>
  );
  const zone = (z: string) => `rounded-lg ${over === z ? "outline outline-2 outline-primary" : ""}`;

  const placeList = (id: string | null) => {
    const all = inPlace(id);
    const shown = all.filter(match);
    if (all.length === 0) return id === null ? (held.length === 0 ? <p className="text-sm text-muted">{c.noCards}</p> : null) : <p className="text-sm text-muted">{gc.empty}</p>;
    if (shown.length === 0) return <p className="text-sm text-muted">{c.noMatch}</p>;
    return <ol className="grid grid-cols-2 gap-3 xl:grid-cols-3">{shown.map((h) => tile(h, "held", all.indexOf(h), all.length))}</ol>;
  };

  return (
    <div className="flex flex-col gap-2">
      {canEdit && <p className="hidden text-sm text-muted md:block">{c.dragHint}</p>}
      {locked && <p className="hidden text-sm text-muted md:block">{c.lockedHint}</p>}
      <p className="text-sm text-muted">{c.addIntro}</p>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={c.searchPlaceholder}
        aria-label={c.searchLabel}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground md:max-w-md"
      />
      {error && (
        <p role="alert" className="text-sm text-danger [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="cards-h" className={`flex min-w-0 flex-col gap-3 md:order-2 ${zone("held")}`} onDragOver={allow("held")} onDragLeave={() => setOver(null)} onDrop={(e) => dropOnHeld(e, null)}>
          <h2 id="cards-h" className="text-lg font-semibold text-foreground">
            {c.cardsHeading(roleName)}
          </h2>
          {lockedNote}
          <p className="text-sm text-muted [overflow-wrap:anywhere]">{gc.intro}</p>
          {groups.length > 0 && <h3 className="text-base font-semibold text-foreground">{gc.onHome}</h3>}
          {placeList(null)}
          {groups.map((g, gi) => {
            const Icon = groupIcon(g.icon);
            return (
              <section
                key={g.id}
                aria-label={g.label}
                className={`flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-background p-3 ${over === `group:${g.id}` ? "outline outline-2 outline-primary" : ""}`}
                onDragOver={allow(`group:${g.id}`)}
                onDragLeave={() => setOver(null)}
                onDrop={(e) => dropOnHeld(e, g.id)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                  <h3 className="min-w-0 flex-1 text-base font-semibold text-foreground [overflow-wrap:anywhere]">{g.label}</h3>
                  {canEdit && (
                    <div className="flex flex-wrap gap-1">
                      {gi > 0 && <RowActionButton icon={ArrowUp} label={gc.moveUpFor(g.label)} disabled={pending} onClick={() => run([() => moveGroup(roleKey, g.id, "up")])} />}
                      {gi < groups.length - 1 && (
                        <RowActionButton icon={ArrowDown} label={gc.moveDownFor(g.label)} disabled={pending} onClick={() => run([() => moveGroup(roleKey, g.id, "down")])} />
                      )}
                      <RowActionButton icon={X} tone="danger" label={gc.removeFor(g.label)} disabled={pending} onClick={() => run([() => removeGroup(roleKey, g.id)])} />
                    </div>
                  )}
                </div>
                {placeList(g.id)}
              </section>
            );
          })}
          {canEdit && <AddGroupForm roleKey={roleKey} pending={pending} run={run} />}
        </section>
        <section aria-labelledby="add-h" className={`flex min-w-0 flex-col gap-3 md:order-1 ${zone("library")}`} onDragOver={allow("library")} onDragLeave={() => setOver(null)} onDrop={dropOnLibrary}>
          <h2 id="add-h" className="text-lg font-semibold text-foreground">
            {c.addHeading}
          </h2>
          {lockedNote}
          {library.length === 0 ? (
            <p className="text-sm text-foreground">{c.allHeld}</p>
          ) : shownLibrary.length === 0 ? (
            <p className="text-sm text-muted">{c.noMatch}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-1 xl:grid-cols-2">{shownLibrary.map((l) => tile(l, "library", 0, 0))}</ul>
          )}
        </section>
      </div>
    </div>
  );
}

function AddGroupForm({ roleKey, pending, run }: { roleKey: string; pending: boolean; run: (steps: Step[]) => void }) {
  const { t } = useI18n();
  const gc = t.admin.whoDoesWhat.groups;
  const [name, setName] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [icon, setIcon] = useState<string>(GROUP_ICON_KEYS[0]);
  const field = "min-h-11 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground";
  return (
    <details className="text-sm">
      <summary className="min-h-11 cursor-pointer py-2.5 font-semibold text-foreground">{gc.addHeading}</summary>
      <form
        className="flex max-w-xl flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run([
            async () => {
              const r = await addGroup(roleKey, name, nameTh, icon);
              if (r.ok) {
                setName("");
                setNameTh("");
              }
              return r;
            },
          ]);
        }}
      >
        <label className="flex flex-col gap-1 text-foreground">
          {gc.name}
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-foreground">
          {gc.nameTh}
          <input value={nameTh} onChange={(e) => setNameTh(e.target.value)} lang="th" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-foreground">
          {gc.icon}
          <select value={icon} onChange={(e) => setIcon(e.target.value)} className={field}>
            {GROUP_ICON_KEYS.map((k) => (
              <option key={k} value={k}>
                {gc.iconNames[k]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pending} className="min-h-11 self-start rounded-md border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {gc.add}
        </button>
      </form>
    </details>
  );
}
