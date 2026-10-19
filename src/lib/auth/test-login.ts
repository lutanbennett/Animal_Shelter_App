/**
 * A throwaway login made by a check script or a test: its address ends in the
 * reserved `.test` domain, which can never be a real mailbox. The rule is
 * deliberately this narrow, so a real person who only has an email address
 * stays in the assignee lists.
 */
export function isTestLogin(user: { email: string | null }): boolean {
  return /@[^@]+\.test$/i.test(user.email ?? "");
}
