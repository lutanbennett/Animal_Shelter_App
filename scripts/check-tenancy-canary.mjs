// Tenancy canary (backlog #qtid6, part 3 of #ykefa): plant a SECOND shelter's rows, read every object the anon role can reach,
// and fail if any output changed. A tenancy leak does not announce itself; it looks like a working page with one extra row.
// Also makes a cross-tenant call for every anon-executable function that takes an id: shelter B's id must look exactly like
// an id that does not exist.
//
//   node scripts/check-tenancy-canary.mjs [--env test|uat|production] [--strict] [--prove-red leak-table|leak-attachments|drop-restrictive]
//
// Conventions copied from check-tenancy-catalogue.mjs: report-only (exit 0) by default, exit 1 only under --strict,
// exit 2 when it could not read at all.
//
// HOW: one Management API query. Inside ONE transaction a plpgsql block (1) enumerates every public relation anon holds a
// SELECT privilege on, (2) hashes what anon reads from each, twice, to find objects that are not stable, (3) plants shelter B's
// rows through the shelter_id columns (0383/0384), (4) reads again as anon, (5) calls each id-taking anon function with B's ids
// and with an id that does not exist. It then RAISES, so the transaction ALWAYS rolls back and nothing is left in the shared
// database; the result travels in the error message. The read role is `set local role anon`, which exercises grants, RLS and
// view definitions exactly as PostgREST does, but is not an HTTP call.
//
// --prove-red <name> sabotages the schema inside that same rolled-back transaction, to prove the canary goes red:
//   leak-table   grants anon SELECT and a permissive policy on residents before the baseline, so planting B's resident changes what anon reads.
//   leak-attachments  the same on attachments, so the planted shelter-B file row changes what anon reads.
//
// TWO LIMITS, written here so nobody trusts it further than it goes:
//  (a) It cannot see service-role calls. They are not database roles (Part 7, #ujqr5's neighbour). A route that reads with
//      the service key and forgets its where is invisible to this check.
//  (b) It cannot run on the pull-request path. It needs a Management API token that can WRITE (it plants, then rolls back), and
//      this repository is public on purpose, so a PR run would hand that token to every run. It runs nightly against dev only
//      (.github/workflows/tenancy-canary.yml), and a read-only token is refused at the planting step (exit 2).
//  Also: it reads as the anon DATABASE ROLE, not through the Worker, so it does not see a host-to-shelter mismatch, and the
//  restrictive per-shelter policies (0392, Part 5 #ujqr5) are on dev, so --prove-red drop-restrictive shows the canary notices one being removed.
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";

const argv = process.argv.slice(2);
const { name: envName } = parseEnvArg(argv);
const strict = argv.includes("--strict");
const pi = argv.indexOf("--prove-red");
const proveRed = pi >= 0 ? argv[pi + 1] : null;
const SABOTAGE = {
  "leak-table": { phase: "pre", sql: ["grant select on public.residents to anon", "create policy canary_leak on public.residents for select to anon using (true)"] },
  // drop-restrictive: the item's own proof. 0392's restrictive shelter_scope_select on residents is dropped, and so that a read can happen at all (anon holds no
  // grant on residents) a grant and a permissive policy are added: the proof is "restrictive policy dropped AND grant present". See docs/decisions/2026-11-18-canary-proved-red-by-dropping-a-policy.md.
  "drop-restrictive": { phase: "pre", sql: ["drop policy shelter_scope_select on public.residents", "grant select on public.residents to anon", "create policy canary_leak on public.residents for select to anon using (true)"] },
  "leak-attachments": { phase: "pre", sql: ["grant select on public.attachments to anon", "create policy canary_leak on public.attachments for select to anon using (true)"] },
};
// Leaks that exist TODAY, measured 2026-11-16 on dev, and are exactly what Part 5 (#ujqr5) is for. Listed by name so the nightly run
// can pass on today's schema and still go red on any NEW one. Each is printed every run as "known". An entry that stops leaking is
// STALE and fails --strict, so Part 5 must delete it in the same change that closes the leak. Nothing here is a permission.
const KNOWN_TODAY = {
  // empty on purpose: public_resident_cards and public_shelter_stats were scoped by 0391 (#vleak) and left it.
};

