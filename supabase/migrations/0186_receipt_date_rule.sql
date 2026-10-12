-- consumer: src/app/management/donations/actions.ts, src/lib/donations/donations.ts
--
-- A donation receipt's date must fall between the donation and today (backlog: "issue_donation_receipt still takes
-- the receipt date (p_issued_on) from the caller, so the API can backdate a receipt into another tax year", found
-- by receipt-content-server-side, 2026-10-10).
--
-- WHAT WAS POSSIBLE. The RPC is security definer and stored p_issued_on as given. Anyone holding donation.receipt
-- could call /rest/v1/rpc/issue_donation_receipt directly and get the next number dated last December.
--
-- THE RULE (ruled by Lutan 2026-10-11): received_on <= issued_on <= shelter_today().
--   * A backdated receipt is legitimate: a donor often asks for the receipt a week later. So this is NOT today-only.
--   * Never before the donation: that is not a late receipt, it is a wrong one.
--   * Never in the future: a receipt dated into next tax year is what a tax check reads first.
--   * "Today" is the shelter's (Asia/Bangkok, shelter_today(), 0073), not UTC, or a receipt issued in the Thai
--     evening would be refused as future-dated.
--
-- UNLIKE 0176 (p_issuer) AND 0177 (p_content), p_issued_on IS NOT IGNORED. Those two were accepted and discarded
-- because only the server should decide them. Here the caller's date is legitimate input, so it is VALIDATED and
-- then stored. Do not "tidy" this into the accept-and-ignore pattern, and do not narrow it to today-only.
-- A null date is refused too (the column is not null; this gives a clear message before a number is taken).
--
-- Refused with 22023 (invalid_parameter_value) before the counter moves, so a refusal leaves no gap in the numbers.
-- Signature unchanged, so an app deployed before or after this migration keeps working. Already-issued receipts
-- are not touched (the register is never rewritten, 0168). Re-runnable: create or replace.

create or replace function issue_donation_receipt(
  p_donation_id uuid,
  p_country text,
  p_issued_on date,
  -- ACCEPTED AND DISCARDED (0176), only so callers that still pass it keep working.
  p_issuer jsonb,
  -- ACCEPTED AND DISCARDED (0177), for the same reason.
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
  v_received date;
begin
  if not (select has_permission('donation.receipt')) then
    raise exception 'Not allowed to issue a donation receipt' using errcode = '42501';
  end if;
  select received_on into v_received from donations where id = p_donation_id;
  if not found then
    raise exception 'No such donation';
  end if;
  -- An unknown country is refused by the table's check constraint, as before (23514), before a number is taken.
  if p_country not in ('TH', 'US') then
    raise exception 'Receipt country must be TH or US' using errcode = '23514';
  end if;
  if p_issued_on is null then
    raise exception 'A receipt needs a date' using errcode = '22023';
  end if;
  if p_issued_on < v_received then
    raise exception 'A receipt cannot be dated before the donation it is for' using errcode = '22023';
  end if;
  if p_issued_on > shelter_today() then
    raise exception 'A receipt cannot be dated in the future' using errcode = '22023';
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
  'The only way a receipt row is made (0168). Issuer from receipt_issuer() (0176), content from receipt_content() (0177); p_issuer and p_content are ignored. p_issued_on is validated (0186): received_on <= issued_on <= shelter_today(), not ignored.';

revoke execute on function issue_donation_receipt(uuid, text, date, jsonb, jsonb) from public, anon;
grant execute on function issue_donation_receipt(uuid, text, date, jsonb, jsonb) to authenticated, service_role;
