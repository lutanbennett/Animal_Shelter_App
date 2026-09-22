"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { parseRequest, type ParsedRequest } from "@/lib/assistant/parse";
import { isWriteIntent } from "@/lib/assistant/types";
import type { AssistantContext } from "@/lib/assistant/data";
import { recordAssistantTurn } from "@/app/assistant/actions";
import { assistantLookup, type LookupAnswer } from "@/app/assistant/lookups";
import { AssistantCard, type AssistantOutcome } from "./AssistantCards";
import { AssistantAnswer } from "./AssistantAnswers";
import { AssistantInput } from "./AssistantInput";
import {
  AssistantMessageList,
  AssistantTurn,
  PendingBubble,
  ReplyBubble,
  RequestBubble,
} from "./AssistantMessages";

/**
 * The conversation: the whole assistant apart from where it is shown.
 * The /assistant page and the slide-over both render this, so there is
 * one behaviour to reason about and one to replace when version 2 lands.
 *
 * The parsing happens right here in the browser, against the rows the
 * server handed over — so nothing is asked of the server until there is
 * something to do. What reaches the server is a confirmed write, a
 * read-only question, or the audit row for a turn that ended in neither.
 */

type TurnState =
  | { kind: "card" }
  | { kind: "pending" }
  | { kind: "answer"; answer: LookupAnswer }
  | { kind: "error"; message: string }
  | { kind: "done"; message: string; residentId: string | null }
  | { kind: "cancelled" }
  /** No parser recognised the sentence. */
  | { kind: "unmatched" }
  /** A write, asked by someone who may only ask questions. */
  | { kind: "readOnly" };

type Turn = {
  id: number;
  request: string;
  parsed: ParsedRequest | null;
  state: TurnState;
};

export function AssistantConversation({
  context,
  autoFocus = false,
}: {
  context: AssistantContext;
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  const a = t.assistant;
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  // Turn ids are also field ids inside the cards, so they have to be
  // unique for the life of the conversation — a counter, not a clock.
  const nextTurnId = useRef(1);

  const parserData = useMemo(
    () => ({
      residents: context.residents,
      enclosures: context.enclosures.map((e) => ({
        id: e.id,
        name: e.name,
        nameTh: e.name_th,
      })),
      vets: context.vets.map((v) => ({
        id: v.id,
        name: v.name,
        clinicName: v.clinic_name,
      })),
    }),
    [context],
  );

  function update(id: number, state: TurnState) {
    setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, state } : turn)));
  }

  function submit(request: string) {
    const trimmed = request.trim();
    if (!trimmed) return;

    const parsed = parseRequest(trimmed, parserData);
    const id = nextTurnId.current++;

    const state: TurnState = !parsed
      ? { kind: "unmatched" }
      : isWriteIntent(parsed.intent)
        ? context.canWrite
          ? { kind: "card" }
          : { kind: "readOnly" }
        : { kind: "pending" };

    setTurns((prev) => [...prev, { id, request: trimmed, parsed, state }]);
    setText("");

    if (!parsed) {
      // The sentences a keyword parser could not place are the test set
      // version 2 has to beat (0070), so they are worth a row of their own.
      void recordAssistantTurn({
        request: trimmed,
        intent: null,
        draft: null,
        status: "unmatched",
      });
      return;
    }

    if (state.kind !== "pending") return;

    const draft = parsed.draft;
    if (draft.kind !== "where" && draft.kind !== "who" && draft.kind !== "due") return;
    void assistantLookup({ request: trimmed, draft }).then((result) => {
      update(
        id,
        "error" in result
          ? { kind: "error", message: result.error }
          : { kind: "answer", answer: result.answer },
      );
    });
  }

  function settle(turn: Turn, outcome: AssistantOutcome) {
    if (outcome.kind === "cancelled") {
      update(turn.id, { kind: "cancelled" });
      void recordAssistantTurn({
        request: turn.request,
        intent: turn.parsed?.intent ?? null,
        draft: turn.parsed?.draft ?? null,
        status: "cancelled",
      });
      return;
    }
    update(turn.id, outcome);
  }

  const examples = a.examples(
    context.residents[0]?.name ?? "Panda",
    context.enclosures[0]?.name ?? "A3",
    context.vets[0]?.name ?? "Dr Somchai",
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {turns.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="mb-2 font-medium text-muted">{a.tryTitle}</p>
          <ul className="flex flex-col gap-1">
            {examples.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => setText(example)}
                  className="text-left text-primary hover:underline"
                >
                  “{example}”
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AssistantMessageList>
        {turns.map((turn) => (
          <AssistantTurn key={turn.id}>
            <RequestBubble text={turn.request} />
            <TurnReply turn={turn} context={context} onSettle={settle} />
          </AssistantTurn>
        ))}
      </AssistantMessageList>

      <AssistantInput
        onSend={submit}
        value={text}
        onValueChange={setText}
        autoFocus={autoFocus}
      />
    </div>
  );
}

function TurnReply({
  turn,
  context,
  onSettle,
}: {
  turn: Turn;
  context: AssistantContext;
  onSettle: (turn: Turn, outcome: AssistantOutcome) => void;
}) {
  const { t } = useI18n();
  const a = t.assistant;

  switch (turn.state.kind) {
    case "unmatched":
      return <ReplyBubble>{a.cantHelp}</ReplyBubble>;
    case "readOnly":
      return <ReplyBubble tone="muted">{a.volunteerReadOnly}</ReplyBubble>;
    case "pending":
      return <PendingBubble label={a.looking} />;
    case "answer":
      return <AssistantAnswer answer={turn.state.answer} residents={context.residents} />;
    case "error":
      return <ReplyBubble tone="danger">{turn.state.message}</ReplyBubble>;
    case "cancelled":
      return <ReplyBubble tone="muted">{a.cancelled}</ReplyBubble>;
    case "done":
      return (
        <ReplyBubble>
          <p>{turn.state.message}</p>
          {turn.state.residentId && (
            <Link
              href={`/residents/${turn.state.residentId}`}
              className="text-primary hover:underline"
            >
              {a.openResident}
            </Link>
          )}
        </ReplyBubble>
      );
    case "card":
      if (!turn.parsed) return null;
      return (
        <AssistantCard
          draft={turn.parsed.draft}
          ctx={{
            turnId: turn.id,
            request: turn.request,
            residents: context.residents,
            zones: context.zones,
            enclosures: context.enclosures,
            vets: context.vets,
            candidates: turn.parsed.residentCandidates,
            onSettle: (outcome) => onSettle(turn, outcome),
          }}
        />
      );
  }
}
