# 2026-11-23 — Recent changes marks a change made from outside the shelter (#a4k2p)

**Derivable at read time, so no migration and nothing owed to what `0438` writes.** An audit row carries only the actor's uuid. An entry
is marked when its actor is (1) in `product_admins` and (2) not one of the shelter's own logins (the user list the page already loads for
the Who column). `product_admins` is read with the service-role client the page already imports, for the few actors on the page that are not
the shelter's own; the emails of those few come from the auth admin API. Nothing is written.

**No role is named.** The test is "a product administrator who is not in this shelter's login list", not a role key, so a shelter may call
its roles anything. Admin is unaffected.

**On screen:** an "Outside the shelter" badge beside the actor's email in the Who column. Thai: "จากภายนอกศูนย์". Chosen over "Product administrator"
because the shelter needs to know the person is not theirs, not what the vendor calls its staff.

**Deliberately not marked:** a product administrator who is also one of the shelter's own logins (they act as the shelter's member, so the
shelter already knows them); system and calendar entries; anything about what can be undone (unchanged).

**Proof (dev, 2026-11-24):** a supplier row was written on `pcf-proof` with the product administrator as actor (`app.actor`, as 0195 allows
for service-role scripts), then `/admin/recent-changes` was read as that shelter's Admin at aal2 in headless Chrome: the new entry and the
older console entries show the badge. **Not shown:** an own-login row beside them, because that shelter had none; the unmarked case rests on the
`ownIds` check in `page.tsx`. (`test-shelter-2` could not be used: another stream's throwaway Admin holds its one Admin slot.)
