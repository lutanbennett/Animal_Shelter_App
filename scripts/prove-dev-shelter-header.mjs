// Proof for #ujqr5's "can dev send the header": a RESTRICTIVE per-shelter policy, applied inside begin; ... rollback;
// (nothing is kept, nothing is applied to dev), must return rows when x-shelter-id is the dev shelter's and none when the header
// is absent or another shelter's. The header is set the way PostgREST exposes it (request.headers), and the dev shelter is
// DEV_SHELTER_ID, the same value `next dev` and the anon scripts send (scripts/lib/shelter-env.mjs).
//   node scripts/prove-dev-shelter-header.mjs
import { loadEnv, projectRef } from "./lib/env.mjs";
import { runHarness } from "./lib/rollback-harness.mjs";
import { scriptShelterId } from "./lib/shelter-env.mjs";
import { exitWith } from "./lib/exit.mjs";

const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);
const shelter = scriptShelterId(env, "test");
if (!shelter) throw new Error("DEV_SHELTER_ID is not set (.env.local)");

const as = (hdr) => `
    perform set_config('request.jwt.claims', '{"role":"authenticated"}', true);
    perform set_config('request.headers', ${hdr}, true);
    set local role authenticated;
    select count(*) into n from residents;
    reset role;`;

const sql = `
do $$
declare n_with int; n_without int; n_other int; n_owner int; n int;
begin
  select count(*) into n_owner from residents;
  create policy zz_probe_open on residents as permissive for select to authenticated using (true);
  create policy zz_probe_shelter on residents as restrictive for select to authenticated
    using (is_trusted_caller() or shelter_id = current_shelter_id());
  ${as(`'{"x-shelter-id":"${shelter}"}'`)} n_with := n;
  ${as(`'{}'`)} n_without := n;
  ${as(`'{"x-shelter-id":"00000000-0000-4000-8000-000000000000"}'`)} n_other := n;
  if n_owner = 0 or n_with <> n_owner or n_without <> 0 or n_other <> 0 then
    raise exception 'HARNESS-FAIL owner=%, with header=%, without=%, other shelter=%', n_owner, n_with, n_without, n_other;
  end if;
  raise exception 'HARNESS-OK restrictive policy on residents: owner sees %, with the dev shelter header %, without a header %, with another shelter header % (rolled back)',
    n_owner, n_with, n_without, n_other;
end $$;`;

exitWith((await runHarness(ref, env, "restrictive policy probe", sql)) ? 0 : 1);
