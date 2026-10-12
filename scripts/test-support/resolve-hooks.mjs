// Three things plain Node cannot do with src/, done for tests only, so the
// modules under test never have to change to suit the runner:
//   - "./catalogue"  -> ./catalogue.ts   (the app imports without extensions)
//   - "@/lib/x"      -> src/lib/x.ts     (tsconfig's path alias)
//   - "next/server"  -> a stand-in NextResponse (Next itself is not needed to
//                       test a rule, and loading it would slow every PR)
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src");
const nextStub = pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "next-server-stub.mjs")).href;

function withExtension(base) {
  for (const candidate of [base, `${base}.ts`, `${base}/index.ts`]) {
    if (path.extname(candidate) && existsSync(candidate)) return pathToFileURL(candidate).href;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") return { url: nextStub, shortCircuit: true };
  if (specifier.startsWith("@/")) {
    const url = withExtension(path.join(src, specifier.slice(2)));
    if (url) return { url, shortCircuit: true };
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !path.extname(specifier) && context.parentURL) {
    const url = withExtension(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier));
    if (url) return { url, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
