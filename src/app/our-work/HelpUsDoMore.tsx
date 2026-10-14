import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * The give line at the end of every story and under the Our work list
 * (public site review 2026-10-13, §6.4): a story is the most persuasive page
 * on the site, and until now its only Donate was the header button. One
 * sentence and a link in the site's action colour, nothing louder.
 */
export function HelpUsDoMore({ t }: { t: Dictionary }) {
  return (
    <p data-reveal className="text-base leading-relaxed text-foreground sm:text-lg">
      {t.ourWork.helpMore}{" "}
      <Link
        href="/donate"
        className="inline-flex min-h-11 items-center font-bold text-site-action-hover underline underline-offset-4 hover:text-site-action"
      >
        {t.ourWork.helpMoreLink} &rarr;
      </Link>
    </p>
  );
}
