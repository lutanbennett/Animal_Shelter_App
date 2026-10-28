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

// Card-shaped fixture: gives a login EXACTLY these cards and nothing else, through a throwaway role of its own,
// so a harness names the activity it needs rather than a role that other work can rebuild under it.
//
//   const { error, cleanup } = await giveCards(service, userId, ["view_residents"]);
//   ... in the finally block, AFTER the login is deleted: await cleanup();
//
// The role key carries a random suffix, so two harnesses never share one and nothing is left behind
// as long as cleanup() runs (dev-signin's leftovers are what filled the dev database with orphans).
export async function giveCards(service, userId, cardKeys) {
  const key = `harness_cards_${Math.random().toString(36).slice(2, 10)}`;
  const { error: upErr } = await service
    .from("roles")
    .insert({ key, name: `Harness: ${cardKeys.join(", ")}`.slice(0, 120), kind: "custom", home_path: "/home" });
  if (upErr) return { error: upErr, cleanup: async () => {} };
  const { data: made, error: madeErr } = await service.from("roles").select("id").eq("key", key).single();
  const cleanup = async () => {
    if (!made) return;
    await service.from("user_roles").delete().eq("role_id", made.id);
    await service.from("role_cards").delete().eq("role_id", made.id);
    const { error } = await service.from("roles").delete().eq("id", made.id);
    if (error) console.error(`  could not delete throwaway role ${key}: ${error.message}`);
  };
  if (madeErr) return { error: madeErr, cleanup };
  const { error: setErr } = await service.rpc("set_role_cards", { p_role: made.id, p_cards: cardKeys });
  if (setErr) return { error: setErr, cleanup };
  const { error: urErr } = await service.from("user_roles").insert({ user_id: userId, role_id: made.id });
  return { error: urErr, cleanup };
}
