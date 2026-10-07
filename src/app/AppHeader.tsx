import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { t, locale } = await getT();
  // The assistant opens from here so it is reachable from every screen,
  // including the phone. The vet role does not get it (0070).
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
  const appEnv = getAppEnv();
  const badge =
    appEnv === "dev"
      ? { label: t.header.devBadge, title: t.header.devBadgeTitle }
      : appEnv === "uat"
        ? { label: t.header.uatBadge, title: t.header.uatBadgeTitle }
        : null;

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:px-6">
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
            className="rounded bg-primary px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-primary-foreground"
            title={badge.title}
          >
            {badge.label}
          </span>
        )}
      </div>
      {/* Tighter on a phone: this row gained the assistant button, and at
          375px the old gap-4 pushed "Sign out" off the edge. */}
      <div className="flex items-center gap-2 sm:gap-4">
        {can(perms, "assistant.ask") && <AssistantPanel />}
        <LanguageSwitcher />
        <AccountMenu name={userNameOf(user)} role={roleName} email={user.email ?? "—"} />
        <SignOutButton iconOnPhone />
      </div>
    </header>
  );
}
