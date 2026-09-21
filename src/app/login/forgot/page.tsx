import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getT } from "@/lib/i18n/get-t";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

/** "Forgot password?" from the login page: ask for a recovery email. */
export default async function ForgotPasswordPage() {
  const { t } = await getT();
  const f = t.login.forgot;

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white p-2">
            <Image src="/lca-logo.jpg" alt={t.login.heading} width={72} height={72} className="object-contain" priority />
          </span>
          <h1 className="text-xl font-semibold text-foreground">{f.title}</h1>
          <p className="text-center text-sm text-muted">{f.subtitle}</p>
        </div>
        <ForgotPasswordForm />
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {f.backToLogin}
        </Link>
      </div>
    </div>
  );
}
