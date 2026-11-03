-- consumer: none (0305 uses these values in bill_owner_can(), and the interface half of the bills-sites work reads them)
-- Bills, sites and kinds, part 1 of 2: the two attachment owner types a utility bill and a general bill can hang on.
--
--   utility_bill   a utility bill (water, electricity, ...)   (bills.utilities)
--   general_bill   a bill of any other kind, Other included   (bills.general)
--
-- A file that adds an enum value cannot also use it: the runner wraps each file in its own transaction
-- (CLAUDE.md "Database migrations"), so 0305 uses these. 0188 and 0189 split the same way for the same reason.
-- A --dry-run of 0305 on its own will report FAILED for that reason and it is not a fault in 0305.
-- Re-runnable.

alter type attachment_owner_type add value if not exists 'utility_bill';
alter type attachment_owner_type add value if not exists 'general_bill';
