import Image from "next/image";
import Link from "next/link";
import { getT } from "@/lib/i18n/get-t";
import { LanguageSwitcher } from "../LanguageSwitcher";

export async function PublicHeader() {
  const { t } = await getT();

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white p-1">
          <Image
            src="/lca-logo.jpg"
            alt={t.header.appName}
            width={36}
            height={36}
            className="object-contain"
          />
        </span>
        <span className="text-base font-semibold text-foreground">
          {t.header.appName}
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <Link
          href="/"
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          {t.adopt.home}
        </Link>
        <Link
          href="/login"
          className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {t.adopt.staffLogin}
        </Link>
      </div>
    </header>
  );
}
