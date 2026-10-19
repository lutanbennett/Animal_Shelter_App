import test from "node:test";
import assert from "node:assert/strict";
import { EARLY_SUBMIT_GUARD } from "./early-submit-guard.ts";

function setup() {
  let listener;
  const window = {};
  const document = { addEventListener: (_t, fn) => (listener = fn) };
  new Function("window", "document", EARLY_SUBMIT_GUARD)(window, document);
  const form = (over = {}) => {
    const log = { submitted: 0, attrs: {} };
    return {
      log,
      method: "get",
      isConnected: true,
      getAttribute: (n) => (n === "action" ? over.action ?? null : null),
      setAttribute: (n, v) => (log.attrs[n] = v),
      removeAttribute: (n) => delete log.attrs[n],
      requestSubmit: () => log.submitted++,
      ...over,
    };
  };
  const submit = (f) => {
    const ev = { target: f, prevented: false, stopped: false,
      preventDefault() { this.prevented = true; },
      stopImmediatePropagation() { this.stopped = true; } };
    listener(ev);
    return ev;
  };
  return { window, form, submit };
}

test("a plain-GET submit before the page is ready is held, not sent", () => {
  const { form, submit } = setup();
  const f = form();
  const ev = submit(f);
  assert.ok(ev.prevented && ev.stopped);
  assert.equal(f.log.submitted, 0);
});

test("the held form is replayed once the page is ready", () => {
  const { window, form, submit } = setup();
  const f = form();
  submit(f);
  window.__releaseHeldForm();
  assert.equal(f.log.submitted, 1);
  assert.equal(f.log.attrs["aria-busy"], undefined);
});

test("after the page is ready nothing is held", () => {
  const { window, form, submit } = setup();
  window.__releaseHeldForm();
  assert.equal(submit(form()).prevented, false);
});

test("POST and real-action forms pass through", () => {
  const { form, submit } = setup();
  assert.equal(submit(form({ method: "post" })).prevented, false);
  assert.equal(submit(form({ action: "/x" })).prevented, false);
});
