"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate, formatDateTime } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import { placeName } from "@/lib/enclosures/names";
import { statusLabel } from "@/lib/i18n/enum-labels";
import type { AssistantResident } from "@/lib/assistant/data";
import type { DueAnswer, LookupAnswer, WhereAnswer, WhoAnswer } from "@/app/assistant/lookups";
import { ReplyBubble } from "./AssistantMessages";

/**
 * The answers to the three questions that write nothing. No card, no
 * Confirm — a question gets an answer and a way to open what it is about.
 */

function Thumbnail({
  photoFileId,
  name,
}: {
  photoFileId: string | null;
  name: string;
}) {
  const { t } = useI18n();
  if (!photoFileId) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-md bg-surface-hover text-center text-xs text-muted">
        {t.enclosures.hub.noPhoto}
      </div>
    );
  }
  return (
    <img
      src={driveImageUrl(photoFileId)}
      alt={name}
      className="aspect-square w-full rounded-md object-cover"
    />
  );
}

function ResidentTile({
  id,
  name,
  code,
  photoFileId,
}: {
  id: string;
  name: string;
  code: string;
  photoFileId: string | null;
}) {
  return (
    <Link
      href={`/residents/${id}`}
      className="flex w-32 flex-col gap-2 rounded-lg border border-border bg-background p-2 transition hover:bg-surface-hover"
    >
      <Thumbnail photoFileId={photoFileId} name={name} />
      <span className="truncate text-sm font-medium text-foreground">{name}</span>
      <span className="text-xs text-muted">{code}</span>
    </Link>
  );
}

function WhereBody({ answer }: { answer: WhereAnswer }) {
  const { t, locale } = useI18n();
  const a = t.assistant.lookups;
  const r = answer.resident;
  const displayName = r.thaiName ? `${r.name} (${r.thaiName})` : r.name;
  const where = placeName(locale, answer.enclosureName, answer.enclosureNameTh);
  const zone = placeName(locale, answer.zoneName, answer.zoneNameTh);

  return (
    <div className="flex flex-col gap-2">
      <p>
        {where
          ? a.whereAnswer(displayName, zone ? `${where} (${zone})` : where)
          : a.whereNowhere(displayName)}
      </p>
      {answer.status && (
        <p className="text-muted">{a.whereStatus(statusLabel(t, answer.status))}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <ResidentTile id={r.id} name={displayName} code={r.code} photoFileId={r.photoFileId} />
      </div>
      {answer.enclosureId && (
        <Link
          href={`/enclosures/${answer.enclosureId}`}
          className="text-primary hover:underline"
        >
          {a.openEnclosure}
        </Link>
      )}
    </div>
  );
}

function WhoBody({ answer }: { answer: WhoAnswer }) {
  const { t, locale } = useI18n();
  const a = t.assistant.lookups;
  const where = placeName(locale, answer.enclosure.name, answer.enclosure.nameTh);

  return (
    <div className="flex flex-col gap-2">
      <p>
        {answer.residents.length === 0
          ? a.whoEmpty(where)
          : a.whoAnswer(where, answer.residents.length)}
      </p>
      {answer.residents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {answer.residents.map((r) => (
            <ResidentTile
              key={r.id}
              id={r.id}
              name={r.thaiName ? `${r.name} (${r.thaiName})` : r.name}
              code={r.code}
              photoFileId={r.photoFileId}
            />
          ))}
        </div>
      )}
      <Link
        href={`/enclosures/${answer.enclosure.id}`}
        className="text-primary hover:underline"
      >
        {a.openEnclosure}
      </Link>
    </div>
  );
}

function DueBody({
  answer,
  residents,
}: {
  answer: DueAnswer;
  /** The rows the page loaded; the visits carry only a resident id. */
  residents: AssistantResident[];
}) {
  const { t, locale } = useI18n();
  const a = t.assistant.lookups;
  const nameOf = (id: string) => {
    const r = residents.find((x) => x.id === id);
    return r ? `${r.name} (${r.code})` : t.common.dash;
  };

  const nothing =
    answer.overdueVisits.length === 0 &&
    answer.visits.length === 0 &&
    answer.jobs.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium">{a.dueTitle(answer.days)}</p>
      {nothing && <p className="text-muted">{a.dueNothing}</p>}

      {answer.overdueVisits.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-danger">
            {a.dueOverdue}
          </p>
          <ul className="flex flex-col gap-1">
            {answer.overdueVisits.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/residents/${v.residentId}`}
                  className="text-primary hover:underline"
                >
                  {nameOf(v.residentId)}
                </Link>{" "}
                — {formatDateTime(v.when, locale)}
                {v.vetName ? ` · ${v.vetName}` : ""}
                {v.reason ? ` · ${v.reason}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {answer.visits.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {a.dueVisits}
          </p>
          <ul className="flex flex-col gap-1">
            {answer.visits.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/residents/${v.residentId}`}
                  className="text-primary hover:underline"
                >
                  {nameOf(v.residentId)}
                </Link>{" "}
                — {formatDateTime(v.when, locale)}
                {v.vetName ? ` · ${v.vetName}` : ""}
                {v.reason ? ` · ${v.reason}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {answer.jobs.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {a.dueJobs}
          </p>
          <ul className="flex flex-col gap-1">
            {answer.jobs.map((job) => {
              const where = placeName(locale, job.placeName, job.placeNameTh);
              return (
                <li key={job.id}>
                  <Link
                    href={`/maintenance/${job.id}`}
                    className="text-primary hover:underline"
                  >
                    {job.jobCode} · {job.title}
                  </Link>{" "}
                  — {formatDate(job.dueDate, locale)}
                  {where ? ` · ${where}` : ""}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AssistantAnswer({
  answer,
  residents,
}: {
  answer: LookupAnswer;
  residents: AssistantResident[];
}) {
  return (
    <ReplyBubble>
      {answer.kind === "where" ? (
        <WhereBody answer={answer} />
      ) : answer.kind === "who" ? (
        <WhoBody answer={answer} />
      ) : (
        <DueBody answer={answer} residents={residents} />
      )}
    </ReplyBubble>
  );
}
