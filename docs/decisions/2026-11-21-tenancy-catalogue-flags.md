# 2026-11-21 — #tncy3: the three tenancy-catalogue flags

The lint (`check-tenancy-catalogue.mjs --strict --tenant-role rls_definer`) exited 1 at every release from 0.47.2. None of the three flags was a leak.

- **(a) `product_admin_permit_first_login` stays owned by `postgres`, and is allowed by name.** It reads `auth.users`, which `rls_definer` is refused (42501); 0425 line 67 says so, with precedents 0417 and 0370. **Do not "fix" it by re-owning it: first login would break.**
- **(b) `product_admin_login_grants`**: 0425 enabled RLS with no `definer_all` policy, so views over it read 0 rows. 0434 adds the policy (blank page, not a leak).
- **(c) `set_shelter_logo`**: 0429 omitted the `owner to rls_definer` line. 0434 adds it; it reads no `auth.users` and 0431 already scopes its body.

**Allow-list shape: by name stays.** Five of the seven entries share the one reason (reads `auth.users`), which suggests testing the reason. Rejected: that needs parsing function bodies, and misses dynamic SQL (`label_translations` reaches `auth.users` that way). A by-name entry also forces a person to write the reason and goes STALE when the object goes. Revisit if the list passes ~12.

Production check, for the planner after merge and after 0434 is applied there: `node scripts/check-tenancy-catalogue.mjs --env production --strict --tenant-role rls_definer`
