// Gives a login a role by its KEY, for the check harnesses that make throwaway logins through the Data API.
// user_roles holds role_id and nothing else since perm-drop-enum (0181); a harness used to write the enum.
//
//   const { error } = await giveRole(service, userId, "management");
//   const { error } = await giveRole(service, userId, "staff", { archived_at: new Date().toISOString() });
export async function giveRole(service, userId, roleKey, extra = {}) {
  const { data: role, error: lookupError } = await service.from("roles").select("id").eq("key", roleKey).maybeSingle();
  if (lookupError) return { error: lookupError };
  if (!role) return { error: { message: `no role with key ${roleKey}` } };
  return service.from("user_roles").insert({ user_id: userId, role_id: role.id, ...extra });
}
