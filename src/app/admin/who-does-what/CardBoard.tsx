"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { RowActionButton } from "@/components/RowAction";
import { runCardOp, type CardOp } from "./CardControls";

/**
 * The cards board: the role's cards in home-screen order, and every card it does not hold beside them. A laptop can drag
 * a card across to give it, back to take it away, or onto another to reorder (native HTML5 drag, as the maintenance board
 * does; no library). Drag is an addition: every tile keeps its Add / Remove / Move buttons, and below `md` the columns
 * stack (the role's cards first) with buttons only, because the Director works from a phone and a keyboard cannot drag.
 * A drop calls runCardOp(), the very function the buttons call, so it takes the same server action and leaves the same
 * audit row. docs/decisions/2026-10-14-cards-board-drag-and-buttons.md
 */
export type Tile = { key: string; label: string; description: string; includes: string; href: string; warn?: boolean };

export function CardBoard({
  roleKey,
  roleName,
  held,
  library,
  canEdit,
  locked = false,
  verifyHref,
}: {
  roleKey: string;
  roleName: string;
  held: Tile[];
  library: Tile[];
  canEdit: boolean;
  /** An admin who has not verified: the board is read-only, so say why where the buttons would be. */
  locked?: boolean;
  verifyHref: string;
}) {
  const { t } = useI18n();
  const c = t.admin.whoDoesWhat.cardsView;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState<"held" | "library" | string | null>(null);
  const heldKeys = held.map((h) => h.key);

  function run(ops: CardOp[]) {
    setError(null);
    startTransition(async () => {
      for (const op of ops) {
        const result = await runCardOp(op);
        if (!result.ok) {
          setError(result.error);
          break;
        }
      }
      router.refresh();
    });
  }

  const dragStart = (key: string, from: "held" | "library") => (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", `${from}:${key}`);
    e.dataTransfer.effectAllowed = "move";
  };
  const payload = (e: React.DragEvent) => {
    const [from, key] = e.dataTransfer.getData("text/plain").split(":");
    return (from === "held" || from === "library") && key ? { from, key } : null;
  };

  // Dropping on the role's column adds at the end (the Add button). Dropping on a tile of it puts the card there.
  function dropOnHeld(e: React.DragEvent, target?: string) {
    e.preventDefault();
    e.stopPropagation();
    setOver(null);
    const p = payload(e);
    if (!p) return;
    if (p.from === "library") return run([{ kind: "add", roleKey, card: p.key }]);
    if (!target || target === p.key) return;
    // Reordering is the Move buttons pressed as many times as it takes: each step is the same action and the same audit row.
    const from = heldKeys.indexOf(p.key);
    const to = heldKeys.indexOf(target);
    if (from < 0 || to < 0) return;
    run(Array.from({ length: Math.abs(to - from) }, () => ({ kind: to > from ? "down" : "up", roleKey, card: p.key }) as CardOp));
  }
  function dropOnLibrary(e: React.DragEvent) {
    e.preventDefault();
    setOver(null);
    const p = payload(e);
    if (p?.from === "held") run([{ kind: "remove", roleKey, card: p.key }]);
  }
  const allow = (zone: string) => (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOver(zone);
  };

  const tile = (tl: Tile, side: "held" | "library", i: number) => (
    <li
      key={tl.key}
      draggable={canEdit}
      onDragStart={canEdit ? dragStart(tl.key, side) : undefined}
      onDragOver={side === "held" ? allow(`tile:${tl.key}`) : undefined}
      onDragLeave={() => setOver(null)}
      onDrop={side === "held" ? (e) => dropOnHeld(e, tl.key) : undefined}
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
            <RowActionButton icon={Plus} label={c.addFor(tl.label)} disabled={pending} onClick={() => run([{ kind: "add", roleKey, card: tl.key }])} />
          ) : (
            <>
              {i > 0 && <RowActionButton icon={ArrowUp} label={c.moveUpFor(tl.label)} disabled={pending} onClick={() => run([{ kind: "up", roleKey, card: tl.key }])} />}
              {i < held.length - 1 && (
                <RowActionButton icon={ArrowDown} label={c.moveDownFor(tl.label)} disabled={pending} onClick={() => run([{ kind: "down", roleKey, card: tl.key }])} />
              )}
              <RowActionButton icon={X} tone="danger" label={c.removeFor(tl.label)} disabled={pending} onClick={() => run([{ kind: "remove", roleKey, card: tl.key }])} />
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

  return (
    <div className="flex flex-col gap-2">
      {canEdit && <p className="hidden text-sm text-muted md:block">{c.dragHint}</p>}
      {locked && <p className="hidden text-sm text-muted md:block">{c.lockedHint}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="cards-h" className={`flex min-w-0 flex-col gap-3 md:order-2 ${zone("held")}`} onDragOver={allow("held")} onDragLeave={() => setOver(null)} onDrop={(e) => dropOnHeld(e)}>
          <h2 id="cards-h" className="text-lg font-semibold text-foreground">
            {c.cardsHeading(roleName)}
          </h2>
          {lockedNote}
          {held.length === 0 ? (
            <p className="text-sm text-muted">{c.noCards}</p>
          ) : (
            <ol className="grid grid-cols-2 gap-3 xl:grid-cols-3">{held.map((h, i) => tile(h, "held", i))}</ol>
          )}
        </section>
        <section aria-labelledby="add-h" className={`flex min-w-0 flex-col gap-3 md:order-1 ${zone("library")}`} onDragOver={allow("library")} onDragLeave={() => setOver(null)} onDrop={dropOnLibrary}>
          <h2 id="add-h" className="text-lg font-semibold text-foreground">
            {c.addHeading}
          </h2>
          <p className="text-sm text-muted">{c.addIntro}</p>
          {lockedNote}
          {library.length === 0 ? (
            <p className="text-sm text-foreground">{c.allHeld}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-1 xl:grid-cols-2">{library.map((l) => tile(l, "library", 0))}</ul>
          )}
        </section>
      </div>
    </div>
  );
}
