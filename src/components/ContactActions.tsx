"use client";

import { CONTACT_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  lineHref,
  mailtoHref,
  mapHref,
  telHref,
  type Contact,
} from "@/lib/contacts/contacts";

type ContactDetails = Pick<Contact, "phone" | "email" | "line_id" | "address">;

/**
 * The one-tap actions for a contact — call, LINE chat, email, open in
 * maps — as a row of buttons. Each is a plain link with the scheme the
 * phone hands off to its app (`tel:`, `mailto:`, the LINE and Maps URLs),
 * so nothing here needs JavaScript to work; only the actions the contact
 * has details for are rendered. `size="lg"` is the hub's full-width grid
 * with the value under each button; the default is the compact icon row
 * on the list cards, raised above the card's whole-card link overlay.
 */
export function ContactActions({
  contact,
  size = "sm",
}: {
  contact: ContactDetails;
  size?: "sm" | "lg";
}) {
  const { t } = useI18n();
  const a = t.contacts.actions;

  const actions = [
    { key: "call", href: telHref(contact.phone), label: a.call, value: contact.phone, icon: CONTACT_ICONS.call, external: false },
    { key: "line", href: lineHref(contact.line_id), label: a.line, value: contact.line_id, icon: CONTACT_ICONS.line, external: true },
    { key: "email", href: mailtoHref(contact.email), label: a.email, value: contact.email, icon: CONTACT_ICONS.email, external: false },
    { key: "map", href: mapHref(contact.address), label: a.map, value: contact.address, icon: CONTACT_ICONS.map, external: true },
  ].filter((action): action is typeof action & { href: string } => action.href !== null);

  if (actions.length === 0) return null;

  if (size === "lg") {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {actions.map((action) => (
          <a
            key={action.key}
            href={action.href}
            target={action.external ? "_blank" : undefined}
            rel={action.external ? "noopener noreferrer" : undefined}
            className="flex min-w-0 flex-col items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-3 text-primary transition hover:bg-primary/20"
          >
            <action.icon aria-hidden="true" className="h-6 w-6" />
            <span className="text-sm font-medium">{action.label}</span>
            <span className="w-full truncate text-center text-xs text-muted">
              {action.value}
            </span>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {actions.map((action) => (
        <a
          key={action.key}
          href={action.href}
          target={action.external ? "_blank" : undefined}
          rel={action.external ? "noopener noreferrer" : undefined}
          title={`${action.label} · ${action.value}`}
          aria-label={`${action.label} · ${action.value}`}
          className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary transition hover:bg-primary/20 md:h-9 md:w-9"
        >
          <action.icon aria-hidden="true" className="h-5 w-5 md:h-4 md:w-4" />
        </a>
      ))}
    </div>
  );
}
