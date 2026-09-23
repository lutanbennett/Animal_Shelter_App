-- Cashflow forecast, part 1 of 2: the prices the forecast has nowhere to
-- read from yet (backlog, Management: "Cashflow forecast: what the shelter
-- is about to spend, in one place").
--
-- Schema only, and deliberately nothing else. Every cost the system already
-- forecasts is either already money (maintenance.estimated_cost, 0033) or
-- has a price attached (diet_forecast, 0051). Two do not: medication is
-- forecast as a quantity in its dose_unit (medication_forecast, 0044) with
-- no price per unit, and immunizations have a due-date interval
-- (immunization_types.interval_months, 0007) but no price at all. Vet
-- visits have vet_appointments.cost (0053), but that is what a visit *did*
-- cost and is null until the invoice arrives, so a forward-looking figure
-- needs an estimate to stand in.
--
-- All three columns are nullable with no default and no back-fill: null
-- means "nobody has priced this yet", which the forecast page must show as
-- a gap rather than as zero — a silent zero in a cashflow forecast is worse
-- than a visible hole. Nothing reads these columns until the feature branch
-- lands, so this file is additive and changes no existing behaviour.
--
-- Re-runnable throughout (add column if not exists / drop constraint if
-- exists before add), like every file here.

-- =========================================================================
-- 1. medication.cost_per_unit — the price of one dose_unit
-- =========================================================================
-- Priced per dose_unit, not per pack, so it multiplies straight through
-- medication_forecast's `quantity` (which is already in dose_unit) without
-- the forecast needing to know pack sizes. A medication bought by the box
-- is priced as box price / doses per box.

alter table medication
  add column if not exists cost_per_unit numeric(12, 2);

alter table medication
  drop constraint if exists medication_cost_per_unit_nonnegative;

alter table medication
  add constraint medication_cost_per_unit_nonnegative
    check (cost_per_unit is null or cost_per_unit >= 0);

comment on column medication.cost_per_unit is
  'Baht per one dose_unit (per tablet, per ml). Multiplied by medication_forecast.quantity for the cashflow forecast. Null means not priced yet — the forecast shows that as a gap, never as zero.';

-- =========================================================================
-- 2. immunization_types.cost — the price of one dose
-- =========================================================================
-- Per dose administered, so it multiplies the doses falling due in the
-- window (derived from interval_months and the last dose, 0007). Note the
-- table is `immunization_types`, plural, as 0001 created it.

alter table immunization_types
  add column if not exists cost numeric(12, 2);

alter table immunization_types
  drop constraint if exists immunization_types_cost_nonnegative;

alter table immunization_types
  add constraint immunization_types_cost_nonnegative
    check (cost is null or cost >= 0);

comment on column immunization_types.cost is
  'Baht for one dose of this immunization. Multiplied by the doses falling due in the window for the cashflow forecast. Null means not priced yet — shown as a gap, never as zero.';

-- =========================================================================
-- 3. site_content.vet_visit_estimate — one flat figure per booked visit
-- =========================================================================
-- The user's decision, 2026-09-22: a single editable "typical vet visit"
-- figure in baht rather than a per-vet or per-reason average. There is not
-- enough cost history in vet_appointments.cost for an average to mean
-- anything yet; a per-vet average is the natural successor once a few
-- months of invoices are in, and is a follow-up, not this item. A booked
-- visit that already carries a real cost uses that figure instead.
--
-- It sits on site_content because that is the app's only singleton
-- settings row and /admin/website is where singletons are edited. Two
-- things follow from that, both deliberate:
--   - site_content is public-read (0018: `using (true)`), so this figure is
--     world-readable like the rest of the row. A typical-vet-visit cost is
--     not sensitive, but a genuinely sensitive figure — salaries, rent —
--     does not belong on this table. Put those behind their own table with
--     its own policy.
--   - it is NOT added to SITE_CONTENT_COLUMNS (src/lib/site/content.ts).
--     Every public page loads that column list, and there is no reason to
--     ship an internal cost figure in the payload of the landing page. The
--     admin page and the forecast read it through their own query.
-- Writes stay admin-only via the existing admin_update_site_content policy.

alter table site_content
  add column if not exists vet_visit_estimate numeric(12, 2);

alter table site_content
  drop constraint if exists site_content_vet_visit_estimate_nonnegative;

alter table site_content
  add constraint site_content_vet_visit_estimate_nonnegative
    check (vet_visit_estimate is null or vet_visit_estimate >= 0);

comment on column site_content.vet_visit_estimate is
  'Baht for a typical vet visit, edited on /admin/website. Stands in for vet_appointments.cost on visits booked but not yet invoiced. Null means not priced yet — the forecast shows the vet row as a gap, never as zero.';

notify pgrst, 'reload schema';
