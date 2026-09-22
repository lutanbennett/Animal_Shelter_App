import { notFound, redirect } from "next/navigation";
import { isUuid } from "@/lib/tags/links";

/**
 * The address on an enclosure's QR code (src/lib/tags/links.ts). No
 * lookup: the id is the enclosure's, and /enclosures/[id] 404s on its own
 * if it has gone. A temporary redirect, not a permanent one — browsers
 * cache 308s, which would pin a printed code to today's page layout.
 */
export default async function EnclosureTagPage(props: PageProps<"/e/[id]">) {
  const { id } = await props.params;
  if (!isUuid(id)) notFound();
  redirect(`/enclosures/${id}`);
}
