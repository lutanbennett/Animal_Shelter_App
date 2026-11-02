-- fixture for the policy-role reader: a `--` and a `;` inside string literals must not hide the role name that follows
create policy "p_hidden" on public.map_rooms for select using (note = 'a--b;c' and current_user_role() = 'admin'::app_role);
