import type { Contact } from "@/lib/contacts/contacts";

/**
 * A business the shelter buys from (0335). Its own record: Contacts holds only people, so a supplier has no `type`.
 * Deliveries and bills name one (stock_receipts.supplier_id, stock_deliveries.supplier_id, 0337) and a supplier can be
 * a Shelter Friend (0336).
 *
 * The contact fields keep the names `contacts` uses (phone, email, line_id, ...), so the contact-detail components
 * (ContactActions, the map preview) read a supplier unchanged.
 */
export type Supplier = Omit<Contact, "type">;

export const SUPPLIER_COLUMNS =
  "id, name, phone, email, line_id, messenger_id, whatsapp, address, map_url, notes, archived_at, archive_reason";

/** The one place the supplier page is addressed: the translation queue (0336) links here too. */
export const supplierHref = (id: string) => `/suppliers/${id}`;
