import type { PickableResident } from "@/lib/medical/residents";

/**
 * SEAM for "Pick the resident by scanning their name card" (backlog, Medical records). That item is
 * not built yet; when it lands, render its scan button here and call `onFound` with the resident it
 * resolves. AddPhotosFlow already shows this component beside the search, so nothing else changes.
 * Returns nothing until then. Do not build NFC scanning in this file's place.
 */
export function ScanCardSeam({
  residents: _residents,
  onFound: _onFound,
}: {
  residents: PickableResident[];
  onFound: (resident: PickableResident) => void;
}) {
  return null;
}
