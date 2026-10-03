"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function SignOutButton({
  className,
  iconOnPhone = false,
}: {
  className?: string;
  /** App header: an icon below sm, the words from sm up. In Thai the words
   *  ("ออกจากระบบ") ran 10px past the edge at 375px on every page (F-07);
   *  the Assistant button beside it does the same. */
  iconOnPhone?: boolean;
}) {
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
      title={iconOnPhone ? t.header.signOut : undefined}
      aria-label={iconOnPhone ? t.header.signOut : undefined}
      className={className ?? "whitespace-nowrap text-sm font-medium text-muted hover:text-foreground"}
    >
      {iconOnPhone ? (
        <>
          <LogOut aria-hidden="true" className="h-5 w-5 sm:hidden" />
          <span className="hidden sm:inline">{t.header.signOut}</span>
        </>
      ) : (
        t.header.signOut
      )}
    </button>
  );
}
