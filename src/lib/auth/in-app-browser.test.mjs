import test from "node:test";
import assert from "node:assert/strict";
import { isInAppBrowser } from "./in-app-browser.ts";

const IN_APP = {
  "Messenger iOS": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/430.0.0.0;FBBV/1;FBDV/iPhone14,2;FBMD/iPhone;FBSN/iOS;FBSV/17.0;FBLC/en_US]",
  "Facebook Android": "Mozilla/5.0 (Linux; Android 13; SM-A536E Build/TP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/440.0.0.0;]",
  "LINE Android": "Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.0.0 Mobile Safari/537.36 Line/13.5.0 LIFF",
  "LINE iOS": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/13.5.0",
  "Instagram": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.0",
  "Generic Android WebView": "Mozilla/5.0 (Linux; Android 11; Pixel 5 Build/RQ3A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.0.0 Mobile Safari/537.36",
};
const REAL = {
  "Chrome Android": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Safari iOS": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Chrome desktop": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Firefox desktop": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "a site named Line in the path": "Mozilla/5.0 (X11; Linux x86_64) Chrome/120 Safari/537.36 Online/1",
};

for (const [name, ua] of Object.entries(IN_APP)) {
  test(`in-app: ${name}`, () => assert.equal(isInAppBrowser(ua), true));
}
for (const [name, ua] of Object.entries(REAL)) {
  test(`real browser: ${name}`, () => assert.equal(isInAppBrowser(ua), false));
}
test("missing agent is not in-app", () => {
  assert.equal(isInAppBrowser(null), false);
  assert.equal(isInAppBrowser(undefined), false);
  assert.equal(isInAppBrowser(""), false);
});
