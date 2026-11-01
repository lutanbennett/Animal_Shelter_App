"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { TranslationPanel } from "@/components/TranslationPanel";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import {
  labelKey,
  proseGroup,
  sortGroups,
  type LabelItem,
  type LabelStatus,
  type Show,
  SHOWS,
} from "@/lib/translations/labels";
import { isPageBodyField } from "@/lib/site/body";
import { fieldKey, type TranslationQueueRow, type TranslationRow, type TranslationStatus } from "@/lib/translations/types";
import { formatDate } from "@/lib/format";
import {
  approveLabelTranslation,
  discardLabelDraft,
  proposeLabelTranslation,
  saveLabelTranslation,
} from "./actions";


/** Missing = nobody has written it yet (a draft is not written by a person). */
const PROSE_MISSING: TranslationStatus[] = ["pending", "draft"];

function proseShown(status: TranslationStatus, show: Show) {
  if (show === "all") return true;
  if (show === "stale") return status === "stale";
  // Prose has its own draft state — "draft" means a machine wrote it and nobody
  // has read it — and no label_drafts row, so Waiting never lists prose.
  if (show === "proposed") return false;
  return PROSE_MISSING.includes(status);
}

/** A proposal is waiting on this label, whatever its live Thai says (0293). */
function hasDraft(item: Pick<LabelItem, "draft_text_th">) {
  return !!item.draft_text_th;
}

/**
 * "Shown as typed" is a deliberate answer: it is only listed under All, and
 * never counted as missing. Waiting lists every label carrying a proposal,
 * including one that already has Thai and a proposed change to it — `status`
 * describes the live value a reader sees, not the proposal beside it.
 */
function labelShown(item: LabelItem, show: Show) {
  if (show === "all") return true;
  if (show === "proposed") return hasDraft(item);
  return item.status === show;
}

type Counts = { missing: number; stale: number; asTyped: number; proposed: number };

/**
 * Management → Translations: the prose queue and every label, one section
 * per kind (Website, Residents, Diets, …), each with its editor open so
 * the page can be worked straight down. The sections come from the rows —
 * a label's `label_group`, a prose row's table — so a label registered
 * later gets a section with no change here.
 *
 * Every row is held here and the filter applies on top, so the counts at
 * the top are always the whole picture and a row saved under "Missing"
 * drops out of the list as soon as it is done.
 */
