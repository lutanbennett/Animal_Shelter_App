# Residents list: Select all, and what it leaves out

2026-10-09, `claude/residents-select-all`.

**Select all ticks every listed resident except the deceased and the adopted.**
Both forms the ticks feed (Book clinic visit, Log immunizations) build their
pickers with `NOT_DECEASED`, so a deceased id in the link is dropped without a
word: ticking them would make "Book clinic visit (23)" open a form with 21.
Adopted residents are accepted by the forms, but they are no longer the
shelter's to book or vaccinate, and "Show all" or a name search is the usual way
they land in a zone-less list by accident. Both can still be ticked by hand, one
row at a time, so the rare deliberate case is not blocked. The header label and
the count line say how many were left out, so the number is never a lie.

**A change of filters drops ticks that are no longer listed, and says so.** The
filters navigate on the client, so `ResidentsTable` and its `selected` set
survive a change of zone or search. Before this, a resident hidden by the new
filters stayed ticked and went into the booking link. We drop rather than clear
everything: toggling Show all, or narrowing a search, keeps the ticks still on
screen, which is what the user can see and expects. The drop happens during
render (the "adjust state when a prop changes" pattern), not in an effect, so
the action buttons never render once with the hidden ids in their links.

**Desktop only**, like the row tick boxes (phones pick several residents from
the forms themselves). The list is not paged, so "all" is every row on screen.
