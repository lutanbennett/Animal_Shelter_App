import type { NextConfig } from "next";
import { MAX_UPLOAD_BODY_BYTES } from "./src/lib/uploads/limits";

const nextConfig: NextConfig = {
  // `next dev` already listens on 0.0.0.0, but it rejects dev assets/HMR
  // from any Origin other than localhost. Allow the home Wi-Fi subnet so a
  // phone on the same network can load http://<this-machine-ip>:3000 for
  // mobile-first testing without waiting on a Cloudflare deploy. `*` matches
  // exactly one dotted label, so this survives DHCP handing out a new last
  // octet. Ignored in production builds.
  allowedDevOrigins: ["192.168.1.*"],

  typescript: {
    // `next build` (and `next typegen`) type-check with tsconfig.build.json,
    // which excludes `.next/dev` — the types a running `next dev` keeps
    // rewriting. Next 16 passes the tsconfig straight to `tsc --project`,
    // so with tsconfig.json a build that reads routes.d.ts / validator.ts
    // mid-write fails with TS1005s in files that aren't ours, and a
    // deploy beside a dev server was a coin toss. NODE_ENV is set by the
    // CLI before this file loads: production for build/typegen,
    // development for dev, which keeps tsconfig.json (the one Next
    // watches, and the one the editor reads with the live dev types).
    tsconfigPath: process.env.NODE_ENV === "development" ? "tsconfig.json" : "tsconfig.build.json",
  },

  images: {
    // No `/_next/image` optimizer on Cloudflare Workers. The OpenNext
    // adapter's stand-in for that route can only serve images from the
    // static-assets binding, so every Drive-backed photo (served by the
    // dynamic /api/photos/[fileId] route) came back 404 through it — and
    // without a Cloudflare Images binding it wouldn't resize anyway.
    // Render plain <img> tags instead: photos hit the proxy directly,
    // which already sets long-lived Cache-Control headers and, on
    // Workers, the edge Cache API (see docs/decisions.md).
    unoptimized: true,
  },
  // The deceased-resident archive renders its summary PDF with
  // @react-pdf/renderer, which Next keeps out of its server bundle by
  // default (it is on the built-in serverExternalPackages list), so on a
  // deploy it and its dependencies were resolved by OpenNext's esbuild pass
  // instead — with Node conditions, giving pdfkit's Node build. That build
  // loads its 14 built-in fonts lazily through
  // createRequire(import.meta.url)("#standard-fonts/…"): fine under
  // `next dev`, but a bundled Worker has nothing for that require to
  // resolve against, and the first touch of Helvetica (pdfkit's default
  // font, @react-pdf's fallback family) threw `No such module
  // "#standard-fonts/Helvetica"` — no archive ever completed on Cloudflare,
  // only locally. Bundling the renderer here instead lets the alias below
  // pick pdfkit's browser build, which carries the fonts as static imports
  // (and swaps fs/stream/zlib for fflate and an in-memory Readable — what a
  // Worker wants anyway). The renderer stays on its Node entry, where
  // renderToBuffer lives; only pdfkit and the font store switch. Turbopack
  // aliases are exact-match, so "pdfkit/standard-fonts/*" still resolves
  // through pdfkit's exports map.
  transpilePackages: ["@react-pdf/renderer"],
  // …except the reconciler, which must see the *client* React (it reads
  // React's client internals); bundled into the RSC layer it would get the
  // react-server build and fail. External, Node resolution gives it
  // node_modules/react as before.
  serverExternalPackages: ["@react-pdf/reconciler"],
  turbopack: {
    resolveAlias: {
      // Paths, not package subpaths: pdfkit's exports map does not expose
      // its build files, so "pdfkit/js/…" would fail to resolve and the alias
      // would silently not apply.
      pdfkit: "./node_modules/pdfkit/js/pdfkit.browser.mjs",
      "@react-pdf/font": "./node_modules/@react-pdf/font/lib/index.browser.js",
      // yoga-layout instantiates its WebAssembly from embedded bytes, which
      // workerd forbids; this loader imports the same binary as a module.
      // See src/lib/archive/yoga/load.ts.
      "yoga-layout/load": "./src/lib/archive/yoga/load.ts",
    },
  },
  experimental: {
    // Next.js dev mode caches fetch() responses across HMR refreshes by
    // default — even for requests to Route Handlers made repeatedly via
    // client-side XHR/fetch without a navigation in between, which is
    // exactly the resident-lookup query the photo upload route makes on
    // every call. That produced stale reads of residents.drive_folder_id,
    // making every upload think no Drive folder existed yet. See
    // node_modules/next/dist/docs/.../serverComponentsHmrCache.md.
    serverComponentsHmrCache: false,
    // Uploads. A Server Action's body defaults to 1 MB, enforced before the
    // action runs, so a 1–15 MB Website photo or Shelter Friend logo failed
    // as an unreadable framework error instead of reaching the action's own
    // checks. proxy.ts clones request bodies up to 10 MB by default and
    // truncates the rest — the same problem for the upload routes. Both
    // follow the app's one limit (src/lib/uploads/limits.ts).
    serverActions: { bodySizeLimit: MAX_UPLOAD_BODY_BYTES },
    proxyClientMaxBodySize: MAX_UPLOAD_BODY_BYTES,
  },
};

export default nextConfig;
