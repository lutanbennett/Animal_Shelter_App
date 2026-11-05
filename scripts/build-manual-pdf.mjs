// Builds the full manual PDFs once (one per language) into .manual-pdf/, so
// /manual/pdf serves a file instead of laying the manual out on every press.
// Run by scripts/pi/deploy-pi.sh before the service restarts; run it by hand with
//   node scripts/build-manual-pdf.mjs
// Why it exists and why it is here: docs/decisions/2026-11-05-manual-pdf-prebuilt.md.
import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const work = path.join(root, ".manual-pdf-build"); // inside the repo so node_modules resolves
await rm(work, { recursive: true, force: true });
await mkdir(work, { recursive: true });
const outfile = path.join(work, "entry.mjs");

try {
  await build({
    entryPoints: [path.join(root, "scripts", "manual-pdf-entry.tsx")],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    jsx: "automatic",
    packages: "external", // react, @react-pdf/renderer... come from node_modules as in the app
    alias: { "@": path.join(root, "src") },
    plugins: [
      {
        // 'server-only' only guards Next; outside Next it is an empty module.
        name: 'server-only-stub',
        setup(b) {
          b.onResolve({ filter: /^server-only$/ }, () => ({ path: 'server-only', namespace: 'stub' }));
          b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: '', loader: 'js' }));
        },
      },
    ],
    logLevel: "warning",
  });
  await import(pathToFileURL(outfile).href);
} finally {
  await rm(work, { recursive: true, force: true });
}
