import { requireAdminUser } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n/get-t";
import { mustChangePassword } from "@/lib/auth/password-change";
import { AccessRequests, type AccessRequest } from "./AccessRequests";
import { CreateUserForm } from "./CreateUserForm";
import { UsersTable, type SecurityUser } from "./UsersTable";

export default async function SecurityPage() {
  const currentUser = await requireAdminUser();
  const { t } = await getT();

  const admin = createAdminClient();

  const [authUsersResult, rolesResult] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 200 }),
    admin.from("user_roles").select("user_id, role, archived_at"),
  ]);

  const roleByUserId = new Map(
    (rolesResult.data ?? []).map((r) => [
      r.user_id,
      { role: r.role as string, archivedAt: (r.archived_at as string | null) ?? null },
    ]),
  );

  const authUsers = authUsersResult.data?.users ?? [];

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
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      mustChangePassword: mustChangePassword(u),
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
      <UsersTable users={users} currentUserId={currentUser.id} />
    </main>
  );
}
