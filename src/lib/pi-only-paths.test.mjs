import test from "node:test";
import assert from "node:assert/strict";
import { workerMayRender, isRefusedByWorker, isPiOnlyPath } from "./pi-only-paths.ts";

test("the Worker renders the public website", () => {
  for (const p of ["/", "/adopt", "/adopt/12", "/th", "/th/adopt", "/privacy", "/r/CODE1", "/login", "/robots.txt", "/sitemap.xml", "/api/version", "/api/photos/abc"]) {
    assert.equal(workerMayRender(p), true, p);
    assert.equal(isRefusedByWorker(p), false, p);
  }
});

test("the Worker refuses the app, saves and look-alikes", () => {
  for (const p of ["/bills", "/residents", "/residents/12", "/admin", "/my", "/management/cashflow", "/api/status/alerts", "/th/bills", "/adoptive", "/r", "/manual", "/manual/pdf"]) {
    assert.equal(isRefusedByWorker(p), true, p);
  }
});

test("/manual/pdf stays an explicit Pi-only path", () => {
  assert.equal(isPiOnlyPath("/manual/pdf"), true);
  assert.equal(isPiOnlyPath("/bills"), false);
});
