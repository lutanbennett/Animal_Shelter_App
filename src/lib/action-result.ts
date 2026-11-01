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

/** The words databaseFailure() can use, from the dictionary's `common`. */
type DatabaseMessages = {
  alreadyExists: string;
  notAllowed: string;
  notAccepted: string;
  somethingWentWrong: (ref: string) => string;
};

/**
 * The refusal for a Postgres error from a write. The ones a person can act
 * on get their sentence — unique (23505), check (23514) and row-level
 * security / privilege (42501) — and everything else goes through
 * unexpectedFailure(), so the raw message (table, column and constraint
 * names) stays in the server log and never reaches the browser.
 */
export function databaseFailure(
  where: string,
  error: { code?: string; message?: string },
  messages: DatabaseMessages,
): ActionRefusal {
  if (error.code === "23505") return { ok: false, error: messages.alreadyExists };
  if (error.code === "23514") return { ok: false, error: messages.notAccepted };
  if (error.code === "42501") return { ok: false, error: messages.notAllowed };
  return unexpectedFailure(where, error, messages.somethingWentWrong);
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

/**
 * Pi failover (C): the shared wrapper a write goes through so that replaying
 * it on the Worker cannot apply it twice.
 *
 * READ THIS BEFORE TRUSTING IT. The schema paper
 * (docs/decisions/2026-10-31-write-requests-schema.md, requirement 1) asks
 * that each write reach the database as ONE statement or RPC that claims,
 * writes and finishes. A wrapper AROUND an arbitrary `body` CANNOT do that:
 * `body` is ordinary JavaScript making its own PostgREST calls, each of which
 * is its own transaction, and supabase-js offers no transaction handle. So
 * this wrapper does NOT give the one-transaction guarantee, and it does not
 * pretend to. docs/decisions/2026-10-31-write-request-wrapper.md sets out what
 * it gives instead, what it costs, and what (D) must do per path to recover
 * the guarantee. The short version:
 *
 *   - It can never apply a write twice, and can never report a replay as a
 *     fresh success. Those are the two failures that matter.
 *   - What it loses is availability, not correctness: a process that dies
 *     between the claim and the write leaves a claim with no result, and the
 *     retry is then told "we cannot tell" although it was in fact free.
 *
 * The three answers claim_write_request() gives are all handled here, and
 * `in_flight` is a refusal in the person's words -- never a success, and never
 * a licence to write again.
 */

/** Just enough of a Supabase client to reach the two database functions. */
export type WriteRequestRpc = {
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>;
};

/** The words runWriteAction() needs, from the dictionary's `common`. */
export type WriteMessages = {
  somethingWentWrong: (ref: string) => string;
  /** The claim committed with no result: the save may or may not have happened. */
  saveUnknown: string;
  /** The browser sent no usable request id, so this page's JavaScript is stale. */
  reloadToSave: string;
};

type ClaimAnswer =
  | { status: "claimed" }
  | { status: "replay"; action?: string; result?: unknown }
  | { status: "in_flight"; action?: string };

function claimAnswer(data: unknown): ClaimAnswer | null {
  if (typeof data !== "object" || data === null) return null;
  const status = (data as { status?: unknown }).status;
  return status === "claimed" || status === "replay" || status === "in_flight" ? (data as ClaimAnswer) : null;
}

/**
 * Optional. Omitted, the whole result is stored and replayed, exactly as before; every caller written before this
 * existed passes nothing and is unchanged.
 */
export type WriteOptions<R extends object> = {
  /**
   * What to store in write_requests.result INSTEAD of a successful result, for a write whose success carries a secret
   * (a temporary password, a TOTP key). The caller returns the answer a REPLAY should get, usually a refusal in plain
   * words saying the secret was shown once. The person who pressed still receives the real result.
   */
  storedAs: (success: { ok: true } & R) => ActionResult<object>;
};

/**
 * Run a write once, however many times it is sent.
 *
 * `request.id` is the browser's own v4 id for this save attempt
 * (src/lib/write-requests.ts). `request.action` is the write path's name, and
 * is recorded so that the same id arriving against a DIFFERENT action is
 * refused by the database rather than answered with the other path's result.
 * `request.db` is the caller's own Supabase client, so the claim, the write
 * and the finish all run as the same signed-in login.
 *
 * Call it instead of runAction() for a write, and put the page's address on
 * WRAPPED_WRITE_PATHS only once EVERY write that page hosts calls it.
 */
export async function runWriteAction<R extends object>(
  where: string,
  messages: WriteMessages,
  request: { id: string | null; action: string; db: WriteRequestRpc },
  body: () => Promise<ActionResult<R>>,
  options?: WriteOptions<R>,
): Promise<ActionResult<R>> {
  const { id, action, db } = request;

  // No id means this browser is running JavaScript from before the sweep, and
  // the page's address may already be on WRAPPED_WRITE_PATHS -- so proceeding
  // would let the Worker replay a write that was never claimed. Refusing is
  // the fail-closed answer and a reload fixes it.
  if (!id) {
    console.error(`[${where}] refused: no write request id`);
    return { ok: false, error: messages.reloadToSave };
  }

  let claimed;
  try {
    claimed = await db.rpc("claim_write_request", { p_request_id: id, p_action: action });
  } catch (error) {
    unstable_rethrow(error);
    return unexpectedFailure(`${where} claim`, error, messages.somethingWentWrong);
  }
  if (claimed.error) {
    // Nothing was written: the claim is the first thing that happens. A 22023
    // here is the same id against another action, which is a bug in the caller
    // (schema paper, requirement 4) and must not be retried.
    return unexpectedFailure(`${where} claim`, claimed.error, messages.somethingWentWrong);
  }
  const answer = claimAnswer(claimed.data);
  if (!answer) {
    return unexpectedFailure(`${where} claim`, new Error(`unrecognised claim answer ${JSON.stringify(claimed.data)}`), messages.somethingWentWrong);
  }
  if (answer.status === "replay") {
    // The first attempt finished. Hand back exactly what it answered -- the
    // database stored the action's own result, so this is the same object the
    // first caller got, refusal included.
    return answer.result as ActionResult<R>;
  }
  if (answer.status === "in_flight") {
    // A claim that committed without a result. We do not know whether the
    // write landed, so the person is told to check. NEVER a success here.
    console.error(`[${where}] write request ${id} is in flight: claimed with no result`);
    return { ok: false, error: messages.saveUnknown };
  }

  let result: ActionResult<R>;
  try {
    result = await body();
  } catch (error) {
    unstable_rethrow(error);
    // The claim is deliberately LEFT OPEN. A throw cannot tell "the write
    // never happened" from "it happened and the answer was lost", so the next
    // attempt must read in_flight and say it cannot tell, rather than write
    // again. This is the availability cost named at the top of this block.
    return unexpectedFailure(where, error, messages.somethingWentWrong);
  }

  // The body decided, so the answer is deterministic and worth storing --
  // including a refusal, so a replay of a refused save is refused the same way
  // instead of being tried afresh.
  // A caller whose success carries a secret supplies storedAs(): what is kept for seven days is its answer, not the
  // secret, and a replay is handed that. Only a success is passed through it; a refusal holds no secret.
  const stored = result.ok && options?.storedAs ? options.storedAs(result) : result;
  const finished = await db.rpc("finish_write_request", { p_request_id: id, p_result: stored });
  if (finished.error) {
    // The write itself is done; saying otherwise would be a lie. The claim
    // stays open, so a later attempt with this id reads in_flight.
    console.error(`[${where}] finish_write_request failed for ${id}:`, finished.error);
  }
  return result;
}
