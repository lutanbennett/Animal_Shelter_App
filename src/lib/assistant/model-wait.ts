import type { InterpretResult } from "./interpret";

/**
 * What one conversation remembers about the model between sentences, so a
 * machine that is not answering costs ONE wait and not one per sentence.
 *
 * The problem this solves, measured in
 * docs/decisions/2026-10-30-assistant-local-model-reachable.md: with the model
 * machine asleep the adapter reports `unavailable` after 10.7 seconds (Node's
 * own connect timeout), and 0.2 seconds when nothing is listening at all. The
 * browser's only memory used to be "no model in this build", so every sentence
 * paid that 10.7 seconds again before the keyword reader answered.
 *
 * Three states, and the middle one is the new one:
 *   ask      — ask the model, as every sentence did.
 *   none     — this build has no model (or this login may not ask one). There is
 *              nothing to come back for, so the conversation never asks again.
 *   asleep   — something IS configured but did not answer at its address. Give
 *              the keyword reader the next few minutes, then try once more.
 *
 * Why these are pure functions and not a `useRef` full of branches: the
 * component has no test and this is the part with the clock in it.
 */

/**
 * How long an `unavailable` verdict is remembered, and the reasoning, since
 * the item that asked for this said only "a few minutes":
 *
 * - The cost of being too SHORT is another 10.7-second wait. At three minutes a
 *   burst of sentences — someone recording a round of weights on a phone, a
 *   sentence every 20 to 60 seconds — pays that wait once, not five times.
 * - The cost of being too LONG is a model that is awake and not being asked. At
 *   three minutes, someone who has just woken the model machine gets the model
 *   back without doing anything and without noticing they waited.
 * - Sooner than that, for someone who does not want to wait at all: the memory
 *   lives in the open conversation, so reloading /assistant or closing and
 *   reopening the slide-over asks the model again at once. That is deliberate,
 *   and it is the only "retry now" there is.
 *
 * Held per mounted conversation rather than anywhere shared, which is both the
 * cheapest place and the right one: it is a guess about the next few seconds, it
 * must not outlive the browser tab, and a wrong guess costs one 10.7-second
 * wait. A shared or stored one would need invalidating when the machine wakes,
 * which is the thing nothing here can observe.
 */
export const MODEL_ASLEEP_MS = 180_000;

export type ModelWait =
  | { kind: "ask" }
  | { kind: "none" }
  /** Epoch milliseconds: before this, do not ask. */
  | { kind: "asleep"; until: number };

export const ASK_MODEL: ModelWait = { kind: "ask" };

/**
 * Whether this sentence goes to the model at all.
 *
 * The clock lives here, not at the call site: `react-hooks/purity` reads a
 * `Date.now()` anywhere in a component's body as a render-time call, and it is
 * right to — the conversation's handlers are declared there. The window is this
 * module's idea anyway, so it owns the clock, and `now` stays injectable for the
 * test rather than for the caller.
 */
export function mayAskModel(wait: ModelWait, now: number = Date.now()): boolean {
  if (wait.kind === "none") return false;
  if (wait.kind === "asleep") return now >= wait.until;
  return true;
}

/**
 * What to remember after a turn. `null` leaves the memory as it was — a refusal,
 * a timeout or a sentence the model made nothing of says nothing about whether
 * the model is THERE, and a turn that worked says only that it was there a
 * moment ago, which is what `ask` already assumes.
 *
 * A timeout deliberately does not latch: a model that answers slowly is a model
 * that is answering, and the next sentence may be the shorter one.
 */
export function waitAfter(result: InterpretResult, now: number = Date.now()): ModelWait | null {
  if (result.ok) return null;
  if (result.reason === "not_configured") return { kind: "none" };
  if (result.reason === "error" && result.errorKind === "unavailable") {
    return { kind: "asleep", until: now + MODEL_ASLEEP_MS };
  }
  return null;
}
