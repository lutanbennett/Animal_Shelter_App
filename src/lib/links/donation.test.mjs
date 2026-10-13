import test from "node:test";
import assert from "node:assert/strict";
import { checkDonationUrl } from "./donation.ts";

test("a company's own addresses are accepted", () => {
  for (const [way, url] of [
    ["paypal", "https://www.paypal.com/donate/?hosted_button_id=ABC"],
    ["paypal", "https://paypal.me/lannacare"],
    ["paypal", "https://PAYPAL.COM/x"],
    ["donorbox", "https://donorbox.org/lanna-care"],
    ["donorbox", "https://www.donorbox.org/embed/x?a=1"],
    ["wise", "https://wise.com/pay/me/lutanb"],
    ["wise", "wise.com/pay/me/lutanb"],
  ]) {
    assert.equal(checkDonationUrl(way, url).ok, true, url);
  }
});

test("look-alike and trick addresses are refused as the wrong company", () => {
  for (const [way, url] of [
    ["paypal", "https://paypal.com.evil.test/donate"],
    ["paypal", "https://secure-paypal.com/donate"],
    ["paypal", "https://evilpaypal.com/donate"],
    ["paypal", "https://paypal.com@evil.test/donate"],
    ["paypal", "https://evil.test/paypal.com"],
    ["paypal", "https://evil.test/?u=paypal.com"],
    ["paypal", "https://paypal.com.evil.test"],
    ["paypal", "https://paypal.co/donate"],
    ["paypal", "https://paypa1.com/donate"],
    ["paypal", "https://paypal.com:8443@evil.test/"],
    ["donorbox", "https://donorbox.org.evil.test/x"],
    ["donorbox", "https://donorbox.com/x"],
    ["donorbox", "https://xdonorbox.org/x"],
    ["wise", "https://wise.com.evil.test/pay"],
    ["wise", "https://wise.com@evil.test/pay"],
    ["wise", "https://likewise.com/pay"],
    ["wise", "https://wise.co.uk/pay"],
    ["wise", "https://paypal.com/x"],
  ]) {
    const r = checkDonationUrl(way, url);
    assert.equal(r.ok, false, url);
    assert.equal(r.error, "wrongHost", url);
  }
});

test("http, other schemes and junk are refused", () => {
  assert.deepEqual(checkDonationUrl("paypal", "http://paypal.com/x"), { ok: false, error: "notHttps" });
  assert.equal(checkDonationUrl("wise", "javascript:alert(1)").ok, false);
  assert.equal(checkDonationUrl("wise", "https://").ok, false);
});

test("other and details-only ways take any https link, or none", () => {
  assert.equal(checkDonationUrl("other", "https://example.org/give").ok, true);
  assert.deepEqual(checkDonationUrl("bank_transfer", ""), { ok: true, url: null });
  assert.equal(checkDonationUrl("other", "http://example.org").ok, false);
});
