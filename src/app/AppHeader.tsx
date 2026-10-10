import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getT } from "@/lib/i18n/get-t";
import { getAppEnv } from "@/lib/app-env";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { SignOutButton } from "./login/SignOutButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNavToggle } from "./MobileNavToggle";
import { AccountMenu } from "./AccountMenu";
import { userNameOf } from "@/lib/auth/user-name";
import { roleKeyLabel } from "@/lib/i18n/enum-labels";

export async function AppHeader() {
  const user = await getCurrentUser();

  if (!user) return null;

  const { t, locale } = await getT();
  // The assistant opens from here so it is reachable from every screen,
  // including the phone. The doctor role does not get it (0070).
  const perms = await loadPermissions();

  // Name · role, so two logins with the same first name (or one person's
  // three test accounts) still read differently. The role is its display
  // name: a built-in role from the dictionary, a configured one from
  // roles.name / name_th. No name on the login shows the email (menu too).
  const role = perms?.role;
  const roleName = !role
    ? null
    : (role.key in t.admin.security.roles
        ? roleKeyLabel(t, role.key)
        : locale === "th" && role.nameTh
          ? role.nameTh
          : role.name) || null;

  // Production has no badge. UAT has nothing else: it keeps production's
  // colours so the customer tests the real thing (src/lib/app-env.ts).
  //
  // The badge and the strip along the header's top edge use fixed colours,
  // never the theme tokens: a person's colour theme redefines those tokens,
  // which overrides dev's teal, so this is the one marker no theme can hide
  // (docs/decisions/2026-10-10-user-colour-themes.md). Dev keeps the teal
  // everywhere under the default theme as well.
  const appEnv = getAppEnv();
  const badge =
    appEnv === "dev"
      ? { label: t.header.devBadge, title: t.header.devBadgeTitle, className: "bg-[#2dd4bf] text-[#032523] ring-1 ring-[#0b3d38]", strip: true }
      : appEnv === "uat"
        ? { label: t.header.uatBadge, title: t.header.uatBadgeTitle, className: "bg-[#ff9f0a] text-[#1a1100] ring-1 ring-[#3d2600]", strip: false }
        : null;

  return (
    <header className="relative flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-border bg-surface px-4 py-3 md:sticky md:top-0 md:z-30 md:h-[var(--app-header-h)] md:flex-nowrap md:px-6">
      {/* Dev's strip: teal and near-black diagonal bands, so one of the two
          stands out on a light header and the other on a dark one. */}
      {badge?.strip && (
        <span
          aria-hidden="true"
          data-env-strip={appEnv}
          className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[repeating-linear-gradient(135deg,#2dd4bf_0_10px,#0b3d38_10px_20px)]"
        />
      )}
      <div className="flex items-center gap-3">
        <MobileNavToggle />
        {/* The logo is the way to the public website (it left the nav
            2026-09-22). New tab, because staff are mid-task when they
            click it. */}
        <Link
          href="/"
          target="_blank"
          rel="noopener"
          title={t.nav.publicSite}
          aria-label={t.nav.publicSite}
          className="flex items-center gap-3 rounded hover:bg-surface-hover"
        >
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white p-1">
            <Image
              src="/lca-logo.jpg"
              alt=""
              width={28}
              height={28}
              className="object-contain"
            />
          </span>
          <span className="text-sm font-semibold text-foreground">
            {t.header.shortName}
          </span>
        </Link>
        {badge && (
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide ${badge.className}`}
            title={badge.title}
          >
            {badge.label}
          </span>
        )}
      </div>
      {/* Phone: the wrapper dissolves (contents) so its four controls wrap
          with the logo row. Row 1 is logo + Assistant + Sign out, row 2 is the
          language switch + account menu; at 44 px each, Sign out beside the
          switcher left it on a row of its own. From sm up it is one row, in
          the order Assistant, language, account, Sign out. */}
      <div className="contents sm:flex sm:min-w-0 sm:flex-none sm:flex-nowrap sm:items-center sm:justify-end sm:gap-4">
        {can(perms, "assistant.ask") && (
          <div className="order-1 ml-auto sm:ml-0">
            <AssistantPanel />
          </div>
        )}
        <div className="order-3 sm:order-2">
          <LanguageSwitcher />
        </div>
        <AccountMenu
          name={userNameOf(user)}
          role={roleName}
          email={user.email ?? "—"}
          // min-w-32: flex-1 has a zero basis, so with min-w-0 the menu never
          // wrapped; logins without the Assistant button (Doctor, Head of Medical)
          // got it squeezed to 15.9 px beside the logo. 8rem makes it wrap.
          className="order-4 flex min-w-32 flex-1 justify-end sm:order-3 sm:min-w-0 sm:flex-none"
        />
        <SignOutButton iconOnPhone />
      </div>
    </header>
  );
}
