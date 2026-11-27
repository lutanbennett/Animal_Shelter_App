-- consumer: none (no code writes a null shelter_id here; worker/shelter.mjs reads resolve_shelter_site(), which already handles a null id)
--
-- #shnul: shelter_hosts.shelter_id is NULLABLE by design and this restores that shape. Reasoning:
-- docs/decisions/2026-11-27-shelter-hosts-shelter-id-nullable.md.
-- 0382 declared it nullable on purpose: a row with shelter_id null is the explicit platform front door, which shelter_host_kind() tells
-- apart from an unknown host. 0426, 0428 (shelter_hosts_primary_has_shelter), 0445 and 0447 were all written on that shape.
-- It was lost by two blanket sweeps that did not exclude this table: 0390 stamped every null shelter_id with Lanna (front-door rows
-- included) and gave every shelter_id column the default current_shelter_id(); 0397 then set NOT NULL on every shelter_id column.
-- Measured on dev 2026-11-27: is_nullable=NO, and cooperjaidee.org / www.cooperjaidee.org point at Lanna.
--
-- WHAT THIS DOES: drops NOT NULL and drops the current_shelter_id() default on this one table, so a front-door row is written only by
-- an explicit null, never by a missing header. Every other table keeps 0397's NOT NULL: they hold shelter data, this is a routing map.
-- WHAT THIS DOES NOT DO: it does not set the two cooperjaidee.org rows back to null. That would change which shelter header the live
-- apex sends on production, which this stream cannot read; it is left as a recorded finding in the decision file.
-- Schema only; running behaviour is unchanged (0414's only insert passes shelter_id). Re-runnable.
-- TO UNDO: alter table public.shelter_hosts alter column shelter_id set default public.current_shelter_id(),
--          alter column shelter_id set not null;   (fails if a null row has since been written, as it should)

alter table public.shelter_hosts alter column shelter_id drop not null;
alter table public.shelter_hosts alter column shelter_id drop default;
