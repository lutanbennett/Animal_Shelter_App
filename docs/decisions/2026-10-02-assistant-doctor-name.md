# 2026-10-02: The assistant's vet booking keeps the doctor, as free text the database links

Backlog item "Doctor name through the assistant's vet booking", raised 2026-09-24.

## The premise was checked before building

The item was written against `vet_appointments.doctor_name` (`0074`), free text.
Since then `0102` added the per-clinic roster `vet_doctors`, and the brief for
this stream asked whether writing a string now bypasses the guarantee the roster
exists to give. It does not. `/vet-visits/new` still sends the doctor as free text:
`bookVetVisit` passes `p_doctor_name` to `schedule_bulk_appointments`, and the
database (not the form) trims it, finds or adds the clinic's `vet_doctors` row and
links the visit in the same transaction. The form's roster is a `<datalist>` of
suggestions, not a gate.

So the assistant does exactly what the form does: `assistantBookVetVisit` passes
`p_doctor_name`. There is no second write, and the same trigger keeps the
visit's doctor on the visit's clinic.

## Choices

- **Only a title opens a name** ("Dr", "Dr.", "doctor", "หมอ", "น.สพ.", "สพ.ญ."). A
  bare "with Somchai" might be the clinic, so it is not read as a doctor.
  Generic uses ("book a doctor visit", "นัดหมอให้ Panda") name no one.
- **Parsed before, and independently of, the vet match.** `VET_STOPWORDS` still
  strips the titles when matching the *vet*; the doctor is read from the whole
  sentence, and vet matching is unchanged.
- **Never asked for.** No "which doctor?" step. A booking with no doctor is valid.
- **An unmatched name is shown, not dropped, and not blocked.** The card compares
  the name with the clinic's active doctors: exact (ignoring case/spacing) is
  silent; the same person under another spelling ("Somchai" vs "Dr Somchai",
  via `doctorNameCore`) offers a one-tap "Use …"; otherwise it says the name will
  be added to the clinic's list. Refusing it would make the assistant stricter
  than the form, and the roster fills itself from typed names by design.
- **Revisit with "a doctor can work at more than one clinic".** That item moves the
  doctor/clinic guarantee onto a link table; this change calls the same RPC
  parameter, so it needs no change unless the RPC's signature does.

No migration. `assistant_actions` is untouched (the draft JSON gained `doctorName`).
