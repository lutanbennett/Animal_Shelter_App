-- consumer: src/app/platform/actions.ts (loginExists)
-- #adrus. 0417's product_admin_login_exists refused any address containing % _ or *, to stop a wildcard becoming a search. It compares
-- by EQUALITY (lower(u.email) = p_email), never LIKE, so none of those characters is a wildcard there, and an underscore is ordinary in
-- the local part of a real address (jane_doe@example.org): the check turned a valid address into "not an email address" and the console
-- showed the refusal with no explanation. The shape check stays (one @, no whitespace, a dot after it). The other functions in 0417
-- never had the restriction. 0417 is applied and not edited. Re-runnable. TO UNDO: re-create the function with the 0417 pattern.
create or replace function public.product_admin_login_exists(p_email text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_product_admin() then raise exception 'product admin only' using errcode = '42501'; end if;
  if (select auth.jwt() ->> 'aal') is distinct from 'aal2' then raise exception 'second step (aal2) required' using errcode = '42501'; end if;
  p_email := lower(btrim(coalesce(p_email, '')));
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'not an email address' using errcode = '22023'; end if;
  return exists (select 1 from auth.users u where lower(u.email) = p_email);
end;
$$;
