import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getT } from "@/lib/i18n/get-t";
import { loadSiteContent } from "@/lib/site/content";
import { createClient } from "@/lib/supabase/server";
import { LanguageSwitcher } from "../../LanguageSwitcher";
import { signInWithGoogle } from "../actions";
import { GoogleButton } from "../LoginForm";

/**
 * "Request access" from the login page. There is no separate mechanism:
 * Continue with Google with an account that has no role already creates
 * the auth.users row that shows under Access requests on Settings →
 * Security, and the callback refuses the session as always. This page
 * only says so — and sends people with no Google account to the shelter,
 * since email logins are created by an administrator.
 */
export default async function RequestAccessPage() {
  const { t } = await getT();
  const r = t.login.request;
  const site = await loadSiteContent(await createClient());
  const email = site?.contact_email?.trim();

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
          <h1 className="text-xl font-semibold text-foreground">{r.title}</h1>
          <p className="text-center text-sm text-muted">{r.intro}</p>
        </div>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-foreground">
          <li>{r.step1}</li>
          <li>{r.step2}</li>
          <li>{r.step3}</li>
        </ol>
        <form action={signInWithGoogle}>
          <GoogleButton label={t.login.continueWithGoogle} />
        </form>
        <p className="text-sm text-muted">
          {r.noGoogle}
          {email ? (
            <>
              {": "}
              <a href={`mailto:${email}`} className="font-medium text-primary hover:underline">
                {email}
              </a>
            </>
          ) : (
            "."
          )}
        </p>
        <Link
          href="/login"
          className="flex min-h-11 items-center justify-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {r.backToLogin}
        </Link>
      </div>
    </div>
  );
}
