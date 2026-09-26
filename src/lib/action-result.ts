import { unstable_rethrow } from "next/navigation";

/**
 * What a Server Action returns instead of throwing (docs/decisions.md,
 * 2026-09-26, "Server Actions return a result").
 *
 * In a production build React strips the message from anything thrown in
 * a "use server" function and the browser shows only "Minified React
 * error #441", so a thrown error can never tell the person what went
 * wrong — not even a translated one. An action returns
 * `{ ok: false, error }` with words written for them, and `{ ok: true }`
 * (plus whatever it hands back) when it worked.
 *
 * Client components import this as a type only.
 */
export type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export type ActionRefusal = { ok: false; error: string };

/**
 * The refusal for a failure nobody planned words for. The raw error goes
 * to the server log (the Worker logs in production) under a short
 * reference, and the person gets `message(ref)` — "Something went wrong
 * … reference …" — so what they report can be found.
 */
export function unexpectedFailure(
  where: string,
  error: unknown,
  message: (ref: string) => string,
): ActionRefusal {
  const ref = crypto.randomUUID().slice(0, 8);
  console.error(`[${where}] ref ${ref}:`, error);
  return { ok: false, error: message(ref) };
}

/**
 * Runs an action body and turns anything it throws into
 * unexpectedFailure(), so no throw escapes to become #441. Next's own
 * control-flow throws (redirect, notFound) are passed through.
 */
export async function runAction<R extends object>(
  where: string,
  message: (ref: string) => string,
  body: () => Promise<ActionResult<R>>,
): Promise<ActionResult<R>> {
  try {
    return await body();
  } catch (error) {
    unstable_rethrow(error);
    return unexpectedFailure(where, error, message);
  }
}
