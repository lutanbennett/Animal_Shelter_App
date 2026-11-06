-- Harness for 0328. Rolls back; success is the exception message it ends with.
begin;
do $$
declare
  b0 integer; d0 date; y0 smallint;
  b1 integer; d1 date; y1 smallint;
  n integer; v integer; before_stats record; after_stats record; ok boolean;
begin
  -- Lifetime figure: seed a baseline, switch off, check it leaves the view and keeps its numbers.
  update impact_baselines set baseline_count = 412, baseline_date = date '2026-01-01', since_year = 2019, show_on_website = true
   where key = 'animals_rehomed';
  select baseline_count, baseline_date, since_year into b0, d0, y0 from impact_baselines where key = 'animals_rehomed';
  select total into v from public_impact_figures where key = 'animals_rehomed';
  if v is null then raise exception 'FAIL: figure not public while on'; end if;

  update impact_baselines set show_on_website = false where key = 'animals_rehomed';
  select count(*) into n from public_impact_figures where key = 'animals_rehomed';
  if n <> 0 then raise exception 'FAIL: figure still public while off'; end if;
  select baseline_count, baseline_date, since_year into b1, d1, y1 from impact_baselines where key = 'animals_rehomed';
  if (b0, d0, y0) is distinct from (b1, d1, y1) then raise exception 'FAIL: switching off changed the baseline'; end if;

  update impact_baselines set show_on_website = true where key = 'animals_rehomed';
  select total into n from public_impact_figures where key = 'animals_rehomed';
  if n is distinct from v then raise exception 'FAIL: restored total % differs from %', n, v; end if;

  -- Live counts: all four on by default and non-null.
  select * into before_stats from public_shelter_stats;
  if before_stats.in_care is null or before_stats.in_foster is null or before_stats.adopted_this_year is null or before_stats.in_treatment is null then
    raise exception 'FAIL: a live count is null with every switch on';
  end if;

  update public_stat_switches set show_on_website = false where key = 'in_treatment';
  select * into after_stats from public_shelter_stats;
  if after_stats.in_treatment is not null then raise exception 'FAIL: in_treatment not null while off'; end if;
  if (after_stats.in_care, after_stats.in_foster, after_stats.adopted_this_year, after_stats.in_hospital)
     is distinct from (before_stats.in_care, before_stats.in_foster, before_stats.adopted_this_year, before_stats.in_hospital) then
    raise exception 'FAIL: switching in_treatment off moved another column';
  end if;
  update public_stat_switches set show_on_website = true where key = 'in_treatment';
  select * into after_stats from public_shelter_stats;
  if after_stats.in_treatment is distinct from before_stats.in_treatment then raise exception 'FAIL: in_treatment not restored'; end if;

  -- Keys are fixed.
  begin
    insert into public_stat_switches (key) values ('nonsense');
    raise exception 'FAIL: unknown key accepted';
  exception when check_violation then null; end;

  -- Audit: a switch change reaches audit_log.
  select count(*) into n from audit_log where table_name = 'public_stat_switches';
  if n < 2 then raise exception 'FAIL: switch changes not in audit_log (%)', n; end if;

  -- page:events accepted; Home still refused.
  update site_content set hidden_public_pages = array['page:events'];
  begin
    update site_content set hidden_public_pages = array['page:home'];
    raise exception 'FAIL: page:home accepted';
  exception when check_violation then null; end;

  -- Anon: can read both views, cannot read the switches table.
  set local role anon;
  select count(*) into n from public_shelter_stats;
  select count(*) into n from public_impact_figures;
  begin
    perform 1 from public_stat_switches;
    raise exception 'FAIL: anon can read public_stat_switches';
  exception when insufficient_privilege then null; end;
  reset role;

  raise exception 'HARNESS PASS: off keeps baseline %/%/% and restores total %; live in_treatment null when off, others untouched; audit, page:events, anon grants ok', b0, d0, y0, v;
end $$;
rollback;
