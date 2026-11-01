// Guard, slice 5 of "a button is shown only if the login's cards let it do that action" (CLAUDE.md).
// Narrow: asserts the write examples are filtered on canWrite AND on the extra activity a tool
// declares for itself (`needs`, llm-tools.ts), which is what keeps the prescription card off a
// login without medical.prescriptions.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("write examples are offered only with assistant.record and the tool's own activity", () => {
  const view = read("./AssistantConversation.tsx");
  assert.match(
    view,
    /const parsed = parseRequest\(example, parserData\);\s+if \(!parsed \|\| !isWriteIntent\(parsed\.intent\)\) return true;\s+return context\.canWrite && mayUseTool\(context, parsed\.draft\.kind\);/,
  );
  // The gate the card itself goes through, and its default: an activity the
  // server did not answer for reads as no, never as yes.
  assert.match(view, /if \(!mayUseTool\(context, parsed\.draft\.kind\)\) return \{ kind: "noCard" \};/);
  assert.match(view, /return needs === null \|\| context\.toolCards\[needs\] === true;/);
  assert.ok(read("../../lib/assistant/data.ts").includes('canWrite: can(perms, "assistant.record")'));
  assert.ok(read("../../app/assistant/actions.ts").includes('"assistant.record"'));
  // The prescription tool's own activity is the one its write asks for.
  assert.ok(read("../../lib/assistant/llm-tools.ts").includes('needs: "medical.prescriptions"'));
  assert.ok(read("../../app/prescriptions/actions.ts").includes('can(await loadPermissions(), "medical.prescriptions")'));
});
