/**
 * CSV for the Management tables that offer a download (Cashflow, Stock
 * between counts). One writer, so both files open the same way.
 */

/** A plain decimal number, optionally signed — what a money or quantity cell holds. */
const NUMERIC = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Quotes one CSV field only when it has to (RFC 4180). A value that opens
 * with =, +, -, @, tab or CR is read by Excel as a formula (a resident
 * named "=HYPERLINK(...)" would run when the export is opened), so it gets
 * a leading ' that makes it text — unless it is just a number, where the
 * apostrophe would turn every -12.50 into text.
 */
export function csvField(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) && !NUMERIC.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Rows of fields as CSV text, CRLF line ends as RFC 4180 has them. */
export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvField).join(",")).join("\r\n") + "\r\n";
}

/**
 * Hands the browser a CSV file to save. Browser only. The BOM is what
 * makes Excel read the file as UTF-8, so Thai headings survive being
 * double-clicked open.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
