// The allow-list for scripts/check-production.mjs: named questions about the live database, and the one function
// that can ask them. Read-only is structural, in three layers a reader can verify in under a minute:
//
//   1. There is NO path from argv to SQL. A caller names a check; the SQL below is the only SQL that can run.
//   2. runCheck() is the only code that sends a query, and it wraps every check in `begin read only; ... rollback;`.
//      Postgres itself then refuses any INSERT/UPDATE/DELETE/DDL in that transaction, even one made by a function.
//   3. assertSelectOnly() rejects any check whose SQL is not one SELECT (no `;`, no write keyword), and
//      scripts/check-production.test.mjs runs it over every entry, so a bad check fails `npm test`.
//
// Adding a check = adding an entry here. Results are counts, keys and names of settings, never residents or people.


const FORBIDDEN = /\b(insert|update|delete|truncate|drop|alter|create|grant|revoke|copy|call|do|vacuum|reindex|set|nextval|setval|pg_terminate_backend|pg_cancel_backend)\b/i;

/** Throws unless `sql` is one SELECT/WITH statement with no write keyword. Quoted strings are ignored. */
export function assertSelectOnly(name, sql) {
  const bare = sql
    .replace(/--.*$/gm, "")
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/"[^"]*"/g, '""');
  if (/;/.test(bare)) throw new Error(`check "${name}": more than one statement`);
  if (!/^\s*(select|with)\b/i.test(bare)) throw new Error(`check "${name}": must start with select or with`);
  const hit = FORBIDDEN.exec(bare);
  if (hit) throw new Error(`check "${name}": contains "${hit[0]}"`);
}

export function cronVerdict(r) {
  const stale = (t) => !t || Date.now() - new Date(t).getTime() > 45 * 60 * 1000;
  if (!r.beat_last) return stale(r.alerts_last_cron) ? "no heartbeat yet (not deployed, or the trigger is not firing): not proven either way" : "healthy";
  if (stale(r.beat_last)) return "trigger STOPPED: the heartbeat itself has gone quiet, so the fault is the Cloudflare trigger or the Worker not running";
  if (!stale(r.alerts_last_cron)) return "healthy: trigger firing and the app is writing real runs";
  if (/skipped/.test(r.beat_note ?? "")) return "trigger fires but a stage was SKIPPED (a variable is missing; the note names it)";
  if (/failed|threw|: [45][0-9][0-9]/.test(r.beat_note ?? "")) return "trigger fires and a stage FAILED (see the note)";
  return "trigger fires but no real run was written: the Worker did not reach the app, or the route did not write";
}

