# 2026-11-26 — `shelter_hosts.attach_to_worker` (#hstau schema half)

Migration `0445_shelter_hosts_attach_to_worker.sql` adds the column exactly as
`2026-11-26-host-attach-deploy.md` (PR #1902) specified: `boolean not null default false`.
It means *this host is attached to THIS environment's Worker, and every deploy of
this environment re-asserts it*. It is stored in the database, so it is per environment.
Dev holds production's addresses under the `lanna` shelter, which is why
`is_primary` and `shelters.public_site` could not answer the question.

## No backfill, on purpose

Every row starts false. A backfill (from `is_primary`, or from the routes in `wrangler.jsonc`)
would make the next deploy attach hosts nobody asked to attach. Only the
console sets the flag: true when it attaches a host, false when it detaches one. The migration says so
in its own comment, so a later reader does not "finish the job".

## A host with no shelter may be flagged (the one judgement)

`0428` forbade `is_primary` on a row with `shelter_id is null`, because a front-door
address is nobody's website. That reasoning does not carry over. Being attached to
the Worker is a different fact from being a shelter's website, and front-door
addresses **are** attached. Production's `wrangler.jsonc` routes include
`cooperjaidee.org` and `www.cooperjaidee.org`, both front-door rows. An
equivalent constraint would leave the deploy unable to re-assert those, so the
first deploy after the app half ships would detach the product's own domain. So **no**
constraint ties the flag to a shelter. Any registered host may be attached. The host
value itself is already validated by `0382`.

No harness was written. This is one additive column, and no policy or function changed, so
a `begin … rollback` harness would prove nothing beyond what the apply already showed.
