-- consumer: src/lib/adoption-updates/options.ts, src/app/adopter-update/actions.ts
-- #l5gxn app half. An adopter who sends news in themselves is a fifth way it comes in: 'app'. Recording it as
-- 'email' would tell staff something that did not happen. No card, no policy, no function: only the CHECK on
-- adoption_updates.channel grows (0097 said a new channel is one migration plus a line in each dictionary).
-- Re-runnable. To undo: re-create the 0097 constraint after moving any 'app' rows to another channel.

alter table adoption_updates drop constraint if exists adoption_updates_channel;
alter table adoption_updates add constraint adoption_updates_channel
  check (channel in ('line', 'facebook', 'email', 'visit', 'app'));
