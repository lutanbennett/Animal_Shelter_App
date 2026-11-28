// Every environment whose Worker has a cron runs its scheduled jobs on the PLATFORM host (#alrth,
// docs/decisions/2026-11-28-scheduled-jobs-run-on-the-platform-host.md). worker/index.mjs skips every job,
// silently but for a heartbeat note, when STATUS_ALERT_SITE is unset; and a shelter host there means closing that
// shelter stops every shelter's jobs. Both fail here, in `npm test`, rather than warn.
//
// An environment with no cron (UAT today) is not asked for a value: it has no job to run, and a value there would be
// dead configuration. If a cron is ever added to it, this test then demands the value in the same change.
import test from "node:test";
import assert from "node:assert/strict";
import { readWranglerConfig } from "./lib/wrangler.mjs";

const config = readWranglerConfig();
const envs = Object.entries(config.env ?? {});

export function alertSiteFaults(name, env) {
  const crons = env.triggers?.crons ?? [];
  if (crons.length === 0) return [];
  const vars = env.vars ?? {};
  const site = vars.STATUS_ALERT_SITE;
  const platform = vars.PLATFORM_HOST;
  if (!platform) return [`${name}: has a cron but no PLATFORM_HOST to run its jobs on`];
  if (!site) return [`${name}: has a cron but no STATUS_ALERT_SITE, so every scheduled job skips`];
  if (site !== `https://${platform}`) return [`${name}: STATUS_ALERT_SITE is ${site}, not the platform host https://${platform}`];
  return [];
}

test("there is at least one environment with a cron to check", () => {
  assert.ok(envs.some(([, e]) => (e.triggers?.crons ?? []).length > 0));
});

test("every environment with a cron runs its jobs on its own platform host", () => {
  assert.deepEqual(envs.flatMap(([n, e]) => alertSiteFaults(n, e)), []);
});

test("the rule itself: missing, shelter-host and cron-less cases", () => {
  const cron = { crons: ["*/15 * * * *"] };
  assert.equal(alertSiteFaults("x", { triggers: cron, vars: { PLATFORM_HOST: "p.org" } }).length, 1);
  assert.equal(alertSiteFaults("x", { triggers: cron, vars: { PLATFORM_HOST: "p.org", STATUS_ALERT_SITE: "https://shelter.org" } }).length, 1);
  assert.equal(alertSiteFaults("x", { triggers: cron, vars: { STATUS_ALERT_SITE: "https://p.org" } }).length, 1);
  assert.deepEqual(alertSiteFaults("x", { triggers: cron, vars: { PLATFORM_HOST: "p.org", STATUS_ALERT_SITE: "https://p.org" } }), []);
  assert.deepEqual(alertSiteFaults("x", { vars: {} }), []);
});
