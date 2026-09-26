"use client";

import { ChevronDown, Menu, MessageCircle, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { FacebookIcon } from "@/components/FacebookIcon";
import { InstagramIcon } from "@/components/InstagramIcon";
import { MessengerIcon } from "@/components/MessengerIcon";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { XIcon } from "@/components/XIcon";

/** One link in the public navigation; `current` marks the page the visitor is on. */
export type PublicNavLink = { key: string; href: string; label: string; current: boolean };

/** The four top-level entries: a link, or a group ("Get involved") that opens. */
export type PublicNavEntry =
  | { kind: "link"; link: PublicNavLink }
  | { kind: "group"; key: string; label: string; links: PublicNavLink[] };

/** A way to talk to the shelter in the phone menu, as a big button. */
export type PublicTalkLink = {
  kind: "line" | "phone" | "messenger" | "whatsapp";
  href: string;
  label: string;
};

/** A place to follow the shelter in the phone menu, as an icon. */
export type PublicFollowLink = {
  kind: "facebook" | "instagram" | "x";
  href: string;
  /** Read out in place of the icon: "Lanna Care for Animals on Instagram". */
  label: string;
};

const TALK_ICONS = {
  line: MessageCircle,
  phone: Phone,
  messenger: MessengerIcon,
  whatsapp: WhatsAppIcon,
} as const;

const FOLLOW_ICONS = { facebook: FacebookIcon, instagram: InstagramIcon, x: XIcon } as const;

/**
 * Open state tied to the page it was opened on, so following a link to
 * another page closes it without an effect. A link to somewhere on the same
 * page (About & contact → #contact) closes it through onNavigate instead.
 */
function useOpenOnThisPage() {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const close = useCallback(() => setOpenOn(null), []);
  return {
    open: openOn === pathname,
    setOpen: (next: boolean) => setOpenOn(next ? pathname : null),
    close,
  };
}

/**
 * "Get involved ▾" on a computer: a button that shows its links beneath it.
 * Click (or Enter/Space) rather than hover, so it works the same by mouse,
 * keyboard and touch; Escape, a click elsewhere or tabbing past it closes it.
 */
export function PublicNavGroup({
  label,
  links,
}: {
  label: string;
  links: PublicNavLink[];
}) {
  const { open, setOpen, close } = useOpenOnThisPage();
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const current = links.some((link) => link.current);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  return (
    <div
      ref={wrapper}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          button.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (open && !wrapper.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={`flex min-h-11 items-center gap-1 whitespace-nowrap hover:text-site-action ${
          current ? "text-site-action" : ""
        }`}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          strokeWidth={2.5}
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <ul
        id={panelId}
        hidden={!open}
        className="absolute left-1/2 top-full z-40 mt-2 w-60 -translate-x-1/2 rounded-2xl border border-site-line bg-site-paper p-2 text-base font-semibold shadow-lg"
      >
        {links.map((link) => (
          <li key={link.key}>
            <Link
              href={link.href}
              aria-current={link.current ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`flex min-h-11 items-center rounded-xl px-4 hover:bg-site-sand ${
                link.current ? "text-site-action" : "text-site-ink"
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The phone's menu: a button in the header that opens the whole screen —
 * the four entries with Get involved laid open, the language toggle, and a
 * "Talk to us" panel at the foot — LINE, Call, Messenger and WhatsApp as
 * buttons, whichever are set, since on a phone those are how people
 * actually reach the shelter — then "Follow us" with Facebook, Instagram
 * and X as icons. A modal dialog: focus
 * moves in and stays in, Escape closes, the page behind doesn't scroll.
 */
export function PublicMobileMenu({
  entries,
  brand,
  donate,
  languageLabel,
  language,
  talk,
  account,
  labels,
}: {
  entries: PublicNavEntry[];
  /** The logo and short name, as the header shows them. */
  brand: ReactNode;
  donate: PublicNavLink;
  languageLabel: string;
  language: ReactNode;
  talk: {
    title: string;
    /** In order; the first is the filled button. */
    links: PublicTalkLink[];
    note: string | null;
    followTitle: string;
    follow: PublicFollowLink[];
  };
  /** Open the app / Sign out for a signed-in reader; nothing for a visitor. */
  account: ReactNode;
  labels: { open: string; close: string; menu: string; nav: string };
}) {
  const { open, setOpen } = useOpenOnThisPage();
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      closeButton.current?.focus();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
    // Back to the button that opened it — only after it was open, so the
    // first render doesn't steal focus.
    if (wasOpen.current) {
      wasOpen.current = false;
      trigger.current?.focus();
    }
  }, [open]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key !== "Tab" || !dialog.current) return;
    const focusable = dialog.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const close = () => setOpen(false);
  // `color` is the link's colour when it isn't the current page — one
  // class or the other, never both, so the stylesheet order can't decide.
  const entryLink = (link: PublicNavLink, className: string, color = "") => (
    <Link
      key={link.key}
      href={link.href}
      aria-current={link.current ? "page" : undefined}
      onClick={close}
      className={`${className} ${link.current ? "text-site-action" : color}`}
    >
      {link.label}
    </Link>
  );

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={dialogId}
        aria-label={labels.open}
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-full text-site-ink hover:bg-site-sand"
      >
        <Menu aria-hidden="true" className="h-6 w-6" />
      </button>

      {open && (
        <div
          ref={dialog}
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-label={labels.menu}
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-site-paper text-site-ink"
        >
          <div className="flex h-[68px] shrink-0 items-center justify-between gap-2 border-b border-site-line px-4">
            {brand}
            <div className="flex items-center gap-2">
              <Link
                href={donate.href}
                aria-current={donate.current ? "page" : undefined}
                onClick={close}
                className="flex h-11 items-center rounded-full bg-site-action px-[18px] text-base font-bold text-site-on-action hover:bg-site-action-hover"
              >
                {donate.label}
              </Link>
              <button
                ref={closeButton}
                type="button"
                aria-label={labels.close}
                onClick={close}
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-site-sand"
              >
                <X aria-hidden="true" className="h-6 w-6" />
              </button>
            </div>
          </div>

          <nav aria-label={labels.nav} className="flex flex-col px-5 py-3">
            {entries.map((entry) =>
              entry.kind === "link" ? (
                entryLink(
                  entry.link,
                  "flex min-h-14 items-center border-b border-site-sand text-[22px] font-bold",
                )
              ) : (
                <div key={entry.key} className="flex flex-col gap-1 border-b border-site-sand py-3.5">
                  <span className="pb-1 text-[22px] font-bold">{entry.label}</span>
                  {entry.links.map((link) =>
                    entryLink(link, "flex min-h-11 items-center pl-3.5 text-lg", "text-site-ink-soft"),
                  )}
                </div>
              ),
            )}
          </nav>

          <div className="flex flex-wrap items-center gap-3 px-5 py-2">
            <span className="text-[15px] text-site-ink-muted">{languageLabel}</span>
            {language}
          </div>
          {account && <div className="px-5 py-2">{account}</div>}

          {(talk.links.length > 0 || talk.follow.length > 0) && (
            <div className="mt-auto flex flex-col gap-3 bg-site-cream p-5">
              {talk.links.length > 0 && (
                <>
                  <span className="text-[15px] font-bold text-site-ink-muted">{talk.title}</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {talk.links.map((link, i) => {
                      const Icon = TALK_ICONS[link.kind];
                      // An odd one out at the end takes the whole row.
                      const wide = i === talk.links.length - 1 && i % 2 === 0;
                      return (
                        <a
                          key={link.kind}
                          href={link.href}
                          {...(link.kind === "phone" ? {} : { target: "_blank", rel: "noreferrer" })}
                          className={`flex h-[52px] items-center justify-center gap-2 rounded-xl text-base font-bold ${
                            i === 0
                              ? "bg-site-accent text-site-on-accent"
                              : "border-2 border-site-accent text-site-accent"
                          } ${wide ? "col-span-2" : ""}`}
                        >
                          <Icon aria-hidden="true" className="h-5 w-5" />
                          {link.label}
                        </a>
                      );
                    })}
                  </div>
                  {talk.note && <span className="text-sm text-site-ink-muted">{talk.note}</span>}
                </>
              )}
              {talk.follow.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="pr-1 text-[15px] font-bold text-site-ink-muted">
                    {talk.followTitle}
                  </span>
                  {talk.follow.map((link) => {
                    const Icon = FOLLOW_ICONS[link.kind];
                    return (
                      <a
                        key={link.kind}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={link.label}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-site-accent hover:bg-site-sand"
                      >
                        <Icon aria-hidden="true" className="h-6 w-6" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
