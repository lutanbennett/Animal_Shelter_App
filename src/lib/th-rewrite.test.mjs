import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// #thpfx: /th and /th/platform/about answered 500 on the Pi while the public-site lock hid it. The proxy used
// NextResponse.rewrite with an absolute URL built from the visitor's host and https; the Pi's server is bound to
// 127.0.0.1 and sees Host: localhost:<port>, so Next read it as another origin and proxied it outward over TLS
// ("Failed to proxy https://localhost:3001/ ... EPROTO"). `next dev` and a plain `next start` never show it. This
// test reads the sources because the fault needs that exact deployment shape to run; the live proof is in the PR.
const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");

test("the proxy never rewrites to an absolute URL for /th addresses", () => {
  for (const f of ["../proxy.ts", "./supabase/proxy.ts"]) {
    assert.doesNotMatch(read(f), /NextResponse\.rewrite\(/, `${f} must not call NextResponse.rewrite`);
  }
});

test("/th/<page> is a relative config rewrite that only fires on the header the proxy sets", () => {
  const cfg = read("../../next.config.ts");
  assert.match(cfg, /source:\s*"\/th\/:path\*"/);
  assert.match(cfg, /key:\s*"x-locale-path",\s*value:\s*"th"/);
  assert.match(cfg, /destination:\s*"\/:path\*"/);
});
