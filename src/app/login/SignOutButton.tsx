"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();

  // whitespace-nowrap: the header gained the assistant button, and at
  // phone width "Sign out" was the thing that broke onto a second line.
  return (
    <button
      type="button"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className={className ?? "whitespace-nowrap text-sm font-medium text-muted hover:text-foreground"}
    >
      {t.header.signOut}
    </button>
  );
}
