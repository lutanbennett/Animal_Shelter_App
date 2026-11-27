/** Pages a role-less login may use on the platform front door (#fdsgn): the console and its pages, and the second step they need. */
export function frontDoorKeeps(pathname: string): boolean {
  return pathname === "/platform" || pathname.startsWith("/platform/") || pathname === "/admin/security/verify";
}
