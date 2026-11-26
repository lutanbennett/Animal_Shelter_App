# The tenancy catalogue is gated where a migration is written (#tnc41)

**Decided 2026-11-26** by the `tenancy-catalogue-gate` stream, under the brief's delegation ("where does that gate belong? … you
decide and record it").

## The three readings, measured on dev on 2026-11-26

**(a) Two invocations, two different populations.** `lintCatalogue()` clears an object when its owner is `tenantRole`. The bare run
passes no tenant role (`DEFAULT_TENANT_ROLE = null`), so **every** owner-run API view and definer function is flagged whoever owns
it: 128 flagged on dev, the release's 124 → 128 figure. That is the total of definer objects, not of faults. The nightly passes
`--tenant-role rls_definer`, which asks the real question — is anything still owned by a BYPASSRLS role? — and read **3** on dev
(the three from `0441`). So "124 flagged" and "the nightly is red" are **not** the same population; the item assumed they were.

**(b) Why the nightly flipped on 2026-11-23.** Read from the run logs (`gh run view <id> --log`). The red runs of 23 and 24 Nov
flagged the seven product-console functions from `0436`/`0438`, applied to dev before any entry existed. #1880 (`#tnycl`) gave six of
them entries and `0440` re-owned the seventh, so the 25 Nov run flagged only `0441`'s three. Nothing broke: the nightly answered
correctly every night, **one to two days after** the migration that caused it, and nobody was obliged to read it. On 2026-11-26 it
already flags a fourth, `product_admin_access_elsewhere`, from an unmerged migration of another stream that is applied to dev.

**(c) Why `0440`'s re-own did not clear its flag.** It did, in the reading that matters: under `--tenant-role rls_definer`,
`product_admin_set_shelter_site` is no longer flagged. The release ran the check **bare**, where a re-owned object is still counted,
because no tenant role is named. A re-own can never move the bare figure.

## The four objects from `0441`

| Object | Disposition |
|---|---|
| `view:public.public_platform_content` | Nothing to do: `0441` already sets `owner to rls_definer`, and the nightly does not flag it. |
| `function:public.product_admin_set_platform_content` | `ALLOWED`: writes a table whose only policy is select-to-`rls_definer`, so re-owned it would be refused; the table has no `shelter_id`, so there is no tenant filter to bypass. |
| `function:public.product_admin_delete_platform_content` | `ALLOWED`, same reason. |
| `table:public.platform_content` | `ALLOWED`: its one view reads it through its own `rls_definer` policy, so the blank page `definer_all` guards against cannot happen. |

**Not a leak, and never was:** both functions check `is_product_admin()` and aal2 in their own bodies. **No migration:** adding
`definer_all` and re-owning the two functions is a working alternative, but it changes no behaviour (the table is not
shelter-scoped) and would have put a second migration in this batch's queue.

## The gate: `scripts/check-tenancy-migrations.mjs`, a blocking CI job

It reads the SQL text of each migration a branch adds, and for every view, function or table **that file creates and no earlier file
created** it applies the three rules: a view needs `security_invoker` or `owner to rls_definer` in the same file; a security definer
function the API can execute needs `owner to rls_definer` in the same file; a `public` table with RLS enabled needs a `definer_all`
policy in the same file. Otherwise it needs an `ALLOWED` entry, the same map the nightly reads, so a reason lives in one place.
No token and no database, so it runs on every pull request as the `tenancy-migrations` job and **turns the PR red**.

Proven against history: run on `0436` alone it fails (`product_admin_set_shelter_site`, the miss `0440` fixed two days later); on
`0438` and `0441` it passes only through their `ALLOWED` entries; on the other stream's unmerged `0444` it fails on
`product_admin_access_elsewhere`.

### What it CANNOT see (the nightly still covers all of these)

- **A `create or replace` of an object an earlier file created.** Its owner is in the database, not the text: `0375` re-owned
  everything in a dynamic loop, so no file says who owns what. Left to the nightly on purpose.
- **Grants or owners set in a different file**, or anything built by dynamic SQL (`execute format(…)`).
- **API reachability beyond the file:** a definer function counts as unreachable only when the file revokes execute from `public`,
  `anon` and `authenticated` and grants none back.
- **RLS enabled on a table an earlier file created.**
- **Whether an `ALLOWED` reason is true.** It checks a name exists, as the nightly does.

### Rejected

- **Running the live-catalogue check on pull requests.** It needs `SUPABASE_ACCESS_TOKEN`; the workflow's own header and
  `2026-11-15-tenancy-lint-scheduled.md` record that a PR run would hand a token to every run of a public repo. It would also judge
  dev, not the branch: a migration is only in the catalogue once applied.
- **Making the nightly's red something somebody must act on.** It still arrives after the migration is written, merged or not, and
  a red emailed to one person is the state this item described.
- **Building two.** The nightly stays as it is: it is the backstop for the list above, not a second gate.

The ~125 objects the bare run counts are not touched: the gate judges only objects a new file creates, so nothing old has to be
catalogued before it can block.
