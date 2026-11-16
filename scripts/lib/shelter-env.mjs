// The x-shelter-id header for a script that calls Supabase as anon or as a login (#ujqr5). A script is not behind the
// Worker, so it sends the shelter itself. The value is configuration, never a default: unset sends nothing, and once
// Part 5's policies are on, nothing then reads nothing.
//   test (the dev project): DEV_SHELTER_ID, from .env.local or the shell; CI gets it from the repository variable
//     TEST_SHELTER_ID (.github/workflows/ci.yml).
//   uat / production: SHELTER_ID, from that environment's own file or the shell. The dev value never carries over,
//     because loadEnv layers .env.local under every environment.
export const SHELTER_HEADER = "x-shelter-id";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function scriptShelterId(env, envName = "test") {
  const v = (envName === "test" ? env.DEV_SHELTER_ID : env.SHELTER_ID)?.trim();
  return v && UUID.test(v) ? v : null;
}

/** {} or { "x-shelter-id": uuid }, to spread into a headers object or supabase-js `global.headers`. */
export function scriptShelterHeaders(env, envName = "test") {
  const id = scriptShelterId(env, envName);
  return id ? { [SHELTER_HEADER]: id } : {};
}
