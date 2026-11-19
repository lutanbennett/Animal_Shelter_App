-- Proves the mechanism behind #stcnt: an update on site_content that matches no row raises no error
-- and touches 0 rows, which is what `.update(...).eq("id", true).select("id")` sees as an empty array.
-- Runs in one transaction and ends by raising, so nothing is kept.
do $$
declare n_present int; n_absent int; sid uuid;
begin
  select shelter_id into sid from site_content limit 1;
  update site_content set stocktaking_food_enabled = stocktaking_food_enabled where id = true and shelter_id = sid;
  get diagnostics n_present = row_count;
  delete from site_content where shelter_id = sid;
  update site_content set stocktaking_food_enabled = true where id = true and shelter_id = sid;
  get diagnostics n_absent = row_count;
  raise exception 'HARNESS OK: row present -> % row(s) updated; row deleted -> % row(s), no error raised', n_present, n_absent;
end $$;
