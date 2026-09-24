import { HeartHandshake } from "lucide-react";

/**
 * The "Shelter Friend" pill a contact with a public profile carries in
 * the contact lists and on its own page. Dimmed while the profile isn't
 * on the website, so a list shows at a glance which friends are live.
 * Takes its labels so server and client components can both render it.
 */
export function FriendBadge({
  label,
  published,
  title,
}: {
  label: string;
  published: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
        published
          ? "bg-primary/15 text-primary"
          : "border border-dashed border-primary/40 text-primary/80"
      }`}
    >
      <HeartHandshake aria-hidden="true" className="h-3 w-3" />
      {label}
    </span>
  );
}
