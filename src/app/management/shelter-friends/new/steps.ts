/**
 * The Shelter Friend wizard's steps. Shared by the page (which reads
 * `?step=`, through intake's parseStepParam) and the form, so it lives
 * outside the "use client" module.
 *
 * Required answers come first (Who), the optional prose and links next, the
 * consent step just before Review so it is the last thing looked at before
 * saving. Review has no fields of its own.
 */
export const FRIEND_STEPS = ["who", "help", "links", "visibility", "review"] as const;

export type FriendStepId = (typeof FRIEND_STEPS)[number];

/** Index of the Review step; every step before it holds fields. */
export const FRIEND_REVIEW_STEP = FRIEND_STEPS.length - 1;
