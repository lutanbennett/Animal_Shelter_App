// The scheduled jobs the System status page and scripts/check-production.mjs watch. Pure data, no server imports, so a
// .mjs script can import it directly (Node strips the types) and the lists exist once.

/**
 * Every pg_cron job this system relies on. Add the next one here and it is watched by construction.
 * A name listed here must exist on EVERY database this page reads (dev, UAT, production): a job the database
 * does not have shows the Scheduled jobs tile red, so list a job only once its migration is live everywhere.
 * purge-write-requests (0292) was left off while its failure was silent; 0292 is applied on dev and production.
 */
export const EXPECTED_CRON_JOBS = ["purge-assistant-actions", "purge-donation-tax-ids", "purge-write-requests"] as const;

/**
 * Scheduled writers that run in the Worker rather than pg_cron, watched through scheduled_writer_runs (0408). pg_cron
 * cannot see them, so each reports its own outcome (worker/writer-runs.mjs). Add the next one here and it is watched.
 */
export const EXPECTED_WORKER_WRITERS = ["label-drafts", "calendar-sweep", "merch-supplier-emails", "report-photo-retention"] as const;

/** A Worker writer runs every 15 minutes: no report for this long means the trigger or the report stopped. */
export const WORKER_WRITER_STALE_HOURS = 3;
/** The two once-a-day stages report one run a day, so they go stale on the same 48 hours as a nightly pg_cron job. */
export const DAILY_WORKER_WRITERS: readonly string[] = ["merch-supplier-emails", "report-photo-retention"];
/** One failed run is a blip (a slow answer, a deploy); this many in a row is a fault. */
export const WORKER_WRITER_RED_AFTER = 2;
/** One missed night is not an incident; two is. */
export const CRON_STALE_HOURS = 48;
