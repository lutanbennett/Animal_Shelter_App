-- consumer: none
-- 0392's restrictive policies call is_trusted_caller(), and a policy expression runs with the querying role's rights. anon had no EXECUTE, so every
-- anon read of a table carrying a policy answered 401. Found by check-public-views.mjs straight after 0392 was applied to dev; kept as its own
-- file because 0392 was already applied and applied files are never edited.
-- The function is security invoker and reads one setting (the JWT role claim); it reads no table and decides nothing, so it lets anon do nothing new.
grant execute on function public.is_trusted_caller() to anon;
