import Image from "next/image";
import { getT } from "@/lib/i18n/get-t";
import { LoginForm } from "./LoginForm";
import { LanguageSwitcher } from "../LanguageSwitcher";

export default async function LoginPage() {
  const { t } = await getT();

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
        <LoginForm />
      </div>
    </div>
  );
}
