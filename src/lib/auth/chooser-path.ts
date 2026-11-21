/**
 * The shelter chooser (#apxld): a directory of the shelters one login can reach, on the platform front door.
 * The front door maps to no shelter, so a person whose roles are all at shelters holds no role HERE. Sign-in
 * (src/app/login/actions.ts, src/app/auth/callback/route.ts) therefore keeps that session, and only for this
 * one destination on a host with no shelter; every other destination still signs a role-less login out.
 */
export const CHOOSER_PATH = "/platform/shelters";

export function isChooserPath(next: string | null | undefined): boolean {
  return next === CHOOSER_PATH;
}
