import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
