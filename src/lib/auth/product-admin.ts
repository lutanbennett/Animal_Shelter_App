import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Whether the signed-in login is on the product-administrator list (0411, #shmgt).
 *
 * PADMIN is a list of people, outside the card system by Lutan's decision of 2026-11-18
 * (docs/decisions/2026-11-18-product-admin-list-schema.md). The database decides: is_product_admin()
 * answers about the caller only. Anything that is not an explicit `true` reads as "no", so an error
 * hides the surface rather than showing it.
 */
export async function isProductAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_product_admin");
  return !error && data === true;
}
