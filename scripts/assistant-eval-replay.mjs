// Assistant eval replay: how well does the configured model turn a typed sentence into the right draft?
//
//   node scripts/assistant-eval-replay.mjs <could-not-help.csv>     replay a real export
//   node scripts/assistant-eval-replay.mjs --fixture                run the bundled sample offline
//   node scripts/assistant-eval-replay.mjs --help
//
// WHERE THE CSV COMES FROM: a path argument. The export route is Admin-only behind a login, so a
// script cannot fetch it; download it from Admin -> Assistant (Export), fill in the last two columns,
// and pass the file. correct_intent is a draft kind (weight, move, clinic, hospital, ...) or "none"
// when the sentence should get no draft; correct_answer is the resident id the draft should carry
// (blank = resident agreement not scored). Rows with correct_intent blank are skipped.
//
// WHICH MODEL: whatever createLlm() builds from ASSISTANT_LLM_MODEL (and ASSISTANT_LLM_BASE_URL for
// a server that is not the local default). It goes through the LlmAdapter interface only, so a
// second self-hosted implementation would run here unchanged. --fixture uses a scripted stand-in, not a model.
//
// LIMIT: the model is given the draft tools but no resident lookup, so resident agreement only
// scores a model that can name the id itself (a fixture, or a lookup tool added later).
//
// EXIT CODE: 0 whenever a score was produced, however low. It sets NO threshold and never fails on
// a score. Non-zero (2) only for a genuine error: missing/unreadable/malformed file, no model configured.
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { exitWith } from "./lib/exit.mjs";
import { parseCsv, replay, report } from "./lib/assistant-eval.mjs";

register("./test-support/resolve-hooks.mjs", import.meta.url);

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h") || args.length === 0) {
  const header = readFileSync(new URL(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//"));
  console.log(header.map((l) => l.slice(3)).join("\n"));
  await exitWith(args.length === 0 ? 2 : 0);
} else {
  let code = 0;
  try {
    const fixture = args.includes("--fixture");
    const file = fixture ? new URL("./fixtures/assistant-eval-sample.csv", import.meta.url) : args.find((a) => !a.startsWith("--"));
    if (!file) throw new Error("give the path of the CSV, or --fixture");
    const rows = parseCsv(readFileSync(file, "utf8"));

    const { draftTools } = await import("../src/lib/assistant/llm-tools.ts");
    let llm;
    if (fixture) {
      const answers = { "Panda weighs 4.2 kg today": ["weight", "res-panda"], "put Mochi in the hospital": ["hospital", "res-mochi"] };
      llm = {
        provider: "fixture",
        model: "scripted",
        complete: async (req) => {
          const a = answers[req.messages[0].content[0].text];
          return { text: "", stop: a ? "tool_calls" : "end", toolCalls: a ? [{ id: "t", name: a[0], input: { residentId: a[1] } }] : [], usage: { inputTokens: 0, outputTokens: 0 }, model: "scripted" };
        },
      };
    } else {
      const { createLlm } = await import("../src/lib/assistant/llm.ts");
      llm = await createLlm();
    }
    const system = "Turn the shelter worker's sentence into exactly one draft by calling the matching tool. If the sentence is not a record to change, call no tool.";
    console.log(report(await replay(rows, llm, { system, tools: draftTools() }), llm));
  } catch (e) {
    console.error(`assistant-eval-replay: ${e instanceof Error ? e.message : e}`);
    code = 2;
  }
  await exitWith(code);
}
