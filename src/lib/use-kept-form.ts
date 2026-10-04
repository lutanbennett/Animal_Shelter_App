"use client";

import {
  startTransition,
  useActionState,
  useRef,
  type FormEvent,
} from "react";

/** A Server Action's refusal: anything handed back with an `error` sentence. */
function isRefusal(state: unknown): boolean {
  return (
    typeof state === "object" &&
    state !== null &&
    "error" in state &&
    Boolean((state as { error?: unknown }).error)
  );
}

/**
 * `useActionState` for a form that keeps what was typed when the server
 * says no (backlog F-10, docs/decisions/2026-10-04-refused-save-keeps-the-form.md).
 *
 * React 19 resets every field of a `<form action={…}>` once the action
 * finishes, refused or not: typed text goes back to its defaultValue and a
 * controlled picker's DOM falls out of step with its state (an empty select
 * under a stale "0 / 4 · Space available"). So the form is submitted from
 * `onSubmit` instead, which React leaves alone, and the reset it would have
 * done is done here only when the action did not come back refused.
 *
 *   const [state, onSubmit, pending] = useKeptForm(createThing, undefined);
 *   <form onSubmit={onSubmit}> …
 *
 * Use it for every form that submits a Server Action; never `action={…}`.
 */
export function useKeptForm<State, Payload extends FormData = FormData>(
  action: (state: Awaited<State>, payload: Payload) => State | Promise<State>,
  initialState: Awaited<State>,
) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, dispatch, pending] = useActionState(
    async (prev: Awaited<State>, payload: Payload) => {
      const next = await action(prev, payload);
      if (!isRefusal(next)) formRef.current?.reset();
      return next;
    },
    initialState,
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    formRef.current = form;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(
      form,
      submitter instanceof HTMLElement &&
        (submitter instanceof HTMLButtonElement ||
          submitter instanceof HTMLInputElement)
        ? submitter
        : undefined,
    ) as Payload;
    startTransition(() => dispatch(data));
  }

  return [state, onSubmit, pending] as const;
}
