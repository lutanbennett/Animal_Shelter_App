"use client";

import { useRef } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCannotTellGuard } from "@/lib/use-write-form";
import { newWriteRequestId } from "@/lib/write-requests";
import { cannotTellResult, guardWrite, type CannotTell } from "@/lib/write-unknown";

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
  const unknown = useRef(new Map<string, { current: boolean }>());
  const guard = useCannotTellGuard();

  return async function send<R extends { ok: boolean; error?: string }>(
    key: string,
    call: (requestId: string) => Promise<R>,
  ): Promise<R | CannotTell> {
    const id = ids.current.get(key) ?? newWriteRequestId();
    ids.current.set(key, id);
    const lock = unknown.current.get(key) ?? { current: false };
    unknown.current.set(key, lock);
    const next = await guardWrite<R | CannotTell>(lock, () => call(id), {
      ...guard,
      cannotTell: () => cannotTellResult(t.common.saveUnknown),
      stillUnknown: () => cannotTellResult(t.common.saveStillUnknown),
    });
    if (!lock.current) ids.current.delete(key);
    return next;
  };
}
