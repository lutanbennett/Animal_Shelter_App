# Switching a lifetime figure no longer moves its "last set" stamp (#s4t7q, migration 0331)

**Changed:** the function `impact_baselines_stamp()` (defined only in `0156`, trigger of the same name, `before insert or update`, unchanged).

**Rule now:** on insert, and on an update where `baseline_count`, `baseline_date` or `since_year` changes, `set_by`/`set_at` come from `auth.uid()`/`now()`. On any other update they are pinned to their old values. "The number" is those three columns; `label`, `label_th` and `show_on_website` are wording and visibility, so they do not move the stamp.

**Shape chosen: tests inside the function, one trigger.** A trigger `when` clause cannot reference `old` on an insert, so one `when` cannot cover both; two triggers would be two objects to keep in step. The function also pins the stamp to OLD on a visibility update, so a `set_at` supplied in the request is still ignored (the forgery guard of 0156 is kept, not weakened).

**Proved in a `begin … rollback` harness on dev** (a), toggling `show_on_website` off then on leaves `set_at` identical (backdated to 2020 first, because `now()` is constant within a transaction); (b) a `baseline_count` change moves it; (c) an insert stamps even when a `set_at` is supplied; (d) a forged `set_at` is ignored on a visibility update and on a number edit.

**Other writers of the row:** the Settings edit action writes only the three number columns; the switch action writes only `show_on_website`; Recent changes undo restores rows. Nothing else updates it. Saving the editor with unchanged values no longer moves the stamp, which is correct. The write is `website.content` at edit; no card changed.

**Owed:** production apply of `0331` (release manager, `--env production`). No app code changed.