if (proveRed && !SABOTAGE[proveRed]) {
  console.error(`--prove-red takes one of: ${Object.keys(SABOTAGE).join(", ")}`);
  await exitWith(2);
} else if (envName === "production") {
  console.error("Never against production: the canary plants rows (rolled back) and a worktree cannot read it. NOT CHECKED.");
  await exitWith(2);
} else {
  await main();
}

function buildSql() {
  const pre = proveRed && SABOTAGE[proveRed].phase === "pre" ? `${SABOTAGE[proveRed].sql.map((q) => `execute ${lit(q)};`).join(" ")}` : "";
  const mid = proveRed && SABOTAGE[proveRed].phase === "mid" ? `${SABOTAGE[proveRed].sql.map((q) => `execute ${lit(q)};`).join(" ")}` : "";
  return `
do $canary$
declare
  b uuid; r_id uuid := gen_random_uuid(); f text := 'canary-b-file-' || gen_random_uuid()::text;
  o record; fn record; h text; n bigint; res jsonb := '{}'::jsonb; base1 jsonb := '{}'::jsonb; base2 jsonb := '{}'::jsonb;
  after jsonb := '{}'::jsonb; calls_a jsonb := '{}'::jsonb; calls_b jsonb := '{}'::jsonb; args_a text; args_b text; out_a text; out_b text;
  planted jsonb := '[]'::jsonb; objs jsonb := '[]'::jsonb; fns jsonb := '[]'::jsonb; src record;
  cols text; lanna uuid;
begin
  ${pre}
  -- the caller is a visitor to Lanna, as the Worker would send it: with no header every shelter-scoped view reads empty before and after, and the diff proves nothing
  select id into lanna from shelters where key = 'lanna';
  if lanna is null then raise exception 'CANARY_NOT_CHECKED: no shelter with key lanna to send as the header'; end if;
  perform set_config('request.headers', json_build_object('x-shelter-id', lanna)::text, true);
  for o in
    select c.relname, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r','v','m','p') and has_any_column_privilege('anon', c.oid, 'select')
     order by 1
  loop objs := objs || to_jsonb(o.relname); end loop;

  -- phase 1: two baseline reads, to find an object whose output is not stable on its own
  for i in 1..2 loop
    for o in select value #>> '{}' as name from jsonb_array_elements(objs) loop
      begin
        set local role anon;
        execute format('select coalesce(md5(string_agg(t::text, %L order by t::text)), %L), count(*) from public.%I t', '|', 'empty', o.name) into h, n;
        reset role;
        if i = 1 then base1 := base1 || jsonb_build_object(o.name, h || '/' || n); else base2 := base2 || jsonb_build_object(o.name, h || '/' || n); end if;
      exception when others then
        reset role;
        if i = 1 then base1 := base1 || jsonb_build_object(o.name, 'refused:' || sqlstate); else base2 := base2 || jsonb_build_object(o.name, 'refused:' || sqlstate); end if;
      end;
    end loop;
  end loop;

  if coalesce(split_part(base2->>'public_resident_cards', '/', 2), '0')::bigint = 0 then raise exception 'CANARY_NOT_CHECKED: public_resident_cards reads empty as Lanna, so the diff would be hollow'; end if;

  -- baseline for the id-taking anon functions: an id that does not exist
  for fn in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as sig, p.pronargs, p.proargtypes::oid[] as types, p.proargnames as names
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute') and p.pronargs > 0 and p.prokind = 'f'
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
     order by p.proname
  loop fns := fns || jsonb_build_object('name', fn.proname, 'sig', fn.sig); end loop;

  -- plant shelter B through the shelter_id columns
  insert into shelters (key, name) values ('canary-b-' || substr(r_id::text, 1, 8), 'Canary shelter B') returning id into b;
  select * into src from residents limit 1;
  if not found then raise exception 'CANARY_NOT_CHECKED: no resident row to copy a shape from'; end if;
  insert into residents select * from jsonb_populate_record(null::residents, to_jsonb(src) || jsonb_build_object(
    'id', r_id, 'shelter_id', b, 'resident_code', 'CANARY-' || substr(r_id::text, 1, 8), 'name', 'Canary B', 'ready_for_adoption', false,
    'text_approval', null, 'profile_photo_drive_file_id', null, 'microchip_number', null));
  planted := planted || jsonb_build_object('residents', r_id);
  begin
    select string_agg(quote_ident(attname), ',' order by attnum) into cols from pg_attribute
     where attrelid = 'public.attachments'::regclass and attnum > 0 and not attisdropped and attgenerated = '';
    execute format('insert into attachments (%1$s) select %1$s from jsonb_populate_record(null::attachments, $1)', cols)
      using (select to_jsonb(a) from attachments a limit 1) || jsonb_build_object(
      'id', gen_random_uuid(), 'shelter_id', b, 'owner_type', 'resident', 'owner_id', r_id, 'drive_file_id', f, 'file_name', 'canary.jpg',
      'sub_folder', null, 'approved_at', null);
    planted := planted || jsonb_build_object('attachments', f);
  exception when others then planted := planted || jsonb_build_object('attachments_skipped', sqlstate || ' ' || sqlerrm);
  end;
  ${mid}

  -- phase 2: read again
  for o in select value #>> '{}' as name from jsonb_array_elements(objs) loop
    begin
      set local role anon;
      execute format('select coalesce(md5(string_agg(t::text, %L order by t::text)), %L), count(*) from public.%I t', '|', 'empty', o.name) into h, n;
      reset role;
      after := after || jsonb_build_object(o.name, h || '/' || n);
    exception when others then
      reset role;
      after := after || jsonb_build_object(o.name, 'refused:' || sqlstate);
    end;
  end loop;

  -- cross-tenant calls: B's id vs an id that does not exist, same function, same position
  for fn in
    select p.oid, p.proname, p.proargtypes::oid[] as types, p.proargnames as names
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute') and p.pronargs > 0 and p.prokind = 'f'
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
       and p.proargtypes::oid[] && array['uuid'::regtype::oid, 'text'::regtype::oid]
  loop
    args_a := ''; args_b := '';
    for i in 1..array_length(fn.types, 1) loop
      args_a := args_a || case when i > 1 then ',' else '' end ||
        case when fn.types[i] = 'uuid'::regtype::oid then quote_literal('00000000-0000-0000-0000-000000000000') || '::uuid'
             when fn.types[i] = 'text'::regtype::oid then quote_literal('canary-no-such-file') || '::text'
             else 'null::' || fn.types[i]::regtype::text end;
      args_b := args_b || case when i > 1 then ',' else '' end ||
        case when fn.types[i] = 'uuid'::regtype::oid then quote_literal(r_id) || '::uuid'
             when fn.types[i] = 'text'::regtype::oid then quote_literal(f) || '::text'
             else 'null::' || fn.types[i]::regtype::text end;
    end loop;
    begin
      set local role anon; execute format('select public.%I(%s)::text', fn.proname, args_a) into out_a; reset role;
    exception when others then reset role; out_a := 'refused:' || sqlstate;
    end;
    begin
      set local role anon; execute format('select public.%I(%s)::text', fn.proname, args_b) into out_b; reset role;
    exception when others then reset role; out_b := 'refused:' || sqlstate;
    end;
    calls_a := calls_a || jsonb_build_object(fn.proname, out_a);
    calls_b := calls_b || jsonb_build_object(fn.proname, out_b);
  end loop;

  raise exception 'CANARY_RESULT:%', jsonb_build_object('objects', objs, 'functions', fns, 'planted', planted,
    'base1', base1, 'base2', base2, 'after', after, 'calls_a', calls_a, 'calls_b', calls_b)::text;
end
$canary$;`;
}

