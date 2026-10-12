import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withDriveErrors } from "@/lib/google/drive-errors";
import { fileBillPhoto, readBillFile, refuseUnlessAllowed } from "@/lib/bills/upload";

/**
 * One photo becomes one new card in the bills inbox: the Bills page's
 * "Add bills" posts each picked photo here in turn. A card whose photo fails
 * is removed again, so a failed upload leaves no empty card.
 */
async function handlePost(request: Request) {
  const refused = await refuseUnlessAllowed(request, "bill_inbox");
  if (refused) return refused;
  const read = await readBillFile(request);
  if ("response" in read) return read.response;

  const supabase = await createClient();
  const { data, error } = await supabase.from("bills_inbox").insert({}).select("id").limit(1).returns<{ id: string }[]>();
  const card = data?.[0];
  if (error || !card) {
    return NextResponse.json({ error: error?.message ?? "Could not start a bill." }, { status: 500 });
  }

  let response: NextResponse;
  try {
    response = await fileBillPhoto("bill_inbox", card.id, read.file, read.mimeType);
  } catch (err) {
    await supabase.from("bills_inbox").delete().eq("id", card.id);
    throw err;
  }
  if (!response.ok) {
    await supabase.from("bills_inbox").delete().eq("id", card.id);
    return response;
  }
  const body = await response.json();
  return NextResponse.json({ ...body, cardId: card.id });
}

export const POST = withDriveErrors(handlePost);
