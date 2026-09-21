import "server-only";
import { randomInt } from "node:crypto";

/**
 * A temporary password an admin can read out or paste into LINE: three
 * groups of four from an alphabet with no look-alikes (no 0/O, 1/l/I),
 * e.g. "k7pm-Rq2v-Wt9x". 12 characters over 55 symbols is ~69 bits.
 */
export function generateTemporaryPassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const group = () =>
    Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("");
  return `${group()}-${group()}-${group()}`;
}
