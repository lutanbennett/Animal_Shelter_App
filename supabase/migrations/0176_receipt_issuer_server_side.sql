-- consumer: src/app/management/donations/actions.ts, src/lib/donations/issuer.ts
--
-- A donation receipt names its issuer from the server, never from the caller (backlog: "issue_donation_receipt
-- takes the issuer from the caller, so the API can issue a receipt naming any organisation", found by the
-- multi-tenancy spike, 2026-10-09).
--
-- WHAT WAS POSSIBLE. 0168's issue_donation_receipt() is security definer and stored whatever p_issuer it was
-- handed. The app always passes receiptIssuer(country), so every receipt on screen looked right, but anyone
-- holding donation.receipt (Admin, Management) could call /rest/v1/rpc/issue_donation_receipt directly with any
-- name and address, and get a correctly numbered LCA receipt in that organisation's name, stored in the register
-- as though it were real. That undid the deliberate hard-coding in src/lib/donations/issuer.ts (Lutan, 2026-10-09:
-- a receipt must not read a field anyone can edit) — a parameter is a field anyone can edit.
--
-- THE FIX. receipt_issuer(country) below is a SQL mirror of receiptIssuer() in issuer.ts, and the RPC stores
-- that. A function, not a receipt_issuers table: a table is another thing someone could edit, which is the very
-- problem; a function changes only by a migration, which is the review step, as a deploy is for issuer.ts.
-- scripts/check-donation-receipts-schema.mjs reads issuer.ts and fails if the two copies ever disagree, and
-- fails if a forged p_issuer is stored. Change both copies together.
--
-- p_issuer IS KEPT AND IGNORED, for compatibility: dropping it changes the signature, and an app deployed before
-- or after this migration would then fail to issue receipts. Accepted and discarded, so the deploy order does not
-- matter. A later small migration can drop the argument once the app stops passing it. DO NOT reinstate it: the
-- issuer is built here precisely so that no caller can choose it.
--
-- At multi-tenancy receipt_issuer() becomes a per-shelter lookup with its own protections
-- (docs/decisions/2026-10-09-multi-tenancy-spike.md, "What fought back" §6); the RPC still never takes it from the
-- caller. docs/decisions/2026-10-10-receipt-issuer-server-side.md.
--
-- Already-issued receipts are not touched: the register is never rewritten (0168's guard trigger), and dev's
-- probe receipts are disposable. Re-runnable: create or replace throughout.

-- ---------------------------------------------------------------------------
-- 1. The issuer, per receipt country: the SQL copy of receiptIssuer()
-- ---------------------------------------------------------------------------

create or replace function receipt_issuer(p_country text)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  -- The Thai foundation: who actually receives every gift today.
  v_th jsonb := jsonb_build_object(
    'name', 'Lanna Care for Animals Foundation',
    'addressLines', jsonb_build_array(
      '291 Moo 1 Ban Tong-Sala, Soi 7, Don Pao,',
      'Mae Wang District, Chiang Mai 50360, Thailand'
    ),
    'registrationLines', '[]'::jsonb,
    'statementLines', '[]'::jsonb
  );
begin
  if p_country = 'TH' then
    return v_th;
  elsif p_country = 'US' then
    -- US tax status is being sought (Lutan, 2026-10-09). Until there is a US entity, issuer.ts's US entry is empty
    -- and receiptIssuer() falls back to the Thai name and address, with the US's own (empty) registration and
    -- statement lines. When the status lands, fill in issuer.ts and this branch in the same PR.
    return v_th;
  end if;
  raise exception 'No receipt issuer for country %', p_country using errcode = '22023';
end;
$$;

comment on function receipt_issuer(text) is
  'The issuer block printed on a donation receipt, per country (0176). Mirrors receiptIssuer() in src/lib/donations/issuer.ts; check-donation-receipts-schema.mjs fails if they differ. Deliberately code, not a table: a receipt must not read a field anyone can edit.';

revoke execute on function receipt_issuer(text) from public, anon;
grant execute on function receipt_issuer(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Issuing stores receipt_issuer(), whatever p_issuer says
-- ---------------------------------------------------------------------------

create or replace function issue_donation_receipt(
  p_donation_id uuid,
  p_country text,
  p_issued_on date,
  -- ACCEPTED AND DISCARDED (0176), only so callers that still pass it keep working. Never read it: the issuer is
  -- built by receipt_issuer() so that no caller can put another organisation's name on a receipt.
  p_issuer jsonb,
  p_content jsonb
)
returns donation_receipts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value bigint;
  v_row donation_receipts;
  v_issuer jsonb;
begin
  if not (select has_permission('donation.receipt')) then
    raise exception 'Not allowed to issue a donation receipt' using errcode = '42501';
  end if;
  if not exists (select 1 from donations where id = p_donation_id) then
    raise exception 'No such donation';
  end if;
  -- An unknown country is refused by the table's check constraint, as before (23514), before a number is taken.
  if p_country not in ('TH', 'US') then
    raise exception 'Receipt country must be TH or US' using errcode = '23514';
  end if;
  v_issuer := receipt_issuer(p_country);

  update receipt_counters
     set next_value = next_value + 1
   where series = 'LCA'
  returning next_value - 1 into v_value;
  if v_value is null then
    raise exception 'Receipt counter LCA is missing';
  end if;

  insert into donation_receipts (number, donation_id, country, issued_on, issued_by, content, issuer)
  values ('LCA' || lpad(v_value::text, 7, '0'), p_donation_id, p_country, p_issued_on, auth.uid(), p_content, v_issuer)
  returning * into v_row;

  return v_row;
end;
$$;

comment on function issue_donation_receipt(uuid, text, date, jsonb, jsonb) is
  'The only way a receipt row is made (0168). The issuer comes from receipt_issuer(); p_issuer is accepted and ignored (0176) and must not be reinstated.';

revoke execute on function issue_donation_receipt(uuid, text, date, jsonb, jsonb) from public, anon;
grant execute on function issue_donation_receipt(uuid, text, date, jsonb, jsonb) to authenticated, service_role;
