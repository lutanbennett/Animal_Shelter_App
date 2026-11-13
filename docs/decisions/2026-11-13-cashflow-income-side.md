# The cashflow forecast gets an income side (#nwhpn)

**2026-11-13.** Split out of `#ss2s0`: the forecast projected outgoings and never read the donations the shelter had recorded.

## The labelling rule (chosen before building)

Recorded donations are **history**; the outgoings are a **projection**. The rule is:

- **Past months as measured actuals, plus one average of them, and nothing about any future month.** The page shows the last six *complete* calendar months of recorded gifts (a table headed "Gifts received (recorded, not a forecast)"), their average per month, and "average gifts minus outgoings per month" (past average against the forecast monthly outgoings). The chart carries the same average as one dashed horizontal line labelled "Past average gifts X/month".
- **Rejected: carrying the average forward as projected income per future month.** It would draw a guessed future beside a measured one in the same bars, which is the one outcome worse than no income line. The reference line is labelled as a past average, so it cannot be read as a promise.
- **Rejected: actuals as columns on the forecast's own months.** The forecast window is the *next* 30/90 days; recorded gifts for those months cannot exist yet. Past months have no outgoings in the forecast either, so there is nothing to pair them with.
- The current (part) month is excluded: a part month would drag the average down for a reason that is not giving.

## Amounts

From `donation_lines.amount` joined to `donations` by `received_on` (`donations.received_on` is `date not null`, 0168, so there is **no undated donation to place**). A donation with several lines counts **once**, by its date, for the sum of its priced lines. Sums are in satang, not floats. A donation whose every line is in kind (`amount` null) has no figure: it is not summed, and the month shows "+N in kind" so it is not silently dropped.

## The gate

Reading gifts is **not** the cashflow page's activity. The donations register asks `donation.receipt` (RLS `has_permission('donation.receipt')`, 0168; `/management/donations/page.tsx` and `giftsReceivedOn` in `reads.ts` ask the same). The page calls `can(perms, "donation.receipt")`, **does not even query donations when false**, and hands the view `income = null`, which draws nothing, not even a heading. The database policy would return no rows regardless; the check is the courtesy, the RLS is the security. No role key is read. Admin is unaffected (`perms.isAdmin`).

## Finding for the planner to file

`donation.receipt` is `yesno`, so only a login that may *issue receipts* can see the income side. A reading login (a treasurer who may see totals but not issue receipts) cannot be given this without that. **A levelled donations-read activity is probably what this really wants**; I did not add a read level to `donation.receipt`, because `#00e3u` records that the existing screens ask it as yes/no and widening it widens them.

## Not done

No forecast of future gifts; no change to what is recorded or to what `donation.receipt` grants; nothing tax- or receipt-shaped (`#00e3u`, `#99zuk`).
