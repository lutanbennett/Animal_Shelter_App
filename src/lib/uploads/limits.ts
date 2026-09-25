/**
 * The one upload size limit, shared by every upload path — the Server
 * Actions (Website photos, Shelter Friend logos), the upload route handlers
 * (resident and project photos, procedure / blood-test / maintenance
 * attachments), their client-side pre-checks, and next.config.ts, which
 * has to let a body this size through to them.
 *
 * Plain constants, no imports: next.config.ts and client components both
 * load this file.
 *
 * Why next.config.ts is involved (docs/decisions.md, 2026-09-25): Next caps
 * a Server Action's request body at 1 MB unless told otherwise, and it
 * rejects a larger body before the action's code runs — so the action's own
 * size check and try/catch never saw a 1–15 MB logo, and production showed
 * the stripped error as "Minified React error #441". `proxy.ts` has its own
 * 10 MB cap on the bodies it clones. Both are raised to this limit plus
 * room for the multipart framing.
 */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/**
 * Request-body allowance for the framework limits: the file plus the
 * boundaries, part headers and the action's other fields. Next's docs
 * suggest 10–20 KB of overhead; a full megabyte leaves no doubt.
 */
export const MAX_UPLOAD_BODY_BYTES = MAX_UPLOAD_BYTES + 1024 * 1024;

/** Image types the Website page and Shelter Friend logos accept. */
export const WEBSITE_IMAGE_MIME_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
