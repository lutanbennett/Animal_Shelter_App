/** The one "available for adoption" pill: home, animal page, cards, /r/ card. */
export function AvailableBadge({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span
      className={`rounded-full bg-site-accent-soft px-3 py-1 text-sm font-bold text-site-on-accent-soft ${className}`}
    >
      {label}
    </span>
  );
}
