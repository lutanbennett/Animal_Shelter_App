"use client";

import { useRef } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useKeptForm } from "@/lib/use-kept-form";
import { WRITE_REQUEST_FIELD, newWriteRequestId } from "@/lib/write-requests";
import { cannotTellResult, guardWrite, type CannotTell } from "@/lib/write-unknown";

/** The browser half of guardWrite's options, with the words from the dictionary. */
export function useCannotTellGuard() {
  const { t } = useI18n();
  return {
    confirmReload: () => window.confirm(t.common.saveReloadConfirm),
    reload: () => window.location.reload(),
  };
}

/**
 * Pi failover (C): useKeptForm for a form whose Server Action goes through
 * runWriteAction(), so the save can be replayed on the Worker without being
 * applied twice.
 *
 * Two things on top of useKeptForm:
 *
 *  1. The form carries a request id (WRITE_REQUEST_FIELD). The id is STABLE
 *     across retries of the same attempt: while the last press came back "we
 *     could not tell", the id is kept, so the database could answer with the
 *     first attempt's own result. Once a press comes back with a real answer --
 *     saved or refused -- the next press is a new attempt and gets a new id.
 *     The id is NEVER replaced after "could not tell": a new one would re-run a
 *     write that may already have landed. But pressing again can only get the
 *     same "in flight" answer, so guardWrite (write-unknown.ts) sends nothing
 *     on the next press and offers a reload instead.
 *  2. The browser stops waiting after WRITE_WAIT_MS and says it cannot tell,
 *     rather than spinning forever against a wedged Pi.
 *
 * "Could not tell" is the TAG cannotTell: true on the result, never its words.
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
  const unknownRef = useRef(false);
  const guard = useCannotTellGuard();

  return useKeptForm<State>(
    async (prev, payload) => {
      const next = await guardWrite(unknownRef, async () => await action(prev, payload), {
        ...guard,
        cannotTell: () => cannotTellResult(t.common.saveUnknown) as unknown as Awaited<State>,
        stillUnknown: () => cannotTellResult(t.common.saveStillUnknown) as unknown as Awaited<State>,
      });
      // Keep the id only while we still do not know what happened.
      if (!unknownRef.current) idRef.current = null;
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
 * useWriteForm: it is kept while the answer is "we could not tell", and the
 * next press sends nothing and offers a reload.
 *
 * ONE PER ACTION. Two different writes must not share a useWriteCall: an id
 * kept from an unknown Save and then sent to Archive is the same id against a
 * different action, which claim_write_request() refuses outright, as it should
 * (the schema paper, requirement 4).
 */
export function useWriteCall() {
  const { t } = useI18n();
  const idRef = useRef<string | null>(null);
  const unknownRef = useRef(false);
  const guard = useCannotTellGuard();

  return async function save<R extends { ok: boolean; error?: string }>(
    call: (requestId: string) => Promise<R>,
  ): Promise<R | CannotTell> {
    idRef.current ??= newWriteRequestId();
    const requestId = idRef.current;
    const next = await guardWrite<R | CannotTell>(unknownRef, () => call(requestId), {
      ...guard,
      cannotTell: () => cannotTellResult(t.common.saveUnknown),
      stillUnknown: () => cannotTellResult(t.common.saveStillUnknown),
    });
    if (!unknownRef.current) idRef.current = null;
    return next;
  };
}
