"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/i18n/set-locale";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/locales";

const TONES = {
  app: {
    group: "gap-0.5 border-border bg-background p-0.5 text-xs font-medium",
    button: "rounded-full px-2.5 py-1",
    on: "bg-primary text-primary-foreground",
    off: "text-muted hover:text-foreground",
  },
  // The public site (globals.css, "Public site"): ink for the chosen
  // language, as in the mockups, and 44px segments to tap on a phone.
  site: {
    group: "overflow-hidden border-site-line-strong text-sm font-semibold",
    button: "flex min-h-11 min-w-12 items-center justify-center px-4",
    on: "bg-site-ink text-site-paper",
    off: "text-site-ink hover:bg-site-sand",
  },
} as const;

export function LanguageSwitcher({ tone = "app" }: { tone?: keyof typeof TONES }) {
  const style = TONES[tone];
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
    <div className={`flex items-center rounded-full border ${style.group}`}>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleChange("en")}
        aria-pressed={locale === "en"}
        className={`transition disabled:opacity-50 ${style.button} ${
          locale === "en" ? style.on : style.off
        }`}
      >
        EN
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleChange("th")}
        aria-pressed={locale === "th"}
        className={`transition disabled:opacity-50 ${style.button} ${
          locale === "th" ? style.on : style.off
        }`}
      >
        ไทย
      </button>
    </div>
  );
}