export const CHECKS = {
  "schema-version": {
    asks: "Which migration was applied last, and how many are applied?",
    sql: `select json_build_object('applied', count(*), 'latest', max(filename)) from schema_migrations`,
    render: (r) => [`${r.applied} migrations applied; the latest is ${r.latest}.`],
  },
  "role-cells": {
    asks: "TRANSIENT CONTEXT, not a finding (who holds what TODAY; roles are a transient grouping of cards, so do not quote this as a measurement): For each role: how many permission cells and cards does it hold? (Cells with no card behind them are stripped the next time that role's cards are saved.)",
    sql: `select coalesce(json_agg(json_build_object('role', r.key,
        'cells', (select count(*) from role_permissions p where p.role_id = r.id),
        'cards', (select count(*) from role_cards c where c.role_id = r.id)) order by r.key), '[]'::json)
      from roles r where r.kind <> 'fixed'`,
    render: (rows) => rows.map((x) => `${x.role}: ${x.cells} cells, ${x.cards} cards`),
  },
  "role-cards": {
    asks: "TRANSIENT CONTEXT, not a finding (who holds what TODAY; roles are a transient grouping of cards, so do not quote this as a measurement): Which cards does each role hold? (Answers 'does any role hold the Operations or Management card?'.)",
    sql: `select coalesce(json_agg(json_build_object('role', r.key,
        'cards', coalesce((select json_agg(c.card order by c.position) from role_cards c where c.role_id = r.id), '[]'::json)) order by r.key), '[]'::json)
      from roles r where r.kind <> 'fixed'`,
    render: (rows) => rows.map((x) => `${x.role}: ${x.cards.length ? x.cards.join(", ") : "(no cards)"}`),
  },
  "doctor-cells": {
    asks: "Does the doctor role hold the 13 cells migration 0230 gave it, at that level or higher?",
    sql: `select json_build_object('missing', coalesce((select json_agg(w.activity order by w.activity)
        from (values ('resident.record',1),('resident.adoption_news',1),('resident.microchip',2),('visit.book',2),
          ('medical.visits',2),('medical.procedures',2),('medical.blood_tests',2),('medical.prescriptions',2),
          ('medical.immunizations',2),('medical.weight',2),('medical.diet',2),
          ('photos.resident_add',2),('reference.add_while_recording',2)) as w(activity, level)
        where not exists (select 1 from role_permissions p join roles r on r.id = p.role_id
          where r.key = 'doctor' and p.activity = w.activity and p.level >= w.level)), '[]'::json),
      'role_exists', exists (select 1 from roles where key = 'doctor'))`,
    render: (r) => !r.role_exists ? ["There is no doctor role."]
      : r.missing.length ? [`MISSING ${r.missing.length} of 13: ${r.missing.join(", ")}`] : ["All 13 doctor cells are present."],
    failed: (r) => !r.role_exists || r.missing.length > 0,
  },
  "role-cards-coverage": {
    asks: "TRANSIENT CONTEXT, not a finding — SUPERSEDED as a fault check by `card-grants-applied`, which asks the card question and guards the same invariant. Kept only to show who is affected today: For each role: which held card needs access the role does not have, and which activity at which level is missing? (After the card-grants release this must print nothing.)",
    // Reads card_grants and card_includes (0257): each held card with everything it includes. Before 0257 is applied to a database
    // this reports a missing table, which is the same finding: that database has no copy of what a card requires.
    sql: `with g(card, activity, level) as (select c0.card, cg.activity, max(cg.level) from (select distinct card from role_cards) c0 cross join lateral card_closure(array[c0.card]) cl join card_grants cg on cg.card = cl.card group by c0.card, cg.activity)
      select coalesce(json_agg(json_build_object('role', r.key, 'card', c.card, 'activity', g.activity,
          'need', g.level, 'have', coalesce(p.level, 0)) order by r.key, c.card, g.activity), '[]'::json)
      from roles r join role_cards c on c.role_id = r.id join g on g.card = c.card
        left join role_permissions p on p.role_id = r.id and p.activity = g.activity
      where r.kind <> 'fixed' and coalesce(p.level, 0) < g.level`,
    render: (rows) => rows.length
      ? rows.map((x) => `${x.role}: card ${x.card} needs ${x.activity} at ${x.need === 2 ? "edit/yes" : "read"}, role has ${["none", "read", "edit/yes"][x.have]}`)
      : ["Every held card is covered by its role's access."],
    failed: (rows) => rows.length > 0,
  },
  "cards-union": {
    asks: "TRANSIENT CONTEXT, not a finding — SUPERSEDED as a fault check by `card-cells-backed`, which asks the activity question and guards the same invariant. Kept only to show who is affected today: For each role: are its permission cells exactly the union of its cards' grants? (Lists cells no card backs, and backed access the role lacks.)",
    // Reads card_grants and card_includes, like role-cards-coverage.
    sql: `with g(card, activity, level) as (select c0.card, cg.activity, max(cg.level) from (select distinct card from role_cards) c0 cross join lateral card_closure(array[c0.card]) cl join card_grants cg on cg.card = cl.card group by c0.card, cg.activity),
      want as (select c.role_id, g.activity, max(g.level) as level
        from role_cards c join g on g.card = c.card group by c.role_id, g.activity)
      select coalesce(json_agg(json_build_object('role', r.key,
          'unbacked', coalesce((select json_agg(p.activity order by p.activity) from role_permissions p
            where p.role_id = r.id and not exists (select 1 from want w where w.role_id = r.id and w.activity = p.activity and w.level >= p.level)), '[]'::json),
          'unapplied', coalesce((select json_agg(w.activity order by w.activity) from want w
            where w.role_id = r.id and not exists (select 1 from role_permissions p where p.role_id = r.id and p.activity = w.activity and p.level >= w.level)), '[]'::json))
        order by r.key), '[]'::json)
      from roles r where r.kind <> 'fixed'`,
    render: (rows) => rows.map((x) => x.unbacked.length + x.unapplied.length === 0
      ? `${x.role}: exactly the union of its cards`
      : `${x.role}: ${x.unbacked.length} cells no card backs (${x.unbacked.join(", ") || "-"}); ${x.unapplied.length} backed but missing (${x.unapplied.join(", ") || "-"})`),
    failed: (rows) => rows.some((x) => x.unbacked.length + x.unapplied.length > 0),
  },
  "card-grants-applied": {
    asks: "For each card: does anything that holds it lack an activity the card grants (counting what it includes), and how many holders do? (Names no role: the cells are stored per role, so this counts holders. A card that does nothing is the fault; none is correct.)",
    // Same data as role-cards-coverage, grouped by card. Role archiving was removed in 0272, so no retired-role filter is needed.
    sql: `with g(card, activity, level) as (select c0.card, cg.activity, max(cg.level) from (select distinct card from role_cards) c0 cross join lateral card_closure(array[c0.card]) cl join card_grants cg on cg.card = cl.card group by c0.card, cg.activity)
      select coalesce(json_agg(json_build_object('card', t.card, 'activity', t.activity, 'need', t.level, 'holders', t.holders, 'lacking', t.lacking) order by t.card, t.activity), '[]'::json)
      from (select c.card, g.activity, g.level, count(*) as holders, count(*) filter (where coalesce(p.level, 0) < g.level) as lacking
        from roles r join role_cards c on c.role_id = r.id join g on g.card = c.card
          left join role_permissions p on p.role_id = r.id and p.activity = g.activity
        where r.kind <> 'fixed'
        group by c.card, g.activity, g.level) t
      where t.lacking > 0`,
    render: (rows) => rows.length
      ? rows.map((x) => `${x.card}: grants ${x.activity} at ${x.need === 2 ? "edit/yes" : "read"}, but ${x.lacking} of ${x.holders} holders lack it - the card does nothing there`)
      : ["Every held card is fully applied wherever it is held."],
    failed: (rows) => rows.length > 0,
  },
  "card-cells-backed": {
    asks: "For each activity: is any permission cell held that no card the holder has backs, or any card-backed access missing from a holder, and how many holders? (Names no role: the cells are stored per role, so this counts holders. None is correct.)",
    sql: `with g(card, activity, level) as (select c0.card, cg.activity, max(cg.level) from (select distinct card from role_cards) c0 cross join lateral card_closure(array[c0.card]) cl join card_grants cg on cg.card = cl.card group by c0.card, cg.activity),
      want as (select c.role_id, g.activity, max(g.level) as level from role_cards c join g on g.card = c.card group by c.role_id, g.activity),
      live as (select id from roles where kind <> 'fixed'),
      unbacked as (select p.activity, count(*) as n from role_permissions p join live on live.id = p.role_id
        where not exists (select 1 from want w where w.role_id = p.role_id and w.activity = p.activity and w.level >= p.level) group by p.activity),
      unapplied as (select w.activity, count(*) as n from want w join live on live.id = w.role_id
        where not exists (select 1 from role_permissions p where p.role_id = w.role_id and p.activity = w.activity and p.level >= w.level) group by w.activity)
      select json_build_object(
        'unbacked', coalesce((select json_agg(json_build_object('activity', activity, 'holders', n) order by activity) from unbacked), '[]'::json),
        'unapplied', coalesce((select json_agg(json_build_object('activity', activity, 'holders', n) order by activity) from unapplied), '[]'::json))`,
    render: (r) => r.unbacked.length + r.unapplied.length === 0
      ? ["Every permission cell is backed by a card, and every card-backed cell is present."]
      : [...r.unbacked.map((x) => `${x.activity}: held by ${x.holders} with no card backing it`),
         ...r.unapplied.map((x) => `${x.activity}: backed by a card but missing from ${x.holders} holders`)],
    failed: (r) => r.unbacked.length + r.unapplied.length > 0,
  },
  "fault-residents-lifecycle": {
    asks: "TRANSIENT CONTEXT, not a finding — SUPERSEDED as a fault check by `card-lifecycle-enclosures`, which asks the card question and guards the invariant. Kept only to show who is affected today: Which roles hold the Residents card or a placement cell but not facility.enclosures at read? (They cannot move, hospitalise, foster/adopt or record a death: the enclosure lookup is refused.)",
    sql: `select coalesce(json_agg(json_build_object('role', r.key,
        'residents_card', exists (select 1 from role_cards c where c.role_id = r.id and c.card = 'residents'),
        'placement_cells', coalesce((select json_agg(p.activity order by p.activity) from role_permissions p where p.role_id = r.id and p.activity like 'placement.%'), '[]'::json),
        'enclosures_read', exists (select 1 from role_permissions p where p.role_id = r.id and p.activity = 'facility.enclosures' and p.level >= 1)) order by r.key), '[]'::json)
      from roles r where r.kind <> 'fixed'
        and (exists (select 1 from role_cards c where c.role_id = r.id and c.card = 'residents')
          or exists (select 1 from role_permissions p where p.role_id = r.id and p.activity like 'placement.%'))`,
    render: (rows) => rows.length
      ? rows.map((x) => `${x.role}: Residents card ${x.residents_card ? "held" : "not held"}, ${x.placement_cells.length} placement cells, enclosures read ${x.enclosures_read ? "yes" : "NO - BLOCKED"}`)
      : ["No role holds the Residents card or a placement cell."],
    failed: (rows) => rows.some((x) => !x.enclosures_read),
  },
  "fault-clinic-visit-save": {
    asks: "TRANSIENT CONTEXT, not a finding — SUPERSEDED as a fault check by `card-clinic-visit-save`, which asks the card question and guards the invariant. Kept only to show who is affected today: Which roles hold a card or cell that books or saves a clinic visit (Book clinic visits, Medical records, visit.book) but not clinics.list? (The clinic list is empty and the field is required.)",
    sql: `select coalesce(json_agg(json_build_object('role', r.key,
        'cards', coalesce((select json_agg(c.card order by c.card) from role_cards c where c.role_id = r.id and c.card in ('book_clinic_visits', 'medical_records')), '[]'::json),
        'visit_book', exists (select 1 from role_permissions p where p.role_id = r.id and p.activity = 'visit.book'),
        'clinics_list', exists (select 1 from role_permissions p where p.role_id = r.id and p.activity = 'clinics.list' and p.level >= 1)) order by r.key), '[]'::json)
      from roles r where r.kind <> 'fixed'
        and (exists (select 1 from role_cards c where c.role_id = r.id and c.card in ('book_clinic_visits', 'medical_records'))
          or exists (select 1 from role_permissions p where p.role_id = r.id and p.activity = 'visit.book'))`,
    render: (rows) => rows.length
      ? rows.map((x) => `${x.role}: cards ${x.cards.join(", ") || "(none)"}, visit.book ${x.visit_book ? "yes" : "no"}, clinics.list ${x.clinics_list ? "yes" : "NO - BLOCKED"}`)
      : ["No role holds a clinic-visit card or cell."],
    failed: (rows) => rows.some((x) => !x.clinics_list),
  },
  // The next two restate fault-residents-lifecycle and fault-clinic-visit-save as card questions (Lutan, 2026-10-28: analysis is by card).
  // Same subject, but `failed` now fires on a CARD that does something with a required piece missing, which stays true after the role
  // assignments are rebuilt. Written by reading, not run: production credentials are not in a worktree.
  "card-lifecycle-enclosures": {
    asks: "Does any card grant a placement.* activity (move, hospitalise, foster/adopt, record a death) without also granting facility.enclosures at read, counting what it includes? (The enclosure lookup would be refused. None is correct.)",
    sql: `with g(card, activity, level) as (select c0.card, cg.activity, max(cg.level) from (select distinct card from card_grants) c0 cross join lateral card_closure(array[c0.card]) cl join card_grants cg on cg.card = cl.card group by c0.card, cg.activity)
      select coalesce(json_agg(json_build_object('card', p.card, 'placements', p.acts) order by p.card), '[]'::json)
      from (select g.card, json_agg(g.activity order by g.activity) as acts from g where g.activity like 'placement.%' group by g.card) p
      where not exists (select 1 from g where g.card = p.card and g.activity = 'facility.enclosures' and g.level >= 1)`,
    render: (rows) => rows.length
      ? rows.map((x) => `${x.card}: grants ${x.placements.length} placement activities but not facility.enclosures at read - BLOCKED`)
      : ["Every card that grants a placement activity also grants facility.enclosures at read."],
    failed: (rows) => rows.length > 0,
  },
  "card-clinic-visit-save": {
    asks: "Does any card grant visit.book without also granting clinics.list at read, counting what it includes? (The clinic list would be empty and the field is required. None is correct.)",
    sql: `with g(card, activity, level) as (select c0.card, cg.activity, max(cg.level) from (select distinct card from card_grants) c0 cross join lateral card_closure(array[c0.card]) cl join card_grants cg on cg.card = cl.card group by c0.card, cg.activity)
      select coalesce(json_agg(json_build_object('card', b.card) order by b.card), '[]'::json)
      from g b where b.activity = 'visit.book'
        and not exists (select 1 from g where g.card = b.card and g.activity = 'clinics.list' and g.level >= 1)`,
    render: (rows) => rows.length
      ? rows.map((x) => `${x.card}: grants visit.book but not clinics.list at read - BLOCKED`)
      : ["Every card that grants visit.book also grants clinics.list at read."],
    failed: (rows) => rows.length > 0,
  },
  "calendar-pending": {
    asks: "Which vet visits does the System status calendar tile count as 'waiting to be sent', and what do they have in common? (Ids and dates only, no names.)",
    // Same test as isPending() in src/lib/clinics/calendar-sync.ts: never synced, or marked out of date after the last sync.
    // gap_seconds is out_of_date minus synced: a small positive number on every row points at the two clocks, not at Google.
    sql: `select coalesce(json_agg(json_build_object('id', v.id, 'date', v.appointment_date, 'past', v.appointment_date < now(),
        'status', v.status, 'archived', v.archived_at is not null, 'has_event', v.calendar_event_id is not null,
        'synced_at', v.calendar_synced_at, 'out_of_date_at', v.calendar_out_of_date_at, 'error', v.calendar_error,
        'gap_seconds', round(extract(epoch from (v.calendar_out_of_date_at - v.calendar_synced_at))::numeric, 1),
        'db_now', now()) order by v.appointment_date, v.id), '[]'::json)
      from clinic_visits v
      where v.calendar_out_of_date_at is not null
        and (v.calendar_synced_at is null or v.calendar_out_of_date_at > v.calendar_synced_at)`,
    render: (rows) => {
      if (!rows.length) return ["No vet visit is waiting: the tile should say every visit is in the calendar."];
      const out = [`${rows.length} vet visit(s) counted as waiting:`];
      for (const x of rows) {
        out.push(`${x.id}  ${String(x.date).slice(0, 16)} ${x.past ? "(past)" : "(upcoming)"}  ${x.status}${x.archived ? ", archived" : ""}  event ${x.has_event ? "yes" : "no"}`
          + `  synced ${x.synced_at ?? "never"}  out of date ${x.out_of_date_at}  gap ${x.gap_seconds === null ? "n/a" : x.gap_seconds + "s"}`
          + `  error: ${x.error ?? "(none)"}`);
      }
      const withError = rows.filter((x) => x.error).length;
      const past = rows.filter((x) => x.past).length;
      out.push(`In common: ${withError} of ${rows.length} carry an error (so they are failing, not waiting); ${past} are past, ${rows.length - past} upcoming; `
        + `${rows.filter((x) => x.synced_at === null).length} were never synced; ${rows.filter((x) => x.gap_seconds !== null && x.gap_seconds < 5).length} have out-of-date less than 5s after their sync (a clock or in-flight re-stamp).`);
      return out;
    },
    failed: (rows) => rows.length > 0,
  },
  "calendar-recent": {
    asks: "Which visits lost their calendar event in the last 14 days, and did the poll cancel them? (Ids, dates and status only.)",
    sql: `select coalesce(json_agg(json_build_object('id', v.id, 'status', v.status, 'appointment_date', v.appointment_date,
        'calendar_changed_at', v.calendar_changed_at, 'calendar_change_kind', v.calendar_change_kind,
        'calendar_synced_at', v.calendar_synced_at, 'archived', v.archived_at is not null) order by v.calendar_synced_at desc), '[]'::json)
      from clinic_visits v
      where v.calendar_event_id is null and v.calendar_synced_at > now() - interval '14 days'
        and (v.status <> 'scheduled' or v.calendar_change_kind is not null or v.appointment_date < now())`,
    render: (rows) => rows.length
      ? rows.map((x) => `visit ${x.id}: ${x.status}${x.archived ? " (archived)" : ""}, dated ${x.appointment_date}, event gone at sync ${x.calendar_synced_at}, calendar change ${x.calendar_change_kind ?? "none"} at ${x.calendar_changed_at ?? "n/a"}`)
      : ["No visit lost its event in the last 14 days."],
  },
  "visit-duplicates": {
    asks: "Which resident and clinic have a cancelled and a scheduled visit within one day of each other? (Ids, dates and status only; backlog item 2, the overdue-and-cancelled duplicates.)",
    sql: `select coalesce(json_agg(json_build_object('cancelled_id', c.id, 'scheduled_id', s.id,
        'cancelled_date', c.appointment_date, 'scheduled_date', s.appointment_date,
        'cancelled_created_by', c.created_by, 'scheduled_created_by', s.created_by,
        'cancelled_created_at', c.created_at, 'scheduled_created_at', s.created_at,
        'cancelled_kind', c.calendar_change_kind, 'scheduled_kind', s.calendar_change_kind) order by c.appointment_date desc), '[]'::json)
      from clinic_visits c
      join clinic_visits s on s.resident_id = c.resident_id and s.clinic_id = c.clinic_id and s.id <> c.id
        and s.status = 'scheduled' and abs(extract(epoch from (s.appointment_date - c.appointment_date))) < 86400
      where c.status = 'cancelled'`,
    render: (rows) => rows.length
      ? rows.map((x) => `cancelled ${x.cancelled_id} (${x.cancelled_date}, made ${x.cancelled_created_at} by ${x.cancelled_created_by ?? "?"}, kind ${x.cancelled_kind ?? "none"}) vs scheduled ${x.scheduled_id} (${x.scheduled_date}, made ${x.scheduled_created_at} by ${x.scheduled_created_by ?? "?"}, kind ${x.scheduled_kind ?? "none"})`)
      : ["No cancelled/scheduled pair for one resident and clinic on the same day."],
  },
  "calendar-cron": {
    asks: "Is the 15-minute calendar cron reaching the app, and which migrations were applied in the last 3 days? (Dates and file names only.)",
    // calendar_sync_state is written by every poll the sweep makes: a last_run_at that stopped moving means the sweep is not running.
    sql: `select json_build_object('now', now(),
        'alerts_last_cron', (select max(ran_at) from status_alert_runs where trigger = 'cron' and coalesce(note, '') not like 'heartbeat:%'),
        'beat_last', (select max(ran_at) from status_alert_runs where trigger = 'cron' and note like 'heartbeat:%'),
        'beat_note', (select note from status_alert_runs where trigger = 'cron' and note like 'heartbeat:%' order by ran_at desc limit 1),
        'state', coalesce((select json_agg(json_build_object('last_run_at', last_run_at, 'last_ok_at', last_ok_at, 'last_error', last_error, 'has_token', sync_token is not null)) from calendar_sync_state), '[]'::json),
        'migrations', coalesce((select json_agg(json_build_object('file', filename, 'at', applied_at) order by applied_at) from schema_migrations where applied_at > now() - interval '3 days'), '[]'::json))`,
    render: (r) => [
      `Database time now: ${r.now}`,
      // Separate lines on purpose: the Worker's heartbeat (worker/heartbeat.mjs) proves only that the trigger fired; a real run is a row the
      // app's route wrote. A heartbeat must never be read as a real run, or a dead cron looks fixed.
      `status alerts: last REAL cron run ${r.alerts_last_cron ?? "never"} (written by the app's route; same trigger as the calendar sweep)`,
      `worker heartbeat: last trigger fired ${r.beat_last ?? "never"}${r.beat_note ? ` - ${r.beat_note}` : ""}`,
      `verdict: ${cronVerdict(r)}`,
      ...(r.state.length ? r.state.map((x) => `poll: last run ${x.last_run_at}, last ok ${x.last_ok_at}, token ${x.has_token ? "held" : "none"}, error: ${x.last_error ?? "(none)"}`) : ["poll: no calendar_sync_state row (the poll has never run)."]),
      ...r.migrations.map((m) => `migration ${m.file} applied ${m.at}`),
    ],
  },
  // REWRITTEN 2026-10-28. It used to ask which roles hold Do Maintenance and FAIL if any did, on the
  // premise "no delete control exists". Both halves were wrong: the delete control does exist
  // (MaintenanceJobView, gated can(perms, "maintenance.delete")) and NO card grants that activity, so
  // only Admin passes - which is exactly what Lutan decided on 2026-10-28, asked directly: "Only admin
  // can delete maintenance, keep it that way." The old check therefore reported the intended design as
  // a fault on every run, and would have done so for ever. 0265's own header had already said it:
  // "maintenance.delete, which Do maintenance has never held; the job page only promised it."
  // So the useful question is the inverse, and it GUARDS his decision instead of restating a dead fault.
  "fault-maintenance-delete": {
    asks: "Does any card grant maintenance.delete, which would take deleting a maintenance job outside Admin? (Lutan, 2026-10-28: only Admin deletes. None is correct.)",
    sql: `select coalesce(json_agg(json_build_object('card', g.card) order by g.card), '[]'::json)
      from card_grants g where g.activity = 'maintenance.delete'`,
    render: (rows) => rows.length
      ? rows.map((x) => `${x.card}: GRANTS maintenance.delete - deleting a job is no longer Admin-only`)
      : ["No card grants maintenance.delete, so only Admin can delete a maintenance job - as decided."],
    failed: (rows) => rows.length > 0,
  },
  "clinic-login-helpers": {
    asks: "Of the four clinic-login helper functions (current_clinic_resident_ids, clinic_login_owns_visit, doctor_can_write_attachment, clinic_login_may_edit_doctor): does each still exist, and does any live policy, view, other function or column rule call it? (Object names only.)",
    // Reads pg_proc, pg_policies, pg_views, pg_constraint and pg_attrdef, with -- comments stripped so a note that mentions a name does not
    // count as a call. A trigger runs a function, so a trigger is found through the function it names. Whole-word match.
    sql: `select coalesce(json_agg(json_build_object('function', f.fn,
        'exists', exists (select 1 from pg_proc p where p.proname = f.fn and p.pronamespace in ('public'::regnamespace, 'private'::regnamespace)),
        'called_by', (
          select coalesce(json_agg(x.who order by x.who), '[]'::json) from (
            select 'function ' || n.nspname || '.' || p.proname as who
              from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname in ('public', 'private') and p.prokind = 'f' and p.proname <> f.fn
               and regexp_replace(pg_get_functiondef(p.oid), '--[^\n]*', '', 'g') ~ ('\\m' || f.fn || '\\M')
            union all
            select 'policy ' || pl.schemaname || '.' || pl.tablename || ' :: ' || pl.policyname
              from pg_policies pl
             where regexp_replace(coalesce(pl.qual, '') || ' ' || coalesce(pl.with_check, ''), '--[^\n]*', '', 'g') ~ ('\\m' || f.fn || '\\M')
            union all
            select 'view ' || c.relnamespace::regnamespace || '.' || c.relname
              from pg_class c
             where c.relkind in ('v', 'm') and c.relnamespace::regnamespace::text in ('public', 'private')
               and pg_get_viewdef(c.oid) ~ ('\\m' || f.fn || '\\M')
            union all
            select 'constraint ' || c.conrelid::regclass || ' :: ' || c.conname
              from pg_constraint c
             where c.contype = 'c' and pg_get_constraintdef(c.oid) ~ ('\\m' || f.fn || '\\M')
            union all
            select 'column default ' || d.adrelid::regclass || '.' || d.adnum
              from pg_attrdef d
             where pg_get_expr(d.adbin, d.adrelid) ~ ('\\m' || f.fn || '\\M')
          ) x)) order by f.fn), '[]'::json)
      from (values ('current_clinic_resident_ids'), ('clinic_login_owns_visit'), ('doctor_can_write_attachment'), ('clinic_login_may_edit_doctor')) as f(fn)`,
    render: (rows) => rows.flatMap((x) => !x.exists ? [`${x.function}: does not exist`]
      : x.called_by.length ? [`${x.function}: CALLED by ${x.called_by.length}`, ...x.called_by.map((w) => `    ${w}`)]
      : [`${x.function}: exists, called by nothing`]),
  },
  "table-policy-commands": {
    asks: "For each public table with row security on, which commands (select/insert/update/delete) have no policy that can answer true for anyone? A policy counts as live when it resolves through has_permission(), is_admin() or a row test; one that only calls a function known to be false, or has no policy at all, does not. (Table and command names only.)",
    // RLS denies by default, so a command with no live policy is refused for everyone, Admin included (Admin's bypass runs inside
    // has_permission()/is_admin(), which only a policy invokes). 'all' policies cover every command. Comments are stripped before matching.
    // 'dead' = the policy text names is_clinic_login() or clinic_login_may_edit_doctor(), which cannot return true since 0259.
    sql: `select coalesce(json_agg(json_build_object('table', t.relname, 'command', c.cmd,
        'live', (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = t.relname
                  and (p.cmd = upper(c.cmd) or p.cmd = 'ALL')
                  and regexp_replace(coalesce(p.qual, '') || ' ' || coalesce(p.with_check, ''), '--[^\n]*', '', 'g') !~ '\\m(is_clinic_login|clinic_login_may_edit_doctor)\\M'),
        'dead', (select coalesce(json_agg(p.policyname), '[]'::json) from pg_policies p where p.schemaname = 'public' and p.tablename = t.relname
                  and (p.cmd = upper(c.cmd) or p.cmd = 'ALL')
                  and regexp_replace(coalesce(p.qual, '') || ' ' || coalesce(p.with_check, ''), '--[^\n]*', '', 'g') ~ '\\m(is_clinic_login|clinic_login_may_edit_doctor)\\M'))
        order by t.relname, c.cmd), '[]'::json)
      from pg_class t cross join (values ('select'), ('insert'), ('update'), ('delete')) as c(cmd)
     where t.relnamespace = 'public'::regnamespace and t.relkind = 'r' and t.relrowsecurity
       and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = t.relname
                  and (p.cmd = upper(c.cmd) or p.cmd = 'ALL')
                  and regexp_replace(coalesce(p.qual, '') || ' ' || coalesce(p.with_check, ''), '--[^\n]*', '', 'g') !~ '\\m(is_clinic_login|clinic_login_may_edit_doctor)\\M')`,
    render: (rows) => rows.length
      ? rows.map((x) => `${x.table}: nobody can ${x.command}${x.dead.length ? ` (only dead policies: ${x.dead.join(", ")})` : " (no policy)"}`)
      : ["Every table with row security has a live policy for all four commands."],
  },
  "assistant-could-not-help": {
    asks: "What has the assistant failed to answer? Counts of the 'unmatched' (no parser placed the sentence) and 'refused' rows it keeps for 90 days, and the newest 25 with id, date, status and what was typed. Names no login and no resident; the typed text is exactly as typed. Informational: it flags nothing.",
    // Reads assistant_actions (0070), the rows Settings -> Assistant log lists. The retention rule (0227) keeps these two statuses 90 days.
    sql: `select json_build_object(
        'unmatched', count(*) filter (where status = 'unmatched'),
        'refused', count(*) filter (where status = 'refused'),
        'oldest', min(created_at),
        'newest', max(created_at),
        'recent', coalesce((select json_agg(x order by x.created_at desc) from (select id, created_at, status, left(request_text, 200) as typed
            from assistant_actions where status in ('unmatched', 'refused') order by created_at desc limit 25) x), '[]'::json))
      from assistant_actions where status in ('unmatched', 'refused')`,
    render: (r) => (r.unmatched + r.refused === 0
      ? ["No could-not-help rows are held (nothing was missed in the last 90 days, or the rows have not been written yet)."]
      : [`${r.unmatched} not understood, ${r.refused} refused; oldest ${String(r.oldest).slice(0, 10)}, newest ${String(r.newest).slice(0, 10)}.`,
         ...r.recent.map((x) => `${String(x.created_at).slice(0, 16).replace("T", " ")} ${x.status} ${x.id} ${JSON.stringify(x.typed)}`)]),
  },
};

/** Wrap one check in a read-only transaction. The result rides out in an exception message, as the harnesses do. */
export function buildQuery(name) {
  const check = Object.hasOwn(CHECKS, name) ? CHECKS[name] : undefined;
  if (!check) throw new Error(`no such check: ${name}`);
  assertSelectOnly(name, check.sql);
  return `begin read only;\ndo $o$ begin raise exception 'CHECK-RESULT %', ((${check.sql})::jsonb); end $o$;\nrollback;`;
}

/** Run one named check; returns the parsed result. The only place a query leaves this machine. */
export async function runCheck(name, { ref, token }) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: buildQuery(name) }),
  });
  const text = await r.text();
  let msg = text;
  try { msg = JSON.parse(text).message ?? text; } catch {}
  const m = /CHECK-RESULT (.*)/.exec(msg);
  if (!m) throw new Error(`${name}: no result (HTTP ${r.status}): ${String(msg).slice(0, 300)}`);
  return JSON.parse(m[1]);
}
