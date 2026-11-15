# A volume limit for the public report-an-animal form (#8t3rk), 2026-11-15

**Outcome: a recommendation for one Cloudflare setting, not code.** Nothing was built and nothing in Lutan's Cloudflare account was touched. The gap is **not closed until he applies the setting below.**

## Step zero
Nothing limits volume on this path today. `grep` for rate limit / Turnstile over `worker/`, `src/app/api/` and `wrangler.jsonc` finds only `worker/csp-report.mjs`, which caps its own *log lines*, not visitors. No earlier decision file covers it; `2026-11-14-report-animal-photo.md` (answer 5) and `2026-10-20-desexing-drives-page.md` both say a Worker limit was left out.
**Context:** `0377` (the photo bucket) is applied to dev, not production, so the photo half is not live there yet; this changes urgency only.

## Every endpoint a stranger can write to without a login (read from the code)
The list is **longer than the form**, so it widens the item:
1. `/services/report-animal`: server action `reportAnAnimal` (`src/app/services/report-animal/actions.ts`), with the optional photo in the same request. Anon insert plus a service-role bucket write. **No limit.**
2. `/services/sterilisation`: `signUpForDrive`. Anon insert. **Database-limited** (60 an hour globally, per-contact cap; `2026-10-20-desexing-drives-schema.md`), which means a flood closes sign-ups for everyone.
3. `/shop/merch/checkout`: `submitOrder` (`src/app/shop/merch/checkout/actions.ts`), a public order form. I did not read how it writes, so **not established** whether it needs its own limit. For the planner to file.
4. `/login/forgot` (`requestPasswordReset`) and `/login` (`login`): Supabase Auth's own limits apply; not examined.
5. `POST /api/csp-report`: answered by the Worker, has its own cap.

All of these are server actions, which are POSTs to the page's own address, so a **path** match covers them.

## What the free plan gives (Cloudflare's own pages, read 2026-11-15)
- **WAF rate limiting rules**, `developers.cloudflare.com/waf/rate-limiting-rules/` (availability table) and `.../parameters/`: Free gets **1 rule**; counts by **IP only**; counting period **10 seconds only**; mitigation timeout **10 seconds only**; the only usable request fields are **Path** and Verified Bot. Free cannot choose a duration for challenge actions. Cloudflare says these rules are not built for an exact count. Method, Host, query and user agent are Business and up.
- **WAF custom rules**, `.../waf/custom-rules/`: Free gets 5 rules, all actions except Log, no regex. They **cannot count**, so they cannot bound repetition.
- **Turnstile**, `developers.cloudflare.com/turnstile/plans/`: Free, 20 widgets, unlimited verifications, works without proxying traffic. It is **code** (widget in the form, server-side token check) and puts a challenge in front of the reporter, so it is the option most likely to turn away a real first report.
- **Workers rate limit binding**, `.../workers/runtime-apis/bindings/rate-limit/`: periods 10 or 60 s, counts **per Cloudflare location and eventually consistent**; the page advises against keying on IP. **Whether Free includes it: not stated on that page.**
- **Not established:** whether zone WAF rules apply to a Worker on a `custom_domain` route (no page read says so); whether Lutan's zone already uses its single free rate-limiting rule; whether the Free "Path" field offers a "contains" match (see step 3).
- `developers.cloudflare.com/waf/plans/` returned 404, so no plan-comparison page was read.

## The honest limit of the free answer
Free can only say "no more than N requests per 10 seconds from one IP, then refuse for 10 seconds". It **stops a script hammering the form; it does not cap a slow trickle** (one report every 15 seconds is never touched) and cannot do an hourly cap. A real hourly cap needs a counter, which is code plus a store, and the Workers binding's plan is not established. **Not built:** the item says not to design an in-app counter until the free tier is known, and what is known covers only the burst case. The slow trickle stays an accepted risk, as `2026-10-20-desexing-drives-page.md` accepted it for sign-ups. Revisit if junk reports appear.

## What to do (Lutan, about five minutes)
1. Sign in to Cloudflare and open the zone for the public site.
2. Left menu: **Security**, then **Security rules** (older dashboards: **Security, then WAF**). Click **Create rule** and choose **Rate limiting rule**.
3. Name it `report form burst`. Under "If incoming requests match", set **Path** **contains** `report-animal` (this also covers the Thai address `/th/services/report-animal`). If the dashboard only offers "equals", use `/services/report-animal` and tell the planner; the Thai twin would then be uncovered.
4. Counting: **IP**, **20 requests per 10 seconds**.
5. Action: **Block**, leave the 429 reply as is. Do not choose a challenge: it would break the form's background request.
6. Click **Deploy**. If the dashboard says you already have a rate limiting rule and cannot add another, stop and tell the planner: Free allows only one.

Cost: nothing (Free plan).

## Fail-open analysis
- **First report from an IP:** a page view plus one send is about 2 to 3 requests, far under 20 in 10 seconds, so it is never touched. Static files are on other paths and are not counted.
- **The eleventh and later:** a person cannot make 20 requests in 10 seconds. A script can; it is refused for 10 seconds and then allowed again, so **nobody is locked out for longer than 10 seconds**, which is the fail-open shape required. Several people behind one shared network address would need 20 requests together in 10 seconds to notice.
- **Not tested:** the rule lives in Lutan's account, so I could not exercise it. The behaviour above comes from the documentation and arithmetic, not a measured run. Test once applied: 25 quick requests to the form's address from one machine should start returning 429 and recover after about 10 seconds.

## Cost position
Free plan only. **Turnstile and a Workers binding are not recommended now**: Turnstile adds friction for a distressed reporter, and the binding's plan is unconfirmed. No paid feature is recommended.

## Is a card involved? No.
This path is uncarded on purpose (a stranger has no login; `2026-11-14-report-animal-photo.md`). **Bounding how many times a stranger may submit is not a grant of ability**, so Lutan's card rule (*"The only thing that can give permissions to do something in the system has to be a card"*) does not govern it. No card, role or role name appears anywhere.
