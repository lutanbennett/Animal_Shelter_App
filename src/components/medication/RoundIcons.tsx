import { Moon, Sun, Sunrise } from "lucide-react";
import { ROUND_KEYS, type RoundKey } from "@/lib/rounds/suggest";

const ICON: Record<RoundKey, typeof Sun> = { morning: Sunrise, lunch: Sun, evening: Moon };

/** The icon alone, for the round chooser. */
export function RoundIcon({ round, className }: { round: RoundKey; className?: string }) {
  const Icon = ICON[round];
  return <Icon aria-hidden className={className ?? "h-6 w-6"} />;
}

/**
 * Frequency as a picture: the three rounds of the day as sunrise, sun and moon, the ones this
 * dose is given in solid and the others faint, so "twice a day" reads as two lit icons without
 * a word (the helpers read neither Thai nor English). The names are the accessible label.
 */
export function RoundStrip({
  rounds,
  names,
  label,
}: {
  rounds: readonly RoundKey[];
  names: Record<string, string>;
  /** Spoken/assistive description, e.g. "Given: Morning, Evening". */
  label: string;
}) {
  return (
    <span role="img" aria-label={label} className="inline-flex items-center gap-1">
      {ROUND_KEYS.map((key) => {
        const on = rounds.includes(key);
        const Icon = ICON[key];
        return (
          <span
            key={key}
            title={names[key]}
            className={
              on
                ? "flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground bg-foreground text-background"
                : "flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-border text-muted opacity-50"
            }
          >
            <Icon aria-hidden className="h-5 w-5" />
          </span>
        );
      })}
    </span>
  );
}