export function TranslationQueue({
  prose: initialProse,
  labels: initialLabels,
  show,
  canManage,
  viewerId,
}: {
  prose: TranslationQueueRow[];
  labels: LabelItem[];
  show: Show;
  /**
   * The activity every action on this page asks: translations.manage. The
   * prose panel, the label's Save, and Propose / Save & approve / Reject all
   * ask it, so one flag gates them all and a control can never offer what the
   * database would refuse (Lutan, 2026-10-27).
   */
  canManage: boolean;
  /** This login, so a proposal can say whether it was theirs. */
  viewerId: string | null;
}) {
  const { t } = useI18n();
  const tr = t.translations;
  const [prose, setProse] = useState(initialProse);
  const [labels, setLabels] = useState(initialLabels);

  const groups = useMemo(() => {
    const byGroup = new Map<string, { prose: TranslationQueueRow[]; labels: LabelItem[]; counts: Counts }>();
    const entry = (key: string) => {
      let g = byGroup.get(key);
      if (!g) {
        g = { prose: [], labels: [], counts: { missing: 0, stale: 0, asTyped: 0, proposed: 0 } };
        byGroup.set(key, g);
      }
      return g;
    };
    for (const row of prose) {
      const g = entry(proseGroup(row.table_name));
      if (PROSE_MISSING.includes(row.status)) g.counts.missing++;
      if (row.status === "stale") g.counts.stale++;
      if (proseShown(row.status, show)) g.prose.push(row);
    }
    for (const item of labels) {
      const g = entry(item.label_group);
      if (item.status === "missing") g.counts.missing++;
      if (item.status === "stale") g.counts.stale++;
      if (item.status === "as_typed") g.counts.asTyped++;
      if (hasDraft(item)) g.counts.proposed++;
      if (labelShown(item, show)) g.labels.push(item);
    }
    return sortGroups(byGroup.keys()).map((key) => ({ key, ...byGroup.get(key)! }));
  }, [prose, labels, show]);

  function onProseChange(saved: TranslationRow) {
    setProse((current) => current.map((r) => (r.id === saved.id ? { ...r, ...saved } : r)));
  }

  function onLabelSaved(saved: LabelItem) {
    setLabels((current) => current.map((l) => (labelKey(l) === labelKey(saved) ? saved : l)));
  }

  const visible = groups.filter((g) => g.prose.length + g.labels.length > 0);
  const groupName = (key: string) => tr.groups[key] ?? key;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label={tr.filterLabel} className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">{tr.filterLabel}:</span>
        {SHOWS.map((s) => (
          <Link
            key={s}
            href={s === "missing" ? "/management/translations" : `/management/translations?show=${s}`}
            aria-current={s === show ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${
              s === show
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-foreground hover:bg-surface-hover"
            }`}
          >
            {tr.filters[s]}
          </Link>
        ))}
      </nav>

      <section className="max-w-3xl rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-semibold text-foreground">{tr.summaryTitle}</h2>
        <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.key} className="flex flex-wrap items-baseline justify-between gap-x-2">
              {g.prose.length + g.labels.length > 0 ? (
                <a href={`#group-${g.key}`} className="font-medium text-primary hover:underline">
                  {groupName(g.key)}
                </a>
              ) : (
                <span className="font-medium text-foreground">{groupName(g.key)}</span>
              )}
              <span className={g.counts.missing + g.counts.stale > 0 ? "text-foreground" : "text-muted"}>
                {tr.groupCounts(g.counts.missing, g.counts.stale)}
                {g.counts.proposed > 0 && (
                  <span className="text-primary"> · {tr.proposedCount(g.counts.proposed)}</span>
                )}
                {g.counts.asTyped > 0 && <span className="text-muted"> · {tr.asTypedCount(g.counts.asTyped)}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-muted">
          {tr.nothingHere[show]}
        </p>
      ) : (
        visible.map((g) => (
          <section key={g.key} id={`group-${g.key}`} className="flex scroll-mt-20 flex-col gap-3">
            <h2 className="text-lg font-semibold text-foreground">{groupName(g.key)}</h2>
            <ul className="flex flex-col gap-3">
              {g.labels.map((item) => (
                <li key={labelKey(item)}>
                  <LabelCard item={item} onSaved={onLabelSaved} canManage={canManage} viewerId={viewerId} />
                </li>
              ))}
              {g.prose.map((row) => (
                <li key={row.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold text-foreground">{row.record_label ?? row.row_id}</span>
                    <span className="text-xs text-muted">
                      {tr.fields[fieldKey(row.table_name, row.column_name)] ?? row.column_name}
                    </span>
                    {row.record_path && (
                      <Link
                        href={row.record_path}
                        className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {tr.openRecord}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </Link>
                    )}
                  </div>
                  <TranslationPanel
                    key={`${row.id}:${row.updated_at}`}
                    row={row}
                    canManage={canManage}
                    showOriginal
                    recordPath={row.record_path}
                    defaultOpen={row.status !== "approved"}
                    onChange={onProseChange}
                    pageBody={isPageBodyField(row)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

const LABEL_CHIP: Record<LabelStatus, string> = {
  missing: "border-border text-muted",
  as_typed: "border-border bg-background text-muted",
  proposed: "border-primary/50 bg-primary/10 text-primary",
  stale: "border-warning/60 bg-warning/15 text-foreground",
  current: "border-success/40 bg-success/10 text-success",
};

/**
 * One label: its English, any proposal waiting on it, its Thai in a box ready
 * to type, and where it is used.
 *
 * Three ways out, and all three ask translations.manage, which is what their
 * own functions ask (0293/0294) — so `canManage` gates every control and none
 * is ever offered to a login the database would refuse (Lutan, 2026-10-27):
 *
 *  - Save publishes straight onto the row (set_label_th(), 0166). An approver
 *    typing Thai should not have to approve their own words.
 *  - Propose leaves it waiting in `label_drafts` without touching the row, so
 *    no reader of the app and no page of the public website can see it until
 *    somebody approves it. That is the whole design, and this page must not
 *    weaken it: docs/decisions/2026-10-31-label-drafts-and-unlisted-labels.md.
 *  - Save & approve publishes what is waiting, and Reject throws it away.
 *    Approving takes no text: the Thai comes from the draft, so what goes live
 *    is what was read.
 */
function LabelCard({
  item,
  onSaved,
  canManage,
  viewerId,
}: {
  item: LabelItem;
  onSaved: (item: LabelItem) => void;
  canManage: boolean;
  viewerId: string | null;
}) {
  const { t, locale } = useI18n();
  const tr = t.translations;
  const [text, setText] = useState(item.text_th ?? "");
  const [error, setError] = useState<string | null>(null);
  const [savedOnce, setSavedOnce] = useState(false);
  const [proposedOnce, setProposedOnce] = useState(false);
  const [isPending, startTransition] = useTransition();
  // One per action: a request id kept from an unknown save must never reach another action.
  const saveLabelCall = useWriteCall();
  const proposeLabelCall = useWriteCall();
  const approveLabelCall = useWriteCall();
  const discardLabelCall = useWriteCall();
  const dirty = text.trim() !== (item.text_th ?? "");
  const draft = item.draft_text_th;
  /** The proposal was written against English that has since changed. */
  const draftStale = !!draft && item.draft_source_text !== item.source_text;
  const withoutDraft = {
    draft_text_th: null,
    draft_source_text: null,
    draft_proposed_at: null,
    draft_proposed_by: null,
  };
  /** What a label with no live Thai reads as once nothing is waiting on it. */
  const statusWithoutThai: LabelStatus = item.optional ? "as_typed" : "missing";

  function run(work: () => Promise<{ ok: true } | { ok: false; error: string }>, after: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      after();
    });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      // Saving an out-of-date label unchanged says "the Thai is still right".
      const reconfirm = item.status === "stale" && !dirty;
      const result = await saveLabelCall((requestId) => saveLabelTranslation(item.table_name, item.row_id, item.column_name, text, requestId, reconfirm));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const textTh = result.textTh;
      setText(textTh ?? "");
      setSavedOnce(true);
      setProposedOnce(false);
      // record_label_sources() clears a draft whose text is what the row now
      // says, by whatever path it got there (0293), so the page says the same.
      const spent = !!draft && draft === textTh;
      onSaved({
        ...item,
        text_th: textTh,
        seen_source_text: textTh ? item.source_text : null,
        status: textTh ? "current" : draft && !spent ? "proposed" : statusWithoutThai,
        ...(spent ? withoutDraft : {}),
      });
    });
  }

  function propose() {
    const trimmed = text.trim();
    run(
      () => proposeLabelCall((requestId) => proposeLabelTranslation(item.table_name, item.row_id, item.column_name, trimmed, requestId)),
      () => {
        // The proposal now reads in the panel above, so the box goes back to
        // the live Thai rather than showing the same words twice.
        setText(item.text_th ?? "");
        setProposedOnce(true);
        setSavedOnce(false);
        onSaved({
          ...item,
          status: item.text_th ? item.status : "proposed",
          draft_text_th: trimmed,
          draft_source_text: item.source_text,
          draft_proposed_at: new Date().toISOString(),
          draft_proposed_by: viewerId,
        });
      },
    );
  }

  function approve() {
    run(
      () => approveLabelCall((requestId) => approveLabelTranslation(item.table_name, item.row_id, item.column_name, requestId)),
      () => {
        setText(draft ?? "");
        setSavedOnce(true);
        setProposedOnce(false);
        onSaved({
          ...item,
          text_th: draft,
          seen_source_text: item.source_text,
          status: "current",
          ...withoutDraft,
        });
      },
    );
  }

  function reject() {
    if (!window.confirm(tr.rejectConfirm)) return;
    run(
      () => discardLabelCall((requestId) => discardLabelDraft(item.table_name, item.row_id, item.column_name, requestId)),
      () => {
        setProposedOnce(false);
        onSaved({
          ...item,
          status: item.text_th ? item.status : statusWithoutThai,
          ...withoutDraft,
        });
      },
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm font-semibold text-foreground" lang="en">
          {item.source_text}
        </span>
        <span className="text-xs text-muted">
          {tr.labelFields[fieldKey(item.table_name, item.column_name)] ?? item.column_name}
          {item.context && ` · ${item.context}`}
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${LABEL_CHIP[item.status]}`}
        >
          {tr.labelStatus[item.status]}
        </span>
        {item.path ? (
          <Link
            href={item.path}
            className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {tr.openScreen}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </Link>
        ) : (
          <span className="ml-auto text-xs text-muted">{tr.noScreen}</span>
        )}
      </div>

      {draft && (
        <div className="mb-3 rounded border border-primary/40 bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">{tr.waitingTitle}</p>
          <p className="mt-1 text-base text-foreground" lang="th">
            {draft}
          </p>
          <p className="mt-1 text-xs text-muted">
            {(item.draft_proposed_by && viewerId && item.draft_proposed_by === viewerId
              ? tr.proposedByYou
              : tr.proposedBySomeone)(formatDate(item.draft_proposed_at, locale))}
          </p>
          {draftStale && (
            <p className="mt-2 rounded border border-warning/40 bg-warning/10 p-2 text-xs text-foreground">
              <span className="font-medium">{tr.proposalOutOfDate}</span>
              {item.draft_source_text && (
                <>
                  <br />
                  <span className="text-muted">{tr.englishWhenProposed}: </span>
                  <span lang="en">{item.draft_source_text}</span>
                </>
              )}
            </p>
          )}
          {canManage && (
            <div className="mt-2 flex flex-wrap gap-2">
              <ActionButton
                type="button"
                icon={ACTION_ICONS.approve}
                variant="primary"
                compact
                disabled={isPending}
                onClick={approve}
              >
                {tr.approveLabel}
              </ActionButton>
              <ActionButton
                type="button"
                icon={ACTION_ICONS.deny}
                variant="danger"
                compact
                disabled={isPending}
                onClick={reject}
              >
                {tr.rejectLabel}
              </ActionButton>
            </div>
          )}
        </div>
      )}

      {item.status === "stale" && item.seen_source_text && (
        <p className="mb-2 rounded border border-warning/40 bg-warning/10 p-2 text-xs text-foreground">
          <span className="font-medium text-muted">{tr.englishWhenTranslated}: </span>
          <span lang="en">{item.seen_source_text}</span>
        </p>
      )}
      {item.status === "as_typed" && <p className="mb-2 text-xs text-muted">{tr.asTypedHint}</p>}

      {canManage && (
        <>
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-muted">
              {tr.thaiField}
              <input
                type="text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setSavedOnce(false);
                  setProposedOnce(false);
                }}
                placeholder={tr.thaiPlaceholder}
                lang="th"
                className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <ActionButton
                type="submit"
                icon={ACTION_ICONS.save}
                variant="primary"
                compact
                disabled={isPending || (!dirty && item.status !== "stale")}
              >
                {isPending ? t.common.saving : savedOnce && !dirty ? tr.saved : tr.saveLabel}
              </ActionButton>
              <ActionButton
                type="button"
                icon={ACTION_ICONS.send}
                variant="secondary"
                compact
                disabled={isPending || !text.trim()}
                onClick={propose}
              >
                {proposedOnce ? tr.proposedDone : tr.proposeLabel}
              </ActionButton>
            </div>
          </form>
          <p className="mt-1 text-xs text-muted">{tr.proposeHint}</p>
          {item.text_th && <p className="mt-1 text-xs text-muted">{tr.clearHint}</p>}
        </>
      )}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
