import { NextResponse } from "next/server";
import { withDriveErrors } from "@/lib/google/drive-errors";
import {
  BILL_OWNER_TYPES,
  fileBillPhoto,
  readBillFile,
  refuseUnlessAllowed,
  type BillOwnerType,
} from "@/lib/bills/upload";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Adds one more photo to a bill: a delivery's (`stock_receipt`), a clinic
 * visit's (`clinic_visit`) or a card already in the inbox (`bill_inbox`), for
 * a bill that runs to a second page. The database decides whether the row
 * may exist (record_attachment, then the attachments policies).
 */
async function handlePost(request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (!(BILL_OWNER_TYPES as readonly string[]).includes(kind) || !UUID.test(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const owner = kind as BillOwnerType;
  const refused = await refuseUnlessAllowed(request, owner);
  if (refused) return refused;
  const read = await readBillFile(request);
  if ("response" in read) return read.response;
  return fileBillPhoto(owner, id, read.file, read.mimeType);
}

export const POST = withDriveErrors(handlePost);
