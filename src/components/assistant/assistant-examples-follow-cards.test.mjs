// Guard, slice 5 of "a button is shown only if the login's cards let it do that action" (CLAUDE.md).
// Narrow: asserts the write examples are filtered on canWrite, the activity the confirm step asks.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("write examples are offered only with assistant.record", () => {
  const view = read("./AssistantConversation.tsx");
  assert.match(view, /if \(context\.canWrite\) return true;\s+const parsed = parseRequest\(example, parserData\);\s+return !parsed \|\| !isWriteIntent\(parsed\.intent\);/);
  assert.ok(read("../../lib/assistant/data.ts").includes('canWrite: can(perms, "assistant.record")'));
  assert.ok(read("../../app/assistant/actions.ts").includes('"assistant.record"'));
});
