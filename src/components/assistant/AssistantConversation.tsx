"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { parseRequest, type ParsedRequest } from "@/lib/assistant/parse";
import { isoLocal } from "@/lib/assistant/text";
import { isWriteIntent, type AssistantTrace, type Draft } from "@/lib/assistant/types";
import { isLowRiskWrite, readyToRecord, toolNeeds } from "@/lib/assistant/llm-tools";
import { ASK_MODEL, mayAskModel, waitAfter, type ModelWait } from "@/lib/assistant/model-wait";
import type { AssistantContext } from "@/lib/assistant/data";
import { recordAssistantTurn, recordRefusedTurn } from "@/app/assistant/actions";
// Pi failover (D): a FRESH id at each of the four call sites below, not a kept
// one from useWriteCall(). Nothing here can be pressed twice -- every call is
// fire-and-forget bookkeeping or a one-shot answer whose result is handed
// straight to the turn -- so there is no retry to keep an id for, and a kept
// id would be spent on the NEXT turn and replay this one's answer, silently
// losing that turn's row. The cards, which DO have a Confirm a person presses
// again, use useWriteCall(). docs/decisions/2026-11-01-header-writes-wrapped.md.
import { newWriteRequestId } from "@/lib/write-requests";
import { interpretRequest } from "@/app/assistant/interpret";
import { assistantLookup, type LookupAnswer } from "@/app/assistant/lookups";
import type { AskField, DetailsAsk, HistoryLine, InterpretResult, InterpretResume } from "@/lib/assistant/interpret";
import { ActionButton } from "@/components/ActionButton";
import { MessageCircleQuestionMark } from "lucide-react";
import { AssistantCard, recordLowRisk, type AssistantOutcome } from "./AssistantCards";
import { AssistantAnswer } from "./AssistantAnswers";
import { AssistantDetails } from "./AssistantDetails";
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
 *
 * What it remembers about the model between sentences is `modelWait`: a build
 * with no model is asked once and never again, and a model that did not answer
 * at its address is left alone for a few minutes rather than costing every
 * sentence the same ten-second wait (`model-wait.ts` holds the reasoning).
 *
 * Multi-turn (stream 4): each sentence carries the last few before it, so
 * "send her to hospital" can mean the resident just weighed; and the model
 * may stop to ask for a field (`asking`), which the person answers in a
 * dialog before the card appears. All of it lives in this component's
 * state and nowhere else: a new page is a new conversation.
 */

/** Earlier sentences sent with each new one. The server caps it again; this only keeps the request small. */
const HISTORY_SENT = 3;

/**
 * Whether this login may use a tool at all: the extra activity the tool
 * declares in its own spec (`needs`), answered by the server from the
 * caller's cards. No `needs`, nothing extra to hold. An activity the server
 * did not answer for reads as no (stream 5).
 */
function mayUseTool(context: AssistantContext, kind: Draft["kind"]): boolean {
  const needs = toolNeeds(kind);
  return needs === null || context.toolCards[needs] === true;
}

type TurnState =
  | { kind: "card" }
  | { kind: "pending" }
  /** The model asked for something; the exchange waits in `resume` until the person answers. */
  | { kind: "asking"; ask: DetailsAsk; resume: InterpretResume }
  | { kind: "answer"; answer: LookupAnswer }
  | { kind: "error"; message: string }
  | { kind: "done"; message: string; residentId: string | null }
  | { kind: "cancelled" }
  /** No parser recognised the sentence. */
  | { kind: "unmatched" }
  /** A write, asked by someone who may only ask questions. */
  | { kind: "readOnly" }
  /** A write whose own activity this login does not hold — a prescription without `medical.prescriptions`. */
  | { kind: "noCard" }
  /** A low-risk write going in without a card. */
  | { kind: "recording" };

type Turn = {
  id: number;
  request: string;
  parsed: ParsedRequest | null;
  state: TurnState;
  /** Set when a model was asked about this sentence, whatever came of it. */
  trace?: AssistantTrace;
  /** The earlier sentences this one was sent with, kept so an answer resumes with the same ones. */
  history?: HistoryLine[];
  /**
   * What the person answered the model, for which action. If the model then
   * fails and the keyword parser takes over, these still fill its card.
   */
  answers?: { action: string; fields: AskField[]; values: Record<string, string> };
};

/** What the model is told about the conversation so far: the outcome of each recent sentence, not its exchange. */
function historyOf(turns: Turn[]): HistoryLine[] {
  const lines = turns.flatMap((turn): HistoryLine[] => {
    const outcome: HistoryLine["outcome"] | null =
      turn.state.kind === "done"
        ? "recorded"
        : turn.state.kind === "answer"
          ? "answered"
          : turn.state.kind === "cancelled"
            ? "cancelled"
            : turn.state.kind === "card"
              ? "open"
              : null;
    if (!outcome || !turn.parsed) return [];
    const draft = turn.parsed.draft;
    const residentId =
      turn.state.kind === "done" ? turn.state.residentId : "residentId" in draft ? draft.residentId : null;
    return [{ request: turn.request, outcome, kind: draft.kind, residentId }];
  });
  return lines.slice(-HISTORY_SENT);
}

