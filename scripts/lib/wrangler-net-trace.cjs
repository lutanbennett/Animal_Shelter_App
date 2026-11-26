// Preloaded into the wrangler child by scripts/deploy.mjs (`node --require <this> wrangler.js ...`).
//
// WHY: wrangler 4.153.0's handleError() prints "Unable to resolve Cloudflare's API hostname" when
// an error (or its .cause) has code ENOTFOUND and names api/dash.cloudflare.com, and then RETURNS
// without logging the error itself -- not even at WRANGLER_LOG=debug. So the one fact that would
// say what broke (which host, which errno, how long the lookup took, which call) is discarded.
// This file records every FAILED dns.lookup in the child, at the moment it fails, on stderr.
// It changes no behaviour: the original lookup runs and its result is passed through untouched.
// docs/decisions/2026-11-26-wrangler-error-cause.md
"use strict";
const dns = require("node:dns");

function report(hostname, options, err, started) {
  const ms = Date.now() - started;
  const family = typeof options === "number" ? options : options && options.family;
  const fields = [
    `host=${hostname}`,
    `code=${err && err.code}`,
    `errno=${err && err.errno}`,
    `syscall=${err && err.syscall}`,
    `family=${family ?? "any"}`,
    `after=${ms}ms`,
    `at=${new Date().toISOString()}`,
  ];
  process.stderr.write(`\n[deploy net-trace] DNS lookup FAILED: ${fields.join(" ")}\n`);
}

const original = dns.lookup;
dns.lookup = function tracedLookup(hostname, options, callback) {
  const cb = typeof options === "function" ? options : callback;
  const opts = typeof options === "function" ? undefined : options;
  const started = Date.now();
  const wrapped = function (err, ...rest) {
    if (err) report(hostname, opts, err, started);
    return cb.call(this, err, ...rest);
  };
  return opts === undefined ? original.call(this, hostname, wrapped) : original.call(this, hostname, opts, wrapped);
};

const originalPromise = dns.promises.lookup;
dns.promises.lookup = async function tracedPromiseLookup(hostname, options) {
  const started = Date.now();
  try {
    return await originalPromise.call(this, hostname, options);
  } catch (err) {
    report(hostname, options, err, started);
    throw err;
  }
};
