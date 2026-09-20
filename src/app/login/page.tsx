import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getT } from "@/lib/i18n/get-t";
import { LoginForm } from "./LoginForm";
import { LanguageSwitcher } from "../LanguageSwitcher";

/** ?error= codes set by src/app/auth/callback/route.ts and signInWithGoogle(). */
const ERROR_CODES = ["no_role", "google"] as const;
type ErrorCode = (typeof ERROR_CODES)[number];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { t } = await getT();
  const { error } = await searchParams;
  const errorMessage =
    error && ERROR_CODES.includes(error as ErrorCode)
      ? error === "no_role"
        ? t.login.errors.noRole
        : t.login.errors.google
      : undefined;

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white p-2">
            <Image
              src="/lca-logo.jpg"
              alt={t.login.heading}
              width={72}
              height={72}
              className="object-contain"
              priority
            />
          </span>
          <h1 className="text-xl font-semibold text-foreground">
            {t.login.heading}
          </h1>
        </div>
        <LoginForm error={errorMessage} />
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t.login.backToHome}
        </Link>
      </div>
    </div>
  );
}
