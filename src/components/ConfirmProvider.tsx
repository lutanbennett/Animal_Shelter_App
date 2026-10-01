"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type ConfirmOptions = {
  /** Names the thing: "Delete Panda's blood test from 12 March?" beats "Are you sure?". */
  body: string;
  title?: string;
  consequences?: string[];
  confirmLabel?: string;
};

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/**
 * `await confirm({ body })` in place of `window.confirm(body)`.
 *
 * window.confirm focuses OK, so a stray Enter confirms a delete; this
 * opens ConfirmDialog, which focuses Cancel. One dialog is mounted for the
 * whole app and every caller shares it.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((next) => {
    resolver.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOptions(next);
    });
  }, []);

  const settle = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  }, []);
  const cancel = useCallback(() => settle(false), [settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={options !== null}
        title={options?.title ?? t.common.areYouSure}
        body={options?.body ?? ""}
        consequences={options?.consequences}
        confirmLabel={options?.confirmLabel ?? t.common.confirm}
        onCancel={cancel}
        onConfirm={() => settle(true)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}
