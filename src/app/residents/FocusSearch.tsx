"use client";

import { useEffect } from "react";

/**
 * Puts the cursor in the residents Search box when the list opens (Lutan, 2026-10-08), in place
 * of a plain `autoFocus`, for two reasons:
 *
 * - Computers only (`md:` and up). On a phone a focused box opens the keyboard over the list,
 *   and nobody asked for that.
 * - Never taken from somewhere else. The search form is re-keyed on every filter change, so this
 *   runs again after a zone chip, Adopted or No microchip is tapped; the cursor moves only when
 *   nothing has it, so a chip someone has just clicked or tabbed to keeps it.
 *
 * A chip reader typing into Search works as it did in Scan a chip: both send the same `q`.
 */
export function FocusSearch({ inputId }: { inputId: string }) {
  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    const input = document.getElementById(inputId);
    if (input instanceof HTMLInputElement) {
      input.focus();
      // At the end of what is already there, ready to add to or correct a search.
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, [inputId]);
  return null;
}
