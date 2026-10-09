import { redirect } from "next/navigation";
import { accessRequestsAmong, listAllUsers } from "@/lib/auth/access-requests";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { TWO_STEP_PATH, SETUP_OPEN_UNTIL, hasTwoStep, isSetupOpen, trustedTotpFactors } from "@/lib/auth/two-step";
import { userNameOf } from "@/lib/auth/user-name";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n/get-t";
import { mustChangePassword } from "@/lib/auth/password-change";
import { AccessRequests, type AccessRequest } from "./AccessRequests";
import { CreateUserForm } from "./CreateUserForm";
import { UsersTable, type SecurityUser } from "./UsersTable";
import { OutreachWriters, type OutreachWriterRole } from "./OutreachWriters";

export default async function SecurityPage() {
  const currentUser = await requireAdminUser();
  // Not signed in with the authenticator app yet this session: the
  // step-up first (src/lib/auth/two-step.ts). The actions check again.
  if (!(await hasTwoStep())) redirect(TWO_STEP_PATH);
  const { t } = await getT();

  const admin = createAdminClient();

  const [authUsersResult, rolesResult, clinicsResult, doctorsResult, appRolesResult, outreachCellsResult] = await Promise.all([
    listAllUsers(admin),
    admin.from("user_roles").select("user_id, role, archived_at"),
    admin.from("clinics").select("id, name").order("name"),
    // Doctors with the clinics they work at: a doctor login's clinics are its
    // linked doctor's (0125).
    admin
      .from("doctors")
      .select("id, name, user_id, doctor_clinics(clinic_id, active)")
      .order("name"),
    // Who may write outreach notes (0169): every live role that opens the app but Admin, whose
    // column is a rule, and the one cell each holds.
    admin
      .from("roles")
      .select("id, key, name, name_th")
      .is("archived_at", null)
      .eq("opens_app", true)
      .neq("key", "admin")
      .order("name"),
    admin.from("role_permissions").select("role_id, level").eq("activity", "community.outings"),
  ]);

  const outreachLevel = new Map((outreachCellsResult.data ?? []).map((c) => [c.role_id as string, c.level as 1 | 2]));
  const outreachRoles: OutreachWriterRole[] = (appRolesResult.data ?? [])
    .map((r) => ({
      key: r.key as string,
      name: r.name as string,
      nameTh: (r.name_th as string | null) ?? null,
      level: (outreachLevel.get(r.id as string) ?? 0) as 0 | 1 | 2,
    }))
    // Management first: today's answer, and the role a manager reaches for.
    .sort((a, b) => Number(b.key === "management") - Number(a.key === "management"));

  const roleByUserId = new Map(
    (rolesResult.data ?? []).map((r) => [
      r.user_id,
      {
        role: r.role as string,
        archivedAt: (r.archived_at as string | null) ?? null,
      },
    ]),
  );
  const clinics = (clinicsResult.data ?? []).map((c) => ({ id: c.id as string, label: c.name as string }));

  const clinicName = new Map((clinicsResult.data ?? []).map((c) => [c.id as string, c.name as string]));
  type DoctorLink = { clinic_id: string; active: boolean };
  const doctorRows = (doctorsResult.data ?? []).map((d) => ({
    id: d.id as string,
    name: d.name as string,
    userId: (d.user_id as string | null) ?? null,
    clinics: ((d.doctor_clinics ?? []) as DoctorLink[])
      .filter((l) => l.active)
      .map((l) => clinicName.get(l.clinic_id) ?? "")
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)),
  }));
  const doctorByUserId = new Map(doctorRows.filter((d) => d.userId).map((d) => [d.userId as string, d]));
  const unlinkedDoctors = doctorRows
    .filter((d) => !d.userId)
    .map((d) => ({ id: d.id, name: d.name, clinics: d.clinics }));

  const authUsers = authUsersResult.users;

  // Who has an authenticator app set up. listUsers() leaves factors out
  // (getUserById() has them), so ask per login — a shelter's handful, in
  // parallel. A failed lookup shows as not set up; Reset re-checks.
  const twoStepByUserId = new Map(
    await Promise.all(
      authUsers
        .filter((u) => roleByUserId.has(u.id))
        .map(async (u) => {
          const { data } = await admin.auth.admin.mfa.listFactors({ userId: u.id });
          // Only an app Security would accept counts as set up (two-step.ts).
          const factors = data?.factors ?? [];
          return [
            u.id,
            trustedTotpFactors({ factors, app_metadata: u.app_metadata }).length > 0,
          ] as const;
        }),
    ),
  );

  // No role = can't get in. Those are the access requests (the same
  // definition System status counts); everyone else is the users table.
  const requests: AccessRequest[] = accessRequestsAmong(authUsers, roleByUserId)
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
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const users: SecurityUser[] = authUsers
    .filter((u) => roleByUserId.has(u.id))
    .map((u) => ({
      id: u.id,
      email: u.email ?? "(no email)",
      name: userNameOf(u),
      role: roleByUserId.get(u.id)?.role ?? null,
      archivedAt: roleByUserId.get(u.id)?.archivedAt ?? null,
      doctor: doctorByUserId.get(u.id)
        ? { id: doctorByUserId.get(u.id)!.id, name: doctorByUserId.get(u.id)!.name, clinics: doctorByUserId.get(u.id)!.clinics }
        : null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      mustChangePassword: mustChangePassword(u),
      twoStep: twoStepByUserId.get(u.id) ?? false,
      twoStepSetupUntil: isSetupOpen(u) ? (u.app_metadata[SETUP_OPEN_UNTIL] as string) : null,
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
          {t.admin.security.couldntLoadUsers}: {authUsersResult.error}
        </p>
      )}
      {rolesResult.error && (
        <p className="text-sm text-danger">
          {t.admin.security.couldntLoadRoles}: {rolesResult.error.message}
        </p>
      )}

      <AccessRequests requests={requests} />
      <CreateUserForm />
      <UsersTable
        users={users}
        clinics={clinics}
        unlinkedDoctors={unlinkedDoctors}
        currentUserId={currentUser.id}
      />
      <OutreachWriters roles={outreachRoles} />
    </main>
  );
}
