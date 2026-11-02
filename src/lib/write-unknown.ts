import { waitForWrite } from "./write-requests";

/**
 * "We couldn't tell whether that saved", as a TAG on the result rather than a
 * sentence to compare against. The server (runWriteAction) and the browser
 * (waitForWrite giving up) both build it with cannotTellResult(), and every
 * reader asks isCannotTell(), so the control flow never depends on translated
 * text.
 */
export type CannotTell = { ok: false; error: string; cannotTell: true };

export function cannotTellResult(error: string): CannotTell {
  return { ok: false, error, cannotTell: true };
}

export function isCannotTell(result: unknown): boolean {
  return (
    typeof result === "object" &&
    result !== null &&
    (result as { cannotTell?: unknown }).cannotTell === true
  );
}

export type GuardOptions<R> = {
  /** What to hand back when the browser gives up waiting. */
  cannotTell: () => R;
  /** What to hand back for a press made while the last answer is still unknown. */
  stillUnknown: () => R;
  /** Offer the reload; true if the person agreed. */
  confirmReload: () => boolean;
  reload: () => void;
};

/**
 * After "can't tell" the request id MUST be kept (a fresh one would run a write
 * that may already have landed), so another press can only get the same
 * "in flight" answer. Instead of sending it, the next press offers the one
 * thing that can resolve it: reloading to look. `lock` is true from the
 * "can't tell" answer until the page is reloaded.
 */
export async function guardWrite<R>(
  lock: { current: boolean },
  call: () => Promise<R>,
  o: GuardOptions<R>,
): Promise<R> {
  if (lock.current) {
    if (o.confirmReload()) o.reload();
    return o.stillUnknown();
  }
  const next = await waitForWrite(call, o.cannotTell);
  lock.current = isCannotTell(next);
  return next;
}
