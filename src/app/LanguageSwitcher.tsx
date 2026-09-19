"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/i18n/set-locale";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/locales";

export function LanguageSwitcher() {
  const { locale } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: Locale) {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5 text-xs font-medium">
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleChange("en")}
        aria-pressed={locale === "en"}
        className={`rounded-full px-2.5 py-1 transition disabled:opacity-50 ${
          locale === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleChange("th")}
        aria-pressed={locale === "th"}
        className={`rounded-full px-2.5 py-1 transition disabled:opacity-50 ${
          locale === "th"
            ? "bg-primary text-primary-foreground"
            : "text-muted hover:text-foreground"
        }`}
      >
        ไทย
      </button>
    </div>
  );
}
