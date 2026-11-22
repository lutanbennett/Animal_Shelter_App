# The product page rebuilt, and the product site's own search switch (#cjlnd, #cjseo)

**Date:** 2026-11-22. **Stream:** `claude/cooperjaidee-product-page`.

## Step zero

The gap was still there: five `max-w-prose` sections, no `/sitemap.xml` in `PLATFORM_KEEPS`, robots tied to the shelter lock. Built, not skipped.

## Page shape (#cjlnd)

Hero (kicker, headline, lead, "Ask about joining", "See what it does") beside a picture of the app; five alternating bands (words, picture) wider than `max-w-prose`; who it is for; a closing call to action; the three sign-in links in the foot. Existing tokens only. The page still reads no table and names no shelter; every link is plain.

## Screenshots: all 47 rejected, replaced by in-page mockups

Every PNG in `public/manual/` shows the sign-in header "LCA", a real shelter's name, and `resident-hub`, `vet-visit-new` and `resident-rehome` also show a real animal (Panda, R-0004). This page names no shelter (#apxld), so none can be used as captured. A clean re-capture needs Lutan to sign in to the capture script, and the shelter header would remain. So each picture is a small markup mockup (`ProductMockup.tsx`) of invented sample data ("Mali", "Tiger"). Costs over screenshots: they are illustrations, not the real screens. Gains: zero image weight, no layout jump, they read in Thai, they follow light and dark, and no real name can leak. Real captures can replace them later if Lutan wants.

## Robots decoupling (#cjseo)

A second Worker var, `PLATFORM_SEARCH`; only the exact word `open` opens it, so unset, empty or a typo is closed. On the platform host only this switch counts (robots.txt, the `X-Robots-Tag` header in `proxy.ts`, the page's robots metadata); on every other host the shelter lock counts exactly as before. Unlocking a shelter no longer opens the product site, and opening the product site no longer opens a shelter. Alternative: a host test and a state in `PUBLIC_SITE` itself. It would have needed a per-host value in a one-var-per-Worker setting, or a new header from the Worker. A separate var is one line of config and cannot be mistaken for the shelter's. It is **not set anywhere**; Lutan sets it.

## Sitemap

`/sitemap.xml` is now in `PLATFORM_KEEPS`; `src/app/sitemap.ts` has a four-line branch at the top that hands the platform host to `platformSitemap()` (the product page in English and Thai with hreflang), so no shelter table is read on that host. Shelter behaviour is otherwise untouched. A separate route was not cleaner: the path is the same on both hosts, so the host has to choose either way. `/th/platform/about` was also added to `PLATFORM_KEEPS` so the Thai twin is served rather than redirected.

## Metadata and keywords

Title "Animal shelter management software | CooperJaidee" / "โปรแกรมจัดการศูนย์พักพิงสัตว์ | CooperJaidee", canonical, hreflang, Open Graph, Twitter card, `SoftwareApplication` JSON-LD. Starter phrases used: *software to manage an animal shelter* (English h1), *animal shelter management software* (title), *shelter management software* (kicker), Thai *โปรแกรมจัดการศูนย์พักพิงสัตว์* (h1, title), *ระบบจัดการศูนย์พักพิงสัตว์* (kicker, description). No Open Graph image: the only logo on the host is the shelter's.
