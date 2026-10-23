import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { toUnitRow, UNIT_COLUMNS, type UnitDbRow, type UnitRow } from "./unit-list";

/**
 * Every unit, archived ones included (they must still print on rows that use them), once per request.
 * Signed out, or on any failure, the list is empty and a unit prints by its stored name.
 */
export const loadUnitList = cache(async (): Promise<UnitRow[]> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("units")
      .select(UNIT_COLUMNS)
      .order("sort_order")
      .order("name")
      .returns<UnitDbRow[]>();
    return (data ?? []).map(toUnitRow);
  } catch {
    return [];
  }
});
