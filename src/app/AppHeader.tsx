import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
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

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNavToggle />
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white p-1">
          <Image
            src="/lca-logo.jpg"
            alt={t.header.appName}
            width={28}
            height={28}
            className="object-contain"
          />
        </span>
        <span className="text-sm font-semibold text-foreground">
          {t.header.shortName}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <span className="hidden text-sm text-muted md:inline">{user.email}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
