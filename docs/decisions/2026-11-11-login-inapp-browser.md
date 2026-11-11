# Login page: notice an in-app browser, hide Google, say why (#tbsxw)

**Cause (settled, not re-investigated):** Google refuses OAuth inside embedded browsers (`disallowed_useragent`). Policy, not our configuration.

**Detection** — `isInAppBrowser()` in `src/lib/auth/in-app-browser.ts`, read server-side from the `User-Agent` in `/login` and `/login/request` (no flash of the button). Tested as a table of agent strings in `in-app-browser.test.mjs`.
Treated as in-app: Facebook/Messenger (`FBAN`, `FBAV/`, `FB_IAB`, `FBIOS`, `MessengerForiOS`), LINE (`Line/<digit>`), Instagram, WeChat, TikTok, Snapchat, KakaoTalk, and any Android agent carrying the generic WebView marker `; wv)`.
**Errs towards not matching:** a false positive hides Google from someone who could use it; a false negative just shows the old button. Only tokens these apps put in their own agent string are listed; plain Chrome/Safari/Firefox are tested as not matching.

**Wording** (dictionaries `login.inApp`, English and Thai): says it is not a fault, then steers to **email and password first** (still works in place, form untouched), and only then to Chrome / the phone's browser for Google. On `/login/request`, where Google is the only route, it steers to Chrome alone.

**Not tested:** a real LINE or Messenger in-app browser, and a screenshot of the notice (the pane cannot set a user agent). Verified instead by fetching the page with Messenger and Chrome agent strings. Real-device check left in the test plan.
