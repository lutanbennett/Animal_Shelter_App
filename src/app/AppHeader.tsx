import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { getAppEnv } from "@/lib/app-env";
import { canUseAssistant } from "@/lib/assistant/data";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { SignOutButton } from "./login/SignOutButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNavToggle } from "./MobileNavToggle";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { t } = await getT();
  // The assistant opens from here so it is reachable from every screen,
  // including the phone. The vet role does not get it (0070).
  const { data: role } = await supabase.rpc("current_user_role");

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
        {getAppEnv() === "dev" && (
          <span
            className="rounded bg-primary px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-primary-foreground"
            title={t.header.devBadgeTitle}
          >
            {t.header.devBadge}
          </span>
        )}
      </div>
      {/* Tighter on a phone: this row gained the assistant button, and at
          375px the old gap-4 pushed "Sign out" off the edge. */}
      <div className="flex items-center gap-2 sm:gap-4">
        {canUseAssistant(role) && <AssistantPanel />}
        <LanguageSwitcher />
        <span className="hidden text-sm text-muted md:inline">
          {user.email}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
