# Public pages share one frame (2026-10-30)

Lutan: the About & Visiting us page was a narrow strip on a PC, and other pages did the same.

**Frame.** `PUBLIC_FRAME` in `src/lib/site/frame.ts` is the home page's: up to 1440 px, side padding 24 / 48 / 32 / 64 px by breakpoint (phone unchanged at 24). Every public page uses it: the six information pages (through `SitePageArticle`, which the Settings → Website preview also draws), Adopt, Friends, Our work and a project page, Shop, Privacy, not-found, adoption journey and story pages. Appeals and a resident's adoption page had 1152 px headers and grids; those are now 1440 px.

**Reading width.** Text never runs the full frame. On the information pages the body sits in a 44 rem column and the contact card, Shelter Friends mention and "also see" links move to a sticky side column from `lg`; below `lg` the order is the one phones always had. Text-only pages (Privacy, not-found, journey, story) keep a 3xl measure, left-aligned, through `[&>*]:max-w-3xl`.

**Appeals question.** `/appeals/[id]` is drawn by `src/app/appeals/AppealView.tsx`: header and grid were `max-w-6xl`, the text column `max-w-3xl`. Header and grid follow the frame, the text column stays narrow.

**Found, not fixed.** About's visiting and registration details (`afterIntro`) stay in the main column, not the side one: moving them would change the phone order.
