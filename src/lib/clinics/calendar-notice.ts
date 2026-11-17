/** The footer of an admin calendar notice. Imports nothing, so a test can prove the default shelter's text is unchanged. */
export const calendarNoticeFooter = (env: string, shortName: string, origin: string) =>
  `It is a change made in the shelter calendar, picked up by the ${env} ${shortName} system (${origin}). If this was a mistake, open the visit and set it back to scheduled.`;
