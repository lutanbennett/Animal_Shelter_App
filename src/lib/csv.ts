/**
 * CSV for the Management tables that offer a download (Cashflow, Stock
 * between counts). One writer, so both files open the same way.
 */

/** Quotes one CSV field only when it has to (RFC 4180). */
export function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
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