/** Puts what the person answered into a parser's draft, where it left the field blank. */
function withAnswers(parsed: ParsedRequest | null, answers: Turn["answers"]): ParsedRequest | null {
  if (!parsed || !answers || parsed.draft.kind !== answers.action) return parsed;
  const draft: Record<string, unknown> = { ...parsed.draft };
  for (const field of answers.fields) {
    const raw = answers.values[field.name]?.trim();
    if (!raw || !(field.name in draft) || draft[field.name] !== null) continue;
    const numeric = field.input === "number" || field.input === "integer";
    if (numeric && !Number.isFinite(Number(raw))) continue;
    draft[field.name] = numeric ? Number(raw) : raw;
  }
  return { ...parsed, draft: draft as ParsedRequest["draft"] };
}

export function AssistantConversation({
  context,
  autoFocus = false,
}: {
  context: AssistantContext;
  autoFocus?: boolean;
}) {
  const { t, locale } = useI18n();
  const a = t.assistant;
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  // Turn ids are also field ids inside the cards, so they have to be
  // unique for the life of the conversation — a counter, not a clock.
  const nextTurnId = useRef(1);
  // What the last answer said about the model being there at all: see model-wait.ts.
  const modelWait = useRef<ModelWait>(ASK_MODEL);
  // The turn whose question dialog is open. Closing it leaves the question waiting in the conversation.
  const [askOpen, setAskOpen] = useState<number | null>(null);

  const parserData = useMemo(
    () => ({
      residents: context.residents,
      enclosures: context.enclosures.map((e) => ({
        id: e.id,
        name: e.name,
        nameTh: e.name_th,
      })),
      zones: context.zones.map((z) => ({ id: z.id, name: z.name, nameTh: z.name_th })),
      clinics: context.clinics,
      carers: context.carers,
      immunizationTypes: context.immunizationTypes,
      medications: context.medications,
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

    if (!context.canAsk || !mayAskModel(modelWait.current)) {
      const parsed = parseRequest(trimmed, parserData);
      setTurns((prev) => [...prev, startedTurn(id, trimmed, parsed)]);
      afterParse(id, trimmed, parsed);
      return;
    }

    // The model first; the keyword parser is what every failure falls back to.
    const history = historyOf(turns);
    setTurns((prev) => [...prev, { id, request: trimmed, parsed: null, state: { kind: "pending" }, history }]);
    interpretRequest({ request: trimmed, today: isoLocal(new Date()), history })
      .then((result) => interpreted(id, trimmed, result))
      .catch(() => fallback(id, trimmed));
  }

  /** The model's reply to a sentence or to an answer: a card, a question, or the keyword parser. */
  function interpreted(id: number, request: string, result: InterpretResult, prior?: Pick<Turn, "trace" | "answers">) {
    if (!result.ok) {
      const remember = waitAfter(result);
      if (remember) modelWait.current = remember;
      return fallback(id, request, result.trace ?? prior?.trace, prior?.answers);
    }
    if ("ask" in result) {
      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === id
            ? { ...turn, trace: result.trace, state: { kind: "asking", ask: result.ask, resume: result.resume } }
            : turn,
        ),
      );
      setAskOpen(id);
      return;
    }
    const parsed: ParsedRequest = {
      draft: result.draft,
      intent: result.draft.kind,
      residentCandidates: result.residentCandidates,
    };
    setTurns((prev) =>
      prev.map((turn) => (turn.id === id ? { ...turn, ...startedTurn(id, request, parsed, result.trace) } : turn)),
    );
    afterParse(id, request, parsed, result.trace);
  }

  function fallback(id: number, request: string, trace?: AssistantTrace, answers?: Turn["answers"]) {
    const parsed = withAnswers(parseRequest(request, parserData), answers);
    setTurns((prev) =>
      prev.map((turn) => (turn.id === id ? { ...turn, ...startedTurn(id, request, parsed, trace) } : turn)),
    );
    afterParse(id, request, parsed, trace);
  }

  /** The person answered the model's question (or skipped it, with no values): the exchange resumes. */
  function answer(turn: Turn, values: Record<string, string>) {
    if (turn.state.kind !== "asking") return;
    const { ask, resume } = turn.state;
    setAskOpen(null);
    const earlier = turn.answers?.action === ask.action ? turn.answers : undefined;
    const answers = {
      action: ask.action,
      fields: [...(earlier?.fields ?? []), ...ask.fields],
      values: { ...earlier?.values, ...values },
    };
    setTurns((prev) => prev.map((t) => (t.id === turn.id ? { ...t, answers, state: { kind: "pending" } } : t)));
    interpretRequest({
      request: turn.request,
      today: isoLocal(new Date()),
      history: turn.history,
      resume: { state: resume, answer: values },
    })
      .then((result) => interpreted(turn.id, turn.request, result, { trace: turn.trace, answers }))
      .catch(() => fallback(turn.id, turn.request, turn.trace, answers));
  }

  function startedTurn(id: number, request: string, parsed: ParsedRequest | null, trace?: AssistantTrace): Turn {
    return { id, request, parsed, state: stateFor(parsed), trace };
  }

  /**
   * What happens to a turn once it has a Draft: a card to confirm, a
   * read-only answer being fetched, a refusal, or — for a low-risk write the
   * sentence left nothing blank in — the write itself, with no card
   * (docs/decisions/2026-10-31-assistant-v2-more-tools.md).
   */
  function stateFor(parsed: ParsedRequest | null): TurnState {
    if (!parsed) return { kind: "unmatched" };
    if (!isWriteIntent(parsed.intent)) return { kind: "pending" };
    if (!context.canWrite) return { kind: "readOnly" };
    if (!mayUseTool(context, parsed.draft.kind)) return { kind: "noCard" };
    if (isLowRiskWrite(parsed.draft.kind) && readyToRecord(parsed.draft, parsed.residentCandidates)) {
      return { kind: "recording" };
    }
    return { kind: "card" };
  }

  /** The bookkeeping and the read-only answer that follow once a turn has a Draft, or none. */
  function afterParse(id: number, trimmed: string, parsed: ParsedRequest | null, trace?: AssistantTrace) {
    const state = stateFor(parsed);

    if (state.kind === "readOnly" || state.kind === "noCard") {
      // Bookkeeping only: a failure here must never touch the refusal shown.
      recordRefusedTurn(trimmed, newWriteRequestId(), trace).catch(() => {});
      return;
    }

    if (state.kind === "recording" && parsed) {
      const draft = parsed.draft;
      if (draft.kind !== "weight" && draft.kind !== "immunization") return;
      void recordLowRisk(
        draft,
        {
          request: trimmed,
          trace,
          residents: context.residents,
          immunizationTypes: context.immunizationTypes,
          t,
          locale,
        },
        newWriteRequestId(),
      ).then((result) =>
        update(id, "error" in result ? { kind: "error", message: result.error } : result),
      );
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
        requestId: newWriteRequestId(),
      });
      return;
    }

    if (state.kind !== "pending") return;

    const draft = parsed.draft;
    if (
      draft.kind !== "where" &&
      draft.kind !== "who" &&
      draft.kind !== "due" &&
      draft.kind !== "find-enclosure" &&
      draft.kind !== "summary"
    ) {
      return;
    }
    // The server runs on Workers, in UTC; "this week" has to be counted
    // from the calendar date of whoever is asking (backlog d98695a).
    void assistantLookup({
      request: trimmed,
      draft,
      today: isoLocal(new Date()),
      requestId: newWriteRequestId(),
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
        requestId: newWriteRequestId(),
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
      const parsed = parseRequest(example, parserData);
      if (!parsed || !isWriteIntent(parsed.intent)) return true;
      return context.canWrite && mayUseTool(context, parsed.draft.kind);
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
            <TurnReply turn={turn} context={context} onSettle={settle} onOpenAsk={() => setAskOpen(turn.id)} />
          </AssistantTurn>
        ))}
      </AssistantMessageList>

      {turns.map((turn) =>
        turn.id === askOpen && turn.state.kind === "asking" ? (
          <AssistantDetails
            key={turn.id}
            turnId={turn.id}
            ask={turn.state.ask}
            onAnswer={(values) => answer(turn, values)}
            onClose={() => setAskOpen(null)}
            onCancel={() => {
              setAskOpen(null);
              settle(turn, { kind: "cancelled" });
            }}
          />
        ) : null,
      )}

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
  onOpenAsk,
}: {
  turn: Turn;
  context: AssistantContext;
  onSettle: (turn: Turn, outcome: AssistantOutcome) => void;
  onOpenAsk: () => void;
}) {
  const { t } = useI18n();
  const a = t.assistant;

  switch (turn.state.kind) {
    case "asking":
      return (
        <ReplyBubble>
          <p>{turn.state.ask.question || a.details.title}</p>
          <div className="mt-2">
            <ActionButton icon={MessageCircleQuestionMark} compact onClick={onOpenAsk}>
              {a.details.answer}
            </ActionButton>
          </div>
        </ReplyBubble>
      );
    case "unmatched":
      return <ReplyBubble>{a.cantHelp}</ReplyBubble>;
    case "readOnly":
      return <ReplyBubble tone="muted">{a.volunteerReadOnly}</ReplyBubble>;
    case "noCard":
      return <ReplyBubble tone="muted">{a.notYourCard}</ReplyBubble>;
    case "pending":
      return <PendingBubble label={a.looking} />;
    case "recording":
      return <PendingBubble label={a.recording} />;
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
            medications: context.medications,
            rounds: context.rounds,
            doctors: context.doctors,
            candidates: turn.parsed.residentCandidates,
            onSettle: (outcome) => onSettle(turn, outcome),
          }}
        />
      );
  }
}
