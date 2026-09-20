import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  experimental: {
    // Next.js dev mode caches fetch() responses across HMR refreshes by
    // default — even for requests to Route Handlers made repeatedly via
    // client-side XHR/fetch without a navigation in between, which is
    // exactly the resident-lookup query the photo upload route makes on
    // every call. That produced stale reads of residents.drive_folder_id,
    // making every upload think no Drive folder existed yet. See
    // node_modules/next/dist/docs/.../serverComponentsHmrCache.md.
    serverComponentsHmrCache: false,
  },
};

export default nextConfig;
