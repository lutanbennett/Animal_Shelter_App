"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { parseRequest, type ParsedRequest } from "@/lib/assistant/parse";
import { isoLocal } from "@/lib/assistant/text";
import { isWriteIntent, type AssistantTrace } from "@/lib/assistant/types";
import type { AssistantContext } from "@/lib/assistant/data";
import { recordAssistantTurn, recordRefusedTurn } from "@/app/assistant/actions";
import { interpretRequest } from "@/app/assistant/interpret";
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
 * Version 2: the sentence goes first to the model (`interpretRequest`),
 * which hands back a Draft for the same cards to confirm. When there is no
 * model, or it is slow, refuses or returns nothing usable, the keyword
 * parser runs here in the browser against the rows the server handed over,
 * exactly as it did before the model existed. What reaches the server for a
 * write is still only the confirmed card; a read-only question or the audit
 * row for a turn that ended in neither follows the same path as ever.
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
  /** Set when a model was asked about this sentence, whatever came of it. */
  trace?: AssistantTrace;
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
  // Once the server says no model is set up, stop asking it on every sentence.
  const modelOff = useRef(false);

  const parserData = useMemo(
    () => ({
      residents: context.residents,
      enclosures: context.enclosures.map((e) => ({
        id: e.id,
        name: e.name,
        nameTh: e.name_th,
      })),
      clinics: context.clinics,
      carers: context.carers,
      immunizationTypes: context.immunizationTypes,
    }),
    [context],
  );

  function update(id: number, state: TurnState) {
    setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, state } : turn)));
  }

  function submit(request: string) {
    const trimmed = request.trim();
    if (!trimmed) return;

    const id = nextTurnId.current++;
    setText("");

    if (modelOff.current || !context.canAsk) {
      const parsed = parseRequest(trimmed, parserData);
      setTurns((prev) => [...prev, startedTurn(id, trimmed, parsed)]);
      afterParse(id, trimmed, parsed);
      return;
    }

    // The model first; the keyword parser is what every failure falls back to.
    setTurns((prev) => [...prev, { id, request: trimmed, parsed: null, state: { kind: "pending" } }]);
    const fallback = (trace?: AssistantTrace) => {
      const parsed = parseRequest(trimmed, parserData);
      setTurns((prev) =>
        prev.map((turn) => (turn.id === id ? startedTurn(id, trimmed, parsed, trace) : turn)),
      );
      afterParse(id, trimmed, parsed, trace);
    };
    interpretRequest({ request: trimmed, today: isoLocal(new Date()) })
      .then((result) => {
        if (!result.ok) {
          if (result.reason === "not_configured") modelOff.current = true;
          return fallback(result.trace);
        }
        const parsed: ParsedRequest = { draft: result.draft, intent: result.draft.kind, residentCandidates: [] };
        setTurns((prev) =>
          prev.map((turn) => (turn.id === id ? startedTurn(id, trimmed, parsed, result.trace) : turn)),
        );
        afterParse(id, trimmed, parsed, result.trace);
      })
      .catch(() => fallback());
  }

  function startedTurn(id: number, request: string, parsed: ParsedRequest | null, trace?: AssistantTrace): Turn {
    const state: TurnState = !parsed
      ? { kind: "unmatched" }
      : isWriteIntent(parsed.intent)
        ? context.canWrite
          ? { kind: "card" }
          : { kind: "readOnly" }
        : { kind: "pending" };
    return { id, request, parsed, state, trace };
  }

  /** The bookkeeping and the read-only answer that follow once a turn has a Draft, or none. */
  function afterParse(id: number, trimmed: string, parsed: ParsedRequest | null, trace?: AssistantTrace) {
    const state = startedTurn(id, trimmed, parsed, trace).state;

    if (state.kind === "readOnly") {
      // Bookkeeping only: a failure here must never touch the refusal shown.
      recordRefusedTurn(trimmed, trace).catch(() => {});
      return;
    }

    if (!parsed) {
      // The sentences neither the model nor a keyword parser could place are
      // the test set (0070), so they are worth a row of their own.
      void recordAssistantTurn({
        request: trimmed,
        intent: null,
        draft: null,
        status: "unmatched",
        trace,
      });
      return;
    }

    if (state.kind !== "pending") return;

    const draft = parsed.draft;
    if (draft.kind !== "where" && draft.kind !== "who" && draft.kind !== "due") return;
    // The server runs on Workers, in UTC; "this week" has to be counted
    // from the calendar date of whoever is asking (backlog d98695a).
    void assistantLookup({
      request: trimmed,
      draft,
      today: isoLocal(new Date()),
    }).then((result) => {
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
        trace: turn.trace,
      });
      return;
    }
    update(turn.id, outcome);
  }

  // A suggestion that can only end in "recording is not for you" is not offered: without the activity the
  // confirm step asks (assistant.record), only the examples that parse as lookups are drawn.
  const examples = a
    .examples(
      context.residents[0]?.name ?? "Panda",
      context.enclosures[0]?.name ?? "A3",
      context.clinics[0]?.name ?? "Dr Somchai",
    )
    .filter((example) => {
      if (context.canWrite) return true;
      const parsed = parseRequest(example, parserData);
      return !parsed || !isWriteIntent(parsed.intent);
    });

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
          <AssistantTurn key={turn.id} settled={turn.state.kind}>
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
            trace: turn.trace,
            residents: context.residents,
            zones: context.zones,
            enclosures: context.enclosures,
            clinics: context.clinics,
            carers: context.carers,
            immunizationTypes: context.immunizationTypes,
            doctors: context.doctors,
            candidates: turn.parsed.residentCandidates,
            onSettle: (outcome) => onSettle(turn, outcome),
          }}
        />
      );
  }
}
