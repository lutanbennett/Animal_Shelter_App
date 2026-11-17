import { headers } from "next/headers";
import { SHELTER_HEADER, requestShelterHeaders } from "./shelter-header";

/**
 * The shelter the current request is for (the Worker's header; on `next dev`, DEV_SHELTER_ID), or null.
 * A service-role client is trusted with every shelter and sets no filter of its own (is_trusted_caller(),
 * 0392), so a call site that reads or writes tenant rows must pass this to `.eq("shelter_id", …)` itself.
 * Null means no shelter: the caller must return nothing rather than fall back to every shelter.
 */
export async function actingShelterId(): Promise<string | null> {
  const h = requestShelterHeaders((await headers()).get(SHELTER_HEADER));
  return h[SHELTER_HEADER] ?? null;
}
