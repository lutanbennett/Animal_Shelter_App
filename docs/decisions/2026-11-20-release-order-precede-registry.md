# #rlord: the release-order guard now covers migrations that must precede the Worker

**Hand-kept list, not derived from `-- consumer: worker/` headers.** The header read yields three files: 0236, 0408, 0426.
Only 0426 is a hard dependency (the Worker calls `resolve_shelter_site`; absent, the RPC 404s, no `x-shelter-id` is sent, and
since 0392 that blanks the site). 0236 names the whole `worker/` directory and 0408 lists Worker files that read what it adds;
both are applied everywhere and neither was established as a call that fails when absent. A header-derived rule would refuse
releases for those, and a guard that refuses for the wrong reason is worse than a silent one. Chosen: `MUST_PRECEDE_WORKER`,
with `uses` (the text proving the Worker calls the object). Next one is added by hand; widen to headers if that proves forgotten.

**Refusal condition:** migration pending on that environment AND the Worker named by `--worker-deployed` already contains `uses`.
With no Worker named it passes (ordinary order applies migrations first, procedure §5). Unreachable-database and unreachable-Worker
refusals are untouched. A clean run prints one line per direction.
