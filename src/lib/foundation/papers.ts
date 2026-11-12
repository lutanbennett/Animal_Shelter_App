/**
 * The foundation's own papers (0362, #98se8). The named list from the accountant's list, part (1), and the monthly banking half. Nothing else:
 * a new kind of paper is a deliberate addition here AND to the table's check constraint (a migration), not a free-text category.
 *
 * Pure and client-safe. Which activity a category needs is the database's rule (the policies on foundation_documents); activityFor() says the
 * same thing so a page and an action can ask the activity the database asks, from one place.
 */
export const PAPER_CATEGORIES = [
  "establishment",
  "registration",
  "board_list",
  "board_id_copy",
  "minutes",
  "financial_statements",
  "tax_id",
  "bank_statement",
  "bank_reconciliation",
] as const;

export type PaperCategory = (typeof PAPER_CATEGORIES)[number];

/** The board members' ID and household registration copies: the narrower audience, behind their own activity. */
export const ID_COPY_CATEGORY: PaperCategory = "board_id_copy";

/** Bank statements and reconciliations are filed a month at a time, so they carry the month they cover. */
export const MONTHLY_CATEGORIES: readonly PaperCategory[] = ["bank_statement", "bank_reconciliation"];

export function isPaperCategory(value: string): value is PaperCategory {
  return (PAPER_CATEGORIES as readonly string[]).includes(value);
}

/** The activity the database's policies ask for this category (foundation_documents_select/insert/delete, 0362). */
export function activityFor(category: PaperCategory): "foundation.papers" | "foundation.id_copies" {
  return category === ID_COPY_CATEGORY ? "foundation.id_copies" : "foundation.papers";
}

/** "2027-01" from a month input to "2027-01-01", or null when it is not a month. */
export function monthToFirstDay(value: string): string | null {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? `${value}-01` : null;
}
