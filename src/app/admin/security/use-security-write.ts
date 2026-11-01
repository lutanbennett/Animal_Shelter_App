"use client";

import { useRef } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { newWriteRequestId, waitForWrite } from "@/lib/write-requests";

/**
 * Pi failover (D): the request id and the wait limit for the Security screens' direct action calls, which are many
 * different writes on one component (useWriteCall is one-per-action, and these rows hold twelve).
 *
 *   const send = useSecurityWrite();
 *   const result = await send(`archive:${user.id}`, (id) => archiveUser(user.id, id));
 *
 * `key` names the action AND what it was aimed at, because an id kept from a "could not tell" press and then sent
 * for a different login or a different action is refused by claim_write_request(). The id is kept only while the
 * last answer was "could not tell"; any real answer, saved or refused, retires it.
 */
export function useSecurityWrite() {
  const { t } = useI18n();
  const ids = useRef(new Map<string, string>());

  return async function send<R extends { ok: boolean; error?: string }>(
    key: string,
    call: (requestId: string) => Promise<R>,
  ): Promise<R | { ok: false; error: string }> {
    const id = ids.current.get(key) ?? newWriteRequestId();
    ids.current.set(key, id);
    const cannotTell = () => ({ ok: false as const, error: t.common.saveUnknown });
    const next = await waitForWrite<R | { ok: false; error: string }>(() => call(id), cannotTell);
    if (!(next.ok === false && next.error === t.common.saveUnknown)) ids.current.delete(key);
    return next;
  };
}
