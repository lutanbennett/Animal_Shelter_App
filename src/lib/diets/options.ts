/** "150" / "1.5" — a quantity without trailing zeros, for labels. */
export function formatQuantity(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}
