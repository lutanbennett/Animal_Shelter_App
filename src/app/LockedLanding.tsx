import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { getT } from "@/lib/i18n/get-t";
import { LanguageSwitcher } from "./LanguageSwitcher";

/**
 * What "/" shows a signed-out visitor while the public site is locked
 * (src/lib/public-site.ts): who this is, that it isn't open yet, and the
 * way in. Deliberately reads nothing from the database and no Drive
 * photos — only the static logo — so a stranger learns nothing about the
 * residents. A page rather than a redirect because Google's OAuth consent
 * screen lists the homepage, and a link to /privacy for the same reason.
 */
export async function LockedLanding() {
  const { t } = await getT();

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <LanguageSwitcher />
        <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white p-2">
          <Image
            src="/lca-logo.jpg"
            alt={t.header.appName}
            width={88}
            height={88}
            className="object-contain"
            priority
          />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{t.header.appName}</h1>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t.login.locked.title}
          </p>
        </div>
        <p className="text-base text-muted">{t.login.locked.body}</p>
        <div className="flex w-full flex-col items-center gap-2">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {t.login.signIn}
          </Link>
          <p className="text-xs text-muted">{t.login.locked.signInHint}</p>
        </div>
        <Link href="/privacy" className="text-xs text-muted underline hover:text-foreground">
          {t.privacy.nav}
        </Link>
      </div>
    </main>
  );
}
