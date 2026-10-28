# Add medical photos card may now view Medical photos (0279)

Lutan, 2026-10-28, asked directly: *"Yes add medical photos should also be able to view medical photos."*

`0276` note 4 deliberately did not grant `photos.resident_medical` to `add_medical_photos` (his earlier ruling: "decrease to just what is
required"). It said giving the read later is one `card_grants` row, not code. `0279` is that row, at read (level 1). No app or policy
change: the gallery, the uploader and `attachments_select_perm` already ask the activity. The effect is that a Medical photo filed by
this card's holders is shown back to them instead of "filed but never shown back".

Production: apply `0279` with the next release. `-- consumer: none`, so order against the deploy does not matter.
