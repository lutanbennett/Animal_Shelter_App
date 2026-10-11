// Proves the grid's prerequisite rules (src/lib/permissions/prerequisites.ts) refuse what they must and
// allow what they must, with no database: `node scripts/check-prerequisites.mjs`.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const { checkChange, unmetFor } = await import(pathToFileURL(join(process.cwd(), "src/lib/permissions/prerequisites.ts")).href);

const col = (o) => (a) => o[a] ?? 0;
let failed = 0;
const expect = (name, got, want) => {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `  (got ${got}, wanted ${want})`}`);
};
const verdict = (r) => (r.ok ? "ok" : r.kind);

expect("stock.correct Yes with no list box is refused", verdict(checkChange(col({}), "stock.correct", 2)), "needs");
expect("stock.correct Yes with medications Read is refused", verdict(checkChange(col({ "stock.medications": 1 }), "stock.correct", 2)), "needs");
expect("stock.correct Yes with medications Edit is allowed", verdict(checkChange(col({ "stock.medications": 2 }), "stock.correct", 2)), "ok");
expect("stock.correct Yes with diets Edit is allowed", verdict(checkChange(col({ "stock.diets": 2 }), "stock.correct", 2)), "ok");
expect("stock.correct to No is always allowed", verdict(checkChange(col({}), "stock.correct", 0)), "ok");
expect("lowering the only list box under stock.correct is refused", verdict(checkChange(col({ "stock.medications": 2, "stock.correct": 2 }), "stock.medications", 1)), "neededBy");
expect("lowering one list box while the other holds is allowed", verdict(checkChange(col({ "stock.medications": 2, "stock.diets": 2, "stock.correct": 2 }), "stock.medications", 0)), "ok");
expect("recurring.do_any Yes without do_own is refused", verdict(checkChange(col({}), "recurring.do_any", 2)), "needs");
expect("recurring.do_any Yes with do_own is allowed", verdict(checkChange(col({ "recurring.do_own": 2 }), "recurring.do_any", 2)), "ok");
expect("taking do_own away while do_any is Yes is refused", verdict(checkChange(col({ "recurring.do_own": 2, "recurring.do_any": 2 }), "recurring.do_own", 0)), "neededBy");
expect("taking do_own away once do_any is off is allowed", verdict(checkChange(col({ "recurring.do_own": 2 }), "recurring.do_own", 0)), "ok");
expect("an unrelated box is never blocked by an existing unmet combination", verdict(checkChange(col({ "stock.correct": 2 }), "stock.count", 2)), "ok");
expect("an existing unmet combination is reported", unmetFor(col({ "stock.correct": 2 }), "stock.correct").length, 1);
expect("a met combination is not reported", unmetFor(col({ "stock.correct": 2, "stock.diets": 2 }), "stock.correct").length, 0);

if (failed) {
  console.log(`\nFAIL: ${failed} case(s)`);
  process.exit(1);
}
console.log("\nOK: the prerequisite rules refuse and allow as stated.");
