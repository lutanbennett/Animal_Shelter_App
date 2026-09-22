// Pull the Yoga WebAssembly binary out of yoga-layout's base64 glue into
// src/lib/archive/yoga/yoga.wasm, the file src/lib/archive/yoga/load.ts
// imports as a compiled module. Run after upgrading yoga-layout (the glue
// and the binary must match) and commit the result:
//
//   node scripts/extract-yoga-wasm.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// yoga-layout's exports map hides everything but "." and "./load", so the
// package is located by path rather than resolved by name.
const pkg = join(process.cwd(), "node_modules/yoga-layout");
const glue = join(pkg, "dist/binaries/yoga-wasm-base64-esm.js");
const match = readFileSync(glue, "utf8").match(/data:application\/octet-stream;base64,([A-Za-z0-9+/=]+)/);
if (!match) {
  console.error(`No embedded wasm found in ${glue} — yoga-layout changed its packaging.`);
  process.exit(1);
}
const bytes = Buffer.from(match[1], "base64");
const { version } = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8"));
writeFileSync("src/lib/archive/yoga/yoga.wasm", bytes);
console.log(`yoga-layout ${version}: wrote ${bytes.length} bytes to src/lib/archive/yoga/yoga.wasm`);