function lit(s) {
  return `'${s.replace(/'/g, "''")}'`;
}

async function main() {
  const env = loadEnv(envName);
  if (!env.SUPABASE_ACCESS_TOKEN) {
    console.error("SUPABASE_ACCESS_TOKEN is required (Management API; it must be able to write, to plant and roll back). NOT CHECKED.");
    return exitWith(2);
  }
  const ref = projectRef(env);
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: buildSql() }),
    });
    const body = await res.text();
    let text = body;
    try { text = JSON.parse(body).message ?? body; } catch { /* keep raw */ }
    const nc = text.match(/CANARY_NOT_CHECKED:[^\n]*/);
    if (nc) throw new Error(nc[0]);
    const m = text.match(/CANARY_RESULT:({.*})/s);
    if (!m) throw new Error(`no result from the database (HTTP ${res.status}): ${text.slice(0, 300)}`);
    var data = JSON.parse(m[1]);
  } catch (e) {
    console.error(`NOT CHECKED: ${e.message}`);
    return exitWith(2);
  }

  const findings = [];
  const known = [];
  const unstable = Object.keys(data.base1).filter((k) => data.base1[k] !== data.base2[k]);
  console.log(`Project ${ref}${proveRed ? `; SABOTAGED (${proveRed}), a red result is the expected one` : ""}`);
  console.log(`Planted (rolled back, nothing left behind): ${JSON.stringify(data.planted)}`);
  const refused = Object.values(data.base2).filter((v) => String(v).startsWith("refused:")).length;
  console.log(`Read ${data.objects.length} anon-reachable objects as the anon role (${data.objects.length - refused} answered, ${refused} refused at read, e.g. column-level grants).`);
  for (const u of unstable) console.log(`unstable  ${u}  — differs between two reads with nothing planted, so excluded from the diff`);
  for (const k of data.objects) {
    if (unstable.includes(k)) continue;
    if (data.base2[k] !== data.after[k]) (Object.hasOwn(KNOWN_TODAY, k) ? known : findings).push(`${k}: anon output changed after planting shelter B (${data.base2[k]} -> ${data.after[k]})`);
  }
  console.log(`Id-taking anon functions: ${data.functions.length}; cross-tenant calls made for the ones with a uuid or text argument: ${Object.keys(data.calls_a).length}`);
  for (const f of Object.keys(data.calls_a)) {
    if (data.calls_a[f] !== data.calls_b[f]) findings.push(`${f}(): shelter B's id answered ${data.calls_b[f]}, an id that does not exist answered ${data.calls_a[f]}`);
  }
  for (const k of known) console.log(`known  ${k}  — ${KNOWN_TODAY[k.split(":")[0]]}`);
  for (const k of Object.keys(KNOWN_TODAY)) {
    if (!known.some((x) => x.startsWith(k + ":"))) findings.push(`STALE known-leak entry ${k}: it no longer changes, so delete it from KNOWN_TODAY`);
  }
  for (const f of findings) console.log(`FAIL  ${f}`);
  console.log(`\n${findings.length} new leak finding(s), ${known.length} known (Part 5), ${unstable.length} unstable object(s).`);
  console.log("LIMITS: cannot see service-role calls (Part 7); cannot run on the pull-request path (a write-capable token on a public repo); reads as the anon database role, and the per-shelter policies (0392) exist on dev, so it shows nothing leaks across shelters through the anon role today and, via --prove-red drop-restrictive, that removing one is noticed.");
  console.log(strict ? "STRICT: exiting 1 on any finding." : "REPORT-ONLY: this does not fail the build.");
  return exitWith(strict && findings.length ? 1 : 0);
}
