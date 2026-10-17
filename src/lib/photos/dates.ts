/** The calendar day in Bangkok (yyyy-mm-dd), for the Drive month folder; assign_pending_photo() dates the row the same way. */
export function bangkokDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}
