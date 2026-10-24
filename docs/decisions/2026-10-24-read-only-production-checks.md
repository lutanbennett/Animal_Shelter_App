# A read-only production check script is wanted (2026-10-24)

**Lutan, 2026-10-24: "Yes keep the read only production check script."** Asked after a third
consecutive release recorded a production fact that no session could verify.

## What prompted it

Every check script that could answer a question about production refuses anything but the dev
project — `refusing: <ref> is not the dev project`. Three releases running have each shipped
with a "not established" as a result, and each time the guard was left alone rather than worked
around:

| Release | Not established |
|---|---|
| `0.39.4` | Which production diets `0250`'s per-serving back-fill affected — the five diets scripts are dev-locked, and Lutan has since edited diets by hand |
| `0.39.5` | Whether any production role holds the Operations or Management card after he exercised the toggle |
| `0.40.0` | Whether the doctor role has `0230`'s medical cells on production (#890) — **all eight** doctor/medical scripts refuse |

The effect compounds: an increasing share of verification can only be done by the one person
the release process is meant to spare, and each release's record carries one more unknown.

## The decision

**Have one.** A read-only production check capability is worth building.

## Constraints, which are the point of writing this down

**Read-only by construction, not by intention.** No insert, update, delete, or RPC that writes.
A script that *could* write and promises not to is not read-only.

**Allow-listed checks, not arbitrary SQL.** The value is answering named questions — does this
role hold these cells, do these diets have out-of-proportion servings — not opening a general
query channel against production.

**Do NOT build it by loosening the existing guards one script at a time.** The
`if (ref !== "qxkmhwybjggxvsfxsxbd") throw` lines exist on purpose, and the eight doctor/medical
checks **should keep refusing**. Relaxing them individually would turn a deliberate boundary
into an accident of which script someone edited last. Whatever shape this takes, those guards
stay.

**It does not change what a release may do to production.** Applying migrations and deploying
remain exactly as they are, and the production Worker deploy remains Lutan's by his instruction
of 2026-10-02.

## Until it exists

The three facts above **stay "not established"**, and a release manager should keep recording
them that way rather than inferring them. `CLAUDE.md`: ask, or write "not established" — the
Home Assistant disk size is the example of what inferring costs.

Filed on the `backlog` branch as a feature stream's work; it is not release paperwork and was
not built inside the `0.40.0` record.
