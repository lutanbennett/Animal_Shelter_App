-- consumer: none
-- (nothing reads this column until the #hstau app half ships: scripts/deploy.mjs passing `wrangler deploy --domain` per flagged host)
--
-- #hstau SCHEMA HALF. Specification: docs/decisions/2026-11-26-host-attach-deploy.md (PR #1902).
-- Reasoning for the choices below: docs/decisions/2026-11-26-shelter-hosts-attach-flag.md.
--
-- shelter_hosts.attach_to_worker: this host is attached to THIS environment's Worker by the console, and every deploy of this
-- environment must re-assert it (a deploy deletes every custom domain absent from wrangler.jsonc, measured on test in PR #1899).
-- Per database = per environment: dev holds production's addresses under the lanna shelter, so no existing column (is_primary,
-- shelters.public_site) can say which hosts belong on which Worker. The console sets true with the attach and false with the detach.
--
-- NO BACKFILL, ON PURPOSE. Do not "finish the job" by setting it from is_primary or from wrangler.jsonc: any row set true here would be
-- attached by the next deploy without anyone having asked. Default false means nothing attaches on migration.
--
-- NO "must have a shelter" CONSTRAINT, ON PURPOSE, unlike is_primary in 0428. A front-door address (shelter_id null, e.g. the product's
-- own domain) is nobody's website, but it IS attached to the Worker, so forbidding the flag there would make the deploy unable to keep it.
--
-- Additive and re-runnable. TO UNDO: alter table public.shelter_hosts drop column attach_to_worker;

alter table public.shelter_hosts add column if not exists attach_to_worker boolean not null default false;

comment on column public.shelter_hosts.attach_to_worker is
  'This host is attached to this environment''s Worker; every deploy of this environment re-asserts it. Set by the console with the attach/detach. Default false, deliberately not backfilled.';
