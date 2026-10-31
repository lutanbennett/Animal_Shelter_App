"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { BackLink } from "@/components/BackLink";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * The client shell around one page's editor, which used to be a native modal <dialog>
 * on the Pages tab and is now a page of its own in the standard admin frame.
 *
 * It carries the one thing the popup had that a page does not get for free: leaving with
 * typing you have not saved asks first. The popup could ask on its close button; a page
 * is left by any link, so the guard is the same pair AddPhotosFlow uses — the browser's
 * own prompt for a reload or a closed tab, and ours for a link inside the app, captured
 * before the router sees the click. `window.confirm` rather than the app's ConfirmProvider
 * because preventing the navigation has to happen synchronously inside the click, and the
 * provider's dialog is awaited.
 *
 * Only the page's own text is watched (`children`): the photo controls beside it save on
 * their own press, so typing a photo description and saving it must not leave the page
 * looking unsaved.
 */
export function PageEditPanel({
  backHref,
  children,
  photo,
}: {
  backHref: string;
  /** The page's title and body editor. Typing in here is what counts as unsaved. */
  children: ReactNode;
  /** The photo beside this page's heading, for the pages that take one. */
  photo?: ReactNode;
}) {
  const { t } = useI18n();
  const p = t.admin.website.pages;
  const dirty = useRef(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Saving clears it: the editor marks its success message with data-save-ok, the same
  // signal the popup watched for.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const watch = new MutationObserver(() => {
      if (el.querySelector("[data-save-ok]")) dirty.current = false;
    });
    watch.observe(el, { childList: true, subtree: true });
    return () => watch.disconnect();
  }, []);

  useEffect(() => {
    const message = p.leaveConfirm;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (!dirty.current) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      // Another site, or this same page: the browser's own prompt covers the first and the
      // second goes nowhere.
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [p.leaveConfirm]);

  return (
    <>
      <BackLink href={backHref}>{p.back}</BackLink>
      <div
        ref={editorRef}
        onInput={() => {
          dirty.current = true;
        }}
      >
        {children}
      </div>
      {photo}
    </>
  );
}
