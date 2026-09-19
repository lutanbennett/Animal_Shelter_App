"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="text-sm font-medium text-muted hover:text-foreground"
    >
      {t.header.signOut}
    </button>
  );
}
