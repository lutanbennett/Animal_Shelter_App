import Image from "next/image";
import Link from "next/link";
import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { hasPublicFriends } from "@/lib/shelter-friends/public";
import { loadSiteContent, socialLinks } from "@/lib/site/content";
import { FacebookIcon } from "@/components/FacebookIcon";
import { LanguageSwitcher } from "../LanguageSwitcher";

export type PublicSection =
  | "home"
  | "adopt"
  | "our-work"
  | "foster"
  | "volunteer"
  | "donate"
  | "friends";

/**
 * Header for the signed-out public pages. `current` marks the section the
 * visitor is in so its link reads as a heading rather than a way out.
 * Donate is a button rather than a link — the one thing every page of a
 * shelter site asks for (RSPCA ACT does the same).
 */
export async function PublicHeader({ current }: { current?: PublicSection }) {
  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const [
    {
      data: { user },
    },
    showFriends,
    site,
  ] = await Promise.all([supabase.auth.getUser(), hasPublicFriends(), loadSiteContent(supabase)]);
  // Facebook is where most of the shelter's supporters are, so its link
  // sits in the header too — on a computer only; a phone's header is
  // already full, and the footer has it.
  const facebook = socialLinks(site).facebook;
  // Shelter Friends is listed once there is someone to thank — or while
  // the visitor is on /friends itself, so the current page stays marked.
  const sections: { key: PublicSection; href: string; label: string }[] = [
    { key: "adopt", href: "/adopt", label: t.adopt.adoptNav },
    { key: "our-work", href: "/our-work", label: t.adopt.ourWorkNav },
    { key: "foster", href: "/foster", label: t.adopt.fosterNav },
    { key: "volunteer", href: "/volunteer", label: t.adopt.volunteerNav },
    ...(showFriends || current === "friends"
      ? [{ key: "friends" as const, href: "/friends", label: t.shelterFriends.navLabel }]
      : []),
  ];

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border bg-surface px-6 py-4">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white p-1">
          <Image
            src="/lca-logo.jpg"
            alt={t.header.appName}
            width={36}
            height={36}
            className="object-contain"
            priority={current === "home"}
          />
        </span>
        <span className="text-base font-semibold text-foreground">
          {t.header.appName}
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {current !== "home" && (
            <Link
              href="/"
              className="hidden whitespace-nowrap text-sm font-medium text-muted hover:text-foreground sm:inline"
            >
              {t.adopt.home}
            </Link>
          )}
          {sections.map((section) => (
            <Link
              key={section.key}
              href={section.href}
              aria-current={section.key === current ? "page" : undefined}
              className={`whitespace-nowrap text-sm font-medium hover:text-foreground ${
                section.key === current ? "text-foreground" : "text-muted"
              }`}
            >
              {section.label}
            </Link>
          ))}
          <Link
            href="/donate"
            aria-current={current === "donate" ? "page" : undefined}
            className="whitespace-nowrap rounded bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            {t.adopt.donateNav}
          </Link>
        </nav>
        {facebook && (
          <a
            href={facebook}
            target="_blank"
            rel="noreferrer"
            aria-label={t.publicFooter.facebook}
            className="hidden text-muted hover:text-foreground sm:inline-flex"
          >
            <FacebookIcon aria-hidden="true" className="h-5 w-5" />
          </a>
        )}
        <LanguageSwitcher />
        <Link
          href={user ? "/residents" : "/login"}
          className="whitespace-nowrap rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {user ? t.adopt.openApp : t.adopt.staffLogin}
        </Link>
      </div>
    </header>
  );
}
