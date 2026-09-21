// Preload for `opennextjs-cloudflare build` on Windows.
//
// `next build` writes the standalone output with junctions for packages it
// hoists under `.next/standalone/.next/node_modules/<pkg>-<hash>` (e.g.
// @react-pdf/renderer). OpenNext then recreates each link with
// `fs.symlinkSync(target, to)` and no link type, which on Windows means a
// real symlink — and creating those needs SeCreateSymbolicLinkPrivilege
// (Developer Mode or an elevated shell), so the build dies with
// `EPERM: operation not permitted, symlink`.
//
// Junctions need no privilege and behave the same for our purposes, so on
// Windows this turns every typeless directory symlink into a junction. It is
// a no-op on other platforms, so the same npm script works everywhere.
//
// Usage (see package.json): node -r ./scripts/win-junction-symlinks.cjs
//   node_modules/@opennextjs/cloudflare/dist/cli/index.js build
const fs = require("node:fs");
const path = require("node:path");

if (process.platform === "win32") {
  const original = fs.symlinkSync;
  fs.symlinkSync = function (target, to, type) {
    if (type == null) {
      const resolved = path.resolve(path.dirname(to), target);
      let isDir = false;
      try {
        isDir = fs.statSync(resolved).isDirectory();
      } catch {
        // Dangling link — leave the default behaviour alone.
      }
      // Junctions must point at an absolute path.
      if (isDir) return original.call(fs, resolved, to, "junction");
    }
    return original.call(fs, target, to, type);
  };
  // OpenNext is ESM and does `import { symlinkSync } from "node:fs"`; the
  // ESM view of a builtin only picks up patched properties after this call.
  require("node:module").syncBuiltinESMExports();
}
