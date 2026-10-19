/** The ?cost= a bill carries into Record a delivery: a plain baht amount, up to two decimals, or nothing. */
export function billCostParam(value: unknown): string {
  return typeof value === "string" && /^\d+(\.\d{1,2})?$/.test(value) ? value : "";
}
