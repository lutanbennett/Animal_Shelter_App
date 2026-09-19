import { requireAdminUser } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n/get-t";
import { CreateUserForm } from "./CreateUserForm";
import { UsersTable, type SecurityUser } from "./UsersTable";

export default async function SecurityPage() {
  const currentUser = await requireAdminUser();
  const { t } = await getT();

  const admin = createAdminClient();

  const [authUsersResult, rolesResult] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 200 }),
    admin.from("user_roles").select("user_id, role"),
  ]);

  const roleByUserId = new Map(
    (rolesResult.data ?? []).map((r) => [r.user_id, r.role as string]),
  );

  const users: SecurityUser[] = (authUsersResult.data?.users ?? [])
    .map((u) => ({
      id: u.id,
      email: u.email ?? "(no email)",
      role: roleByUserId.get(u.id) ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));

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

      <CreateUserForm />
      <UsersTable users={users} currentUserId={currentUser.id} />
    </main>
  );
}
