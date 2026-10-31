"use client";

import { useRef } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useKeptForm } from "@/lib/use-kept-form";
import { WRITE_REQUEST_FIELD, newWriteRequestId, waitForWrite } from "@/lib/write-requests";

/**
 * Pi failover (C): useKeptForm for a form whose Server Action goes through
 * runWriteAction(), so the save can be replayed on the Worker without being
 * applied twice.
 *
 * Two things on top of useKeptForm:
 *
 *  1. The form carries a request id (WRITE_REQUEST_FIELD). The id is STABLE
 *     across retries of the same attempt: while the last press came back "we
 *     could not tell", the next press reuses it, so the database answers with
 *     the first attempt's own result if there was one. Once a press comes back
 *     with a real answer -- saved or refused -- the next press is a new
 *     attempt and gets a new id.
 *  2. The browser stops waiting after WRITE_WAIT_MS and says it cannot tell,
 *     rather than spinning forever against a wedged Pi.
 *
 * Use it for every form on a page that is (or is about to be) on
 * WRAPPED_WRITE_PATHS; use useKeptForm for everything else.
 */
export function useWriteForm<State extends object | undefined>(
  action: (state: Awaited<State>, payload: FormData) => State | Promise<State>,
  initialState: Awaited<State>,
) {
  const { t } = useI18n();
  const idRef = useRef<string | null>(null);
  const cannotTell = () => ({ ok: false as const, error: t.common.saveUnknown }) as unknown as Awaited<State>;

  return useKeptForm<State>(
    async (prev, payload) => {
      const next = await waitForWrite(async () => await action(prev, payload), cannotTell);
      // Keep the id only while we still do not know what happened.
      const unknown =
        typeof next === "object" && next !== null && (next as { error?: unknown }).error === t.common.saveUnknown;
      if (!unknown) idRef.current = null;
      return next as Awaited<State>;
    },
    initialState,
    () => {
      idRef.current ??= newWriteRequestId();
      return { [WRITE_REQUEST_FIELD]: idRef.current };
    },
  );
}

/**
 * The same two things for a write that is called directly rather than
 * submitted as a form (a row's Archive or Save button, say).
 *
 *   const save = useWriteCall();
 *   const result = await save((id) => updateUnit(unit.id, id, fields));
 *
 * The id is stable across retries of the same attempt on the same rule as
 * useWriteForm: it is kept while the answer is "we could not tell".
 *
 * ONE PER ACTION. Two different writes must not share a useWriteCall: an id
 * kept from an unknown Save and then sent to Archive is the same id against a
 * different action, which claim_write_request() refuses outright, as it should
 * (the schema paper, requirement 4).
 */
export function useWriteCall() {
  const { t } = useI18n();
  const idRef = useRef<string | null>(null);

  return async function save<R extends { ok: boolean; error?: string }>(
    call: (requestId: string) => Promise<R>,
  ): Promise<R | { ok: false; error: string }> {
    idRef.current ??= newWriteRequestId();
    const requestId = idRef.current;
    const cannotTell = () => ({ ok: false as const, error: t.common.saveUnknown });
    const next = await waitForWrite<R | { ok: false; error: string }>(() => call(requestId), cannotTell);
    if (!(next.ok === false && next.error === t.common.saveUnknown)) idRef.current = null;
    return next;
  };
}
