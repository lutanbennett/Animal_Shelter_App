/** Longest message an adopter can send in one go. Plain constants: the form and the action both import this. */
export const ADOPTER_NOTE_MAX_CHARS = 2000;
/** How many updates one adopter contact may send in 24 hours: enough for a proud owner, too few to flood the review queue. */
export const ADOPTER_DAILY_CAP = 10;
/** Files (photos and videos together) one update may carry. Keeps the review queue readable and a phone upload short. */
export const ADOPTER_MAX_FILES = 6;
/** A photo: the same 15 MB the Worker and the proxy let through (src/lib/uploads/limits.ts); a phone photo is 2-6 MB. */
export const ADOPTER_MAX_PHOTO_BYTES = 15 * 1024 * 1024;
/**
 * A video. Lower than staff's 500 MB: a 1-2 minute phone clip at 1080p is about 60-150 MB, and a 150 MB file is already
 * roughly ten minutes on a weak mobile connection, which is as long as an adopter will watch a bar. It goes straight to Drive
 * in 8 MB resumable chunks, so the Worker body limit does not apply and a dropped connection resumes.
 */
export const ADOPTER_MAX_VIDEO_BYTES = 150 * 1024 * 1024;
