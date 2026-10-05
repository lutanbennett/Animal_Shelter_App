import Link from "next/link";
import { BackLink } from "@/components/BackLink";
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
          {level.enrolled ? s.codeTitle : level.setupOpen ? s.setupTitle : s.setupClosedTitle}
        </h1>
        <p className="max-w-prose text-sm text-muted">
          {level.enrolled ? s.codeSubtitle : level.setupOpen ? s.setupSubtitle : null}
        </p>
      </div>

      {level.enrolled || level.setupOpen ? (
        <TwoStepForm enrolled={level.enrolled} />
      ) : (
        // A password alone can't bind a first app: an admin opens set-up (two-step.ts).
        <p className="max-w-prose rounded-lg border border-border bg-surface p-4 text-sm text-foreground">
          {s.setupClosed}
        </p>
      )}

      <p className="max-w-prose text-xs text-muted">{s.lostPhone}</p>
      <div>
        <BackLink href="/admin">{s.backToSettings}</BackLink>
      </div>
    </main>
  );
}
