# Bills, sites and kinds: the schema (`0304`, `0305`)

2026-11-03, stream `bills-sites-schema`. Schema only. No screen reads any of this yet.

"Site" in this file means **a premises: a place the shelter pays bills for.** It is not `0059_site_pages.sql`, the
public website's pages. To keep the two apart the table is called `premises` and nothing here is called `sites`.

## What was read first

- `bills_inbox` (`0189_bills.sql:41`): `bill_date`, `amount`, `note`, `taken_by`, `created_at`. No place, account or kind.
- `maintenance_bills` (`0189_bills.sql:66`): hangs off `maintenance`, carries amount, date, note, `added_by`. A
  `maintenance` job has only `zone_id` (`0001_initial_schema.sql:398`), and a zone is a part of the shelter, not a premises.
- `SuggestionKind = MatchKind | "maintenance_job"` (`src/app/bills/actions.ts:37`). The inbox matching is kept as is.
- No `site_id`, `premises` or `sites` table existed in any migration.

## The four questions, answered

1. **Does the place belong to a bill or to an account at a supplier? Both, and the account is optional.** There are
   two tables: `premises` and `bill_accounts` (supplier, account reference, optionally one premises and one kind). A bill
   carries `premises_id` directly, and optionally `account_id`. A water account and an electricity account at one place
   are two rows. A bill that names an account takes the account's premises (and is refused if it names a different one),
   through one plain trigger. A bill with no account still records its place. Accounts are optional because an `Other` bill
   has neither.
2. **Where does the kind live?** On `bills_inbox` (`kind_id`, nullable): that is the row where somebody says what a photo is
   for. The tables a bill is matched into already imply their kind (a clinic visit, a delivery, a maintenance job), so they
   get no kind column. `utility_bills` and `general_bills` carry `kind_id` (not null) because they are the destinations with
   no other meaning. `premises_id` and `account_id` are added to `bills_inbox` and `maintenance_bills`, nullable, so
   existing rows are untouched.
3. **Does `maintenance_bills` inherit a place from its job?** No. A job has a zone, not a premises, and nothing else implies
   one. It gets its own nullable `premises_id` and `account_id`.
4. **Is `utility_types` needed?** No. It is the kind catalogue under another name. There is one catalogue, `bill_kinds`, with
   an optional `parent_id`; Water, Electricity, Internet, Phone, Gas and Waste are children of Utilities. `utility_bills.kind_id`
   holds the child. The earlier idea of two overlapping lists is dropped.

## Tables

| Table | For |
|---|---|
| `premises` | a place bills are paid for. Nothing seeded, no count in code. Names unique ignoring case. |
| `bill_accounts` | an account at a supplier, optionally at a premises and of a kind |
| `bill_kinds` | the catalogue, as data: vet appointment, food, medicine, maintenance, materials, cleaning products, utilities (+6 children), other |
| `utility_bills` | cost only (no units, no meter reading): kind, bill date, `covers_month` (first of the month, enforced), amount, note, `added_by` |
| `general_bills` | a bill of any kind with no table of its own: materials, cleaning, **Other** |

`general_bills` was not in the brief's list of deliverables. It is needed because an `Other` bill has to live somewhere and
the inbox is "not yet matched" by definition. Without it `Other` could be saved only by being left in the inbox for good.

## Why the catalogue is data and the tailoring is not

A shelter must be able to add a kind (or a fifth place) without a deploy, so both are rows. What a kind asks for on the
form (a clinic visit to link, a month covered) is code, keyed by `bill_kinds.key`; a kind added later gets the plain form
until someone codes its fields. `Other` is what makes that honest rather than a gap.

## How `Other` is modelled

An `Other` bill is a `general_bills` row with `kind_id` = the `other` kind and `premises_id`, `account_id` null. Every key
a kind implies is nullable in every table. Proved on dev by `scripts/prove-bills-sites-schema.mjs` (claim 5).

## Cards (no role is given anything)

Three activities and three cards, each card granting exactly its one activity: `bills.utilities` / `utility_bills`,
`bills.general` / `general_bills`, `bills.sites` / `bill_sites` (places, accounts and kinds). The brief asked for one
card; two more were needed because without them the other new tables could be written only by Admin. No migration grants
any of them to a role. Reading the catalogue (places, accounts, kinds) is open to anyone who can use the bills page or
holds `bill_sites`; the select policies list the activities inline because `check-hard-coded-security.mjs` only accepts
policies that call `has_permission()` directly. `can_use_bills_inbox()` and `bill_owner_can()` were extended to know the
new activities, so a holder can use the bills page and attach a photo to the new owner types.

## Dry-run result, said plainly

`--dry-run` reported **both files `ok`**, not failed. 0305 does not name the new enum values as typed literals (they
appear in a `case` on `owner_type::text`), so it does not depend on 0304. Nothing was misreported.

## What the interface half must know

- `record_attachment()` (live body in `0278`) still refuses the new owner types `utility_bill` and `general_bill`. It fails
  closed, as `0174` intended. The interface stream adds those cases when it writes the upload route.
- Cards open `/bills` for now (placeholder `opens`); the interface stream sets real pages and `routes.ts` entries.
- Photo owner types exist (`0304`) but nothing writes them.
- Kind labels are English in `bill_kinds.label`. If the form needs Thai, add a column or translate in the dictionary then.
- The mapping from `bill_kinds.key` to what the form asks, and to the existing match (clinic visit, delivery, job), is code.

## Not settled / not done

- Production apply: both files are additive. Apply `0304` and `0305` before any deploy of the reader.
- No Thai kind labels, no `utility_types`, no usage columns (his answer: cost only).
- Release note: none, there is no screen.
