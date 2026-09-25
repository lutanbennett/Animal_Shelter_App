import { MAX_UPLOAD_BYTES } from "./limits";

/**
 * Calls an upload Server Action (a Website photo, a Shelter Friend logo)
 * so that every way it can fail reaches the user as a sentence.
 *
 * An action's own checks return `{ error }`, but some failures never get as
 * far as its code: a body over the framework limit, or a Worker that runs
 * out of memory or CPU part-way through (Cloudflare's 1102). Those reject
 * the call, and in a production build the rejection's message is React's
 * stripped "Minified React error #441" — which the Shelter Friend card
 * printed verbatim on 2026-09-24. Nothing about a rejected upload is
 * actionable beyond "try a smaller file", so that is what is said; the
 * real error still goes to the console.
 *
 * The size is also checked here first, so an oversized file is refused at
 * once instead of after the whole thing has been sent.
 */
export async function runUploadAction<R>(
  file: File,
  errors: { fileTooLarge: string; processingFailed: string },
  action: () => Promise<R>,
): Promise<R | { error: string }> {
  if (file.size > MAX_UPLOAD_BYTES) return { error: errors.fileTooLarge };
  try {
    return await action();
  } catch (err) {
    console.error("Upload failed:", err);
    return { error: errors.processingFailed };
  }
}
