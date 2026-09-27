import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getAssuranceLevel } from "@/lib/auth/two-step";
import { getT } from "@/lib/i18n/get-t";
import { TwoStepForm } from "./TwoStepForm";

/**
 * The step-up in front of Settings → Security (src/lib/auth/two-step.ts):
 * not a new sign-in, just the second step on the session you have, however
 * you signed in. The first visit sets up an authenticator app; after that
 * it asks for the current code and goes back to Security.
 */
export default async function TwoStepPage() {
  await requireAdminUser();
  const level = await getAssuranceLevel();
  if (level.current === "aal2") redirect("/admin/security");

  const { t } = await getT();
  const s = t.admin.security.twoStep;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {level.enrolled ? s.codeTitle : s.setupTitle}
        </h1>
        <p className="max-w-prose text-sm text-muted">
          {level.enrolled ? s.codeSubtitle : s.setupSubtitle}
        </p>
      </div>

      <TwoStepForm enrolled={level.enrolled} />

      <p className="max-w-prose text-xs text-muted">{s.lostPhone}</p>
      <div>
        <Link href="/admin" className="text-sm text-muted underline hover:text-foreground">
          {s.backToSettings}
        </Link>
      </div>
    </main>
  );
}
