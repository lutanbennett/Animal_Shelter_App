-- consumer: src/app/management/donations/actions.ts, src/lib/donations/donations.ts
--
-- What a donation receipt says is built by the server from the donation, never taken from the caller (backlog:
-- "issue_donation_receipt also takes what the receipt says (p_content: donor name, lines, total) from the caller,
-- so the API can issue a receipt for an amount nobody gave", found by receipt-issuer-server-side, 2026-10-10).
--
-- WHAT WAS POSSIBLE. issue_donation_receipt() is security definer and, after 0176, still stored whatever p_content
-- it was handed. The app always passes receiptContentFor(donation.donor_name, lines), so every receipt on screen
-- matched its donation, but anyone holding donation.receipt (Admin, Management) could call
-- /rest/v1/rpc/issue_donation_receipt directly and get a correctly numbered receipt saying 1,000,000 baht for a
-- 100-baht gift, stored in the register as though printed from the donation. Measured on dev before this file:
-- check-donation-receipts-schema.mjs, as a real Management login, stored exactly that.
--
-- THE FIX. receipt_content(donation) below is a SQL mirror of receiptContentFor() in src/lib/donations/donations.ts,
-- beside 0176's receipt_issuer(), and the RPC stores that. It must agree with the app to the character, because a
-- mismatch would silently change every future receipt, not only forged ones:
--   donorName  donations.donor_name as typed. Never the linked contact's name (0168: a contact can be renamed).
--   lines      donation_lines in position order, each {description, amount}; amount null for an in-kind line.
--   amounts    trim_scale(): numeric(12,2) 1200.50 is stored as 1200.5 and 250.00 as 250, which is what JS's
--              Number() gives the app. Without it the receipt would read the same but the stored JSON would not.
--   total      the exact numeric sum of the priced lines, 0 when there are none (all in kind, or no lines at all).
--              receiptTotal() sums in satang to get the same exact figure in floating point.
--   currency   'THB'.
-- scripts/check-donation-receipts-schema.mjs builds the expected value with receiptContentFor() itself, on probe
-- donations covering each rule above and on every real donation on dev, and compares as text. Change both copies
-- together.
--
-- Security invoker on purpose: called by an API login it reads only what that login's RLS shows (the 2IC gets
-- null), and called from the security definer RPC it reads as the definer, as the RPC already did.
--
-- p_content IS KEPT AND IGNORED, for compatibility, exactly as 0176 did with p_issuer: dropping it changes the
-- signature, and an app deployed before or after this migration would then fail to issue receipts. DO NOT
-- reinstate it: the content is built here precisely so that no caller can choose it. A later small migration can
-- drop both ignored arguments once the app stops sending them. docs/decisions/2026-10-10-receipt-content-server-side.md.
--
-- Already-issued receipts are not touched: the register is never rewritten (0168's guard trigger). Re-runnable:
-- create or replace throughout.

-- ---------------------------------------------------------------------------
-- 1. What a receipt says, from its donation: the SQL copy of receiptContentFor()
-- ---------------------------------------------------------------------------

create or replace function receipt_content(p_donation_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'donorName', d.donor_name,
    'lines', coalesce(
      (select jsonb_agg(jsonb_build_object('description', l.description, 'amount', trim_scale(l.amount)) order by l.position)
         from donation_lines l
        where l.donation_id = d.id),
      '[]'::jsonb),
    'total', trim_scale(coalesce((select sum(l.amount) from donation_lines l where l.donation_id = d.id), 0)),
    'currency', 'THB'
  )
  from donations d
  where d.id = p_donation_id
$$;

comment on function receipt_content(uuid) is
  'What a donation receipt prints, built from the donation and its lines (0177). Mirrors receiptContentFor() in src/lib/donations/donations.ts; check-donation-receipts-schema.mjs fails if they differ. Null for a donation the caller cannot see.';

revoke execute on function receipt_content(uuid) from public, anon;
grant execute on function receipt_content(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Issuing stores receipt_content(), whatever p_content says
-- ---------------------------------------------------------------------------

create or replace function issue_donation_receipt(
  p_donation_id uuid,
  p_country text,
  p_issued_on date,
  -- ACCEPTED AND DISCARDED (0176), only so callers that still pass it keep working. Never read it: the issuer is
  -- built by receipt_issuer() so that no caller can put another organisation's name on a receipt.
  p_issuer jsonb,
  -- ACCEPTED AND DISCARDED (0177), for the same reason. Never read it: the content is built by receipt_content()
  -- from the donation so that no caller can issue a receipt for an amount nobody gave.
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
  v_content jsonb;
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
  v_content := receipt_content(p_donation_id);

  update receipt_counters
     set next_value = next_value + 1
   where series = 'LCA'
  returning next_value - 1 into v_value;
  if v_value is null then
    raise exception 'Receipt counter LCA is missing';
  end if;

  insert into donation_receipts (number, donation_id, country, issued_on, issued_by, content, issuer)
  values ('LCA' || lpad(v_value::text, 7, '0'), p_donation_id, p_country, p_issued_on, auth.uid(), v_content, v_issuer)
  returning * into v_row;

  return v_row;
end;
$$;

comment on function issue_donation_receipt(uuid, text, date, jsonb, jsonb) is
  'The only way a receipt row is made (0168). The issuer comes from receipt_issuer() and the content from receipt_content(); p_issuer (0176) and p_content (0177) are accepted and ignored and must not be reinstated.';

revoke execute on function issue_donation_receipt(uuid, text, date, jsonb, jsonb) from public, anon;
grant execute on function issue_donation_receipt(uuid, text, date, jsonb, jsonb) to authenticated, service_role;
