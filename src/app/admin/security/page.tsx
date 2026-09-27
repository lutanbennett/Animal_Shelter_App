import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { TWO_STEP_PATH, hasTwoStep, isVerifiedTotp } from "@/lib/auth/two-step";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n/get-t";
import { mustChangePassword } from "@/lib/auth/password-change";
import { AccessRequests, type AccessRequest } from "./AccessRequests";
import { CreateUserForm } from "./CreateUserForm";
import { UsersTable, type SecurityUser } from "./UsersTable";

export default async function SecurityPage() {
  const currentUser = await requireAdminUser();
  // Not signed in with the authenticator app yet this session: the
  // step-up first (src/lib/auth/two-step.ts). The actions check again.
  if (!(await hasTwoStep())) redirect(TWO_STEP_PATH);
  const { t } = await getT();

  const admin = createAdminClient();

  const [authUsersResult, rolesResult, vetsResult] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 200 }),
    admin.from("user_roles").select("user_id, role, archived_at, vet_id"),
    admin.from("vets").select("id, name, clinic_name").order("name"),
  ]);

  const roleByUserId = new Map(
    (rolesResult.data ?? []).map((r) => [
      r.user_id,
      {
        role: r.role as string,
        archivedAt: (r.archived_at as string | null) ?? null,
        vetId: (r.vet_id as string | null) ?? null,
      },
    ]),
  );
  const clinics = (vetsResult.data ?? []).map((v) => ({
    id: v.id as string,
    label: v.clinic_name ? `${v.name} — ${v.clinic_name}` : (v.name as string),
  }));

  const authUsers = authUsersResult.data?.users ?? [];

  // Who has an authenticator app set up. listUsers() leaves factors out
  // (getUserById() has them), so ask per login — a shelter's handful, in
  // parallel. A failed lookup shows as not set up; Reset re-checks.
  const twoStepByUserId = new Map(
    await Promise.all(
      authUsers
        .filter((u) => roleByUserId.has(u.id))
        .map(async (u) => {
          const { data } = await admin.auth.admin.mfa.listFactors({ userId: u.id });
          return [u.id, (data?.factors ?? []).some(isVerifiedTotp)] as const;
        }),
    ),
  );

  // No role = can't get in. Those are the access requests; everyone else
  // is the users table.
  const requests: AccessRequest[] = authUsers
    .filter((u) => !roleByUserId.has(u.id))
    .map((u) => ({
      id: u.id,
      email: u.email ?? "(no email)",
      name:
        (typeof u.user_metadata?.full_name === "string" && u.user_metadata.full_name) ||
        (typeof u.user_metadata?.name === "string" && u.user_metadata.name) ||
        null,
      provider: typeof u.app_metadata?.provider === "string" ? u.app_metadata.provider : "email",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => (b.lastSignInAt ?? b.createdAt).localeCompare(a.lastSignInAt ?? a.createdAt));

  const users: SecurityUser[] = authUsers
    .filter((u) => roleByUserId.has(u.id))
    .map((u) => ({
      id: u.id,
      email: u.email ?? "(no email)",
      role: roleByUserId.get(u.id)?.role ?? null,
      archivedAt: roleByUserId.get(u.id)?.archivedAt ?? null,
      vetId: roleByUserId.get(u.id)?.vetId ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      mustChangePassword: mustChangePassword(u),
      twoStep: twoStepByUserId.get(u.id) ?? false,
    }))
    // People who have left (0063) sit under the current team.
    .sort(
      (a, b) =>
        Number(!!a.archivedAt) - Number(!!b.archivedAt) || a.email.localeCompare(b.email),
    );

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.admin.security.title}
        </h1>
        <p className="text-sm text-muted">{t.admin.security.subtitle}</p>
      </div>

      {authUsersResult.error && (
        <p className="text-sm text-danger">
          {t.admin.security.couldntLoadUsers}: {authUsersResult.error.message}
        </p>
      )}
      {rolesResult.error && (
        <p className="text-sm text-danger">
          {t.admin.security.couldntLoadRoles}: {rolesResult.error.message}
        </p>
      )}

      <AccessRequests requests={requests} />
      <CreateUserForm />
      <UsersTable users={users} clinics={clinics} currentUserId={currentUser.id} />
    </main>
  );
}
