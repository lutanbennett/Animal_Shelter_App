import "server-only";
import { NextResponse } from "next/server";
import { getT } from "@/lib/i18n/get-t";
import { DriveApiError, DriveNotConnectedError } from "./drive";

/**
 * What a user is told when a Drive call fails. Google's own text ("Google
 * OAuth token refresh failed: invalid_grant: Token has been expired or
 * revoked.") is for whoever fixes it, not for the person uploading a logo,
 * so it goes to the log and they get a sentence:
 *
 * - not connected (the token or client is dead, env missing): nobody but an
 *   admin can fix it, so say so;
 * - any other Drive error: Google refused this one call; try again;
 * - anything else: our own validation messages (the Website page throws
 *   them from the same try) pass through as they are.
 *
 * `fallback` replaces the generic Drive sentence where the caller has a more
 * specific one ("Could not move the Drive folder.").
 */
export async function driveErrorMessage(err: unknown, fallback?: string): Promise<string> {
  const { t } = await getT();
  if (err instanceof DriveNotConnectedError) {
    console.error("Drive is not connected:", err.message);
    return t.common.driveNotConnected;
  }
  if (err instanceof DriveApiError) {
    console.error("Drive call failed:", err.message);
    return fallback ?? t.common.driveFailed;
  }
  if (err instanceof Error) return err.message;
  return fallback ?? t.common.driveFailed;
}

/**
 * For the upload routes: a Drive failure becomes a JSON `{ error }` the
 * uploaders already show, instead of an unhandled 500 they can only report
 * as "Upload failed (500)." Anything that isn't Drive's is rethrown.
 */
export function withDriveErrors<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (!(err instanceof DriveApiError)) throw err;
      return NextResponse.json(
        { error: await driveErrorMessage(err) },
        { status: err instanceof DriveNotConnectedError ? 503 : 502 },
      );
    }
  };
}
