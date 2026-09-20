"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { ContactActions } from "@/components/ContactActions";
import { CONTACT_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { contactTypeLabel } from "@/lib/i18n/enum-labels";
import {
  CARER_CONTACT_TYPE,
  CONTACT_TYPES,
  type Contact,
  type ContactType,
} from "@/lib/contacts/contacts";

export type ContactSummary = Contact & {
  /** Residents fostered or adopted and living with this carer now. */
  inCareCount: number;
};

type TypeFilter = ContactType | "all";

/** Case-insensitive substring match over the fields someone would search by. */
function matches(contact: Contact, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return [contact.name, contact.phone, contact.email, contact.line_id, contact.address]
    .filter((v): v is string => Boolean(v))
    .some((v) => v.toLowerCase().includes(q));
}

function ContactCard({ contact }: { contact: ContactSummary }) {
  const { t } = useI18n();
  const isCarer = contact.type === CARER_CONTACT_TYPE;

  // The name link's ::after overlay makes the whole card tappable without
  // nesting the action links inside it (same trick as StatCard).
  return (
    <li className="relative flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition hover:bg-surface-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={`/contacts/${contact.id}`}
            className="truncate font-medium text-foreground after:absolute after:inset-0 after:content-['']"
          >
            {contact.name}
          </Link>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isCarer ? "bg-success/15 text-success" : "bg-surface-hover text-muted"
              }`}
            >
              {contactTypeLabel(t, contact.type)}
            </span>
            {contact.inCareCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                <CONTACT_ICONS.inCare aria-hidden="true" className="h-3 w-3" />
                {t.contacts.list.inCare(contact.inCareCount)}
              </span>
            )}
          </div>
          {/* Wider screens have room for the details themselves; on a
              phone the buttons carry them (as tooltips) and the hub has
              the full read-out. */}
          <p className="hidden truncate text-xs text-muted md:block">
            {[contact.phone, contact.line_id && `LINE ${contact.line_id}`, contact.email]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <ContactActions contact={contact} />
      </div>
    </li>
  );
}

export function ContactList({ contacts }: { contacts: ContactSummary[] }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");

  const countByType = useMemo(() => {
    const counts = new Map<TypeFilter, number>([["all", contacts.length]]);
    for (const c of contacts) counts.set(c.type, (counts.get(c.type) ?? 0) + 1);
    return counts;
  }, [contacts]);

  const shown = useMemo(
    () =>
      contacts.filter(
        (c) => (type === "all" || c.type === type) && matches(c, query.trim()),
      ),
    [contacts, type, query],
  );

  if (contacts.length === 0) {
    return (
      <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
        {t.contacts.list.noContacts}
      </p>
    );
  }

  const filters: TypeFilter[] = ["all", ...CONTACT_TYPES];

  return (
    <div className="flex flex-col gap-4">
      {/* Search and type chips stay put while the list scrolls under them —
          on a phone that's the difference between a contact list and a
          scroll hunt. */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-2 bg-background px-4 py-2 md:static md:mx-0 md:px-0 md:py-0">
        <label className="relative block">
          <span className="sr-only">{t.contacts.searchLabel}</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.contacts.searchPlaceholder}
            autoComplete="off"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 md:text-sm"
          />
        </label>
        <div
          role="radiogroup"
          aria-label={t.contacts.filterLabel}
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
        >
          {filters.map((filter) => {
            const count = countByType.get(filter) ?? 0;
            const active = filter === type;
            return (
              <button
                key={filter}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setType(filter)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted hover:text-foreground"
                }`}
              >
                {filter === "all" ? t.contacts.allTypes : contactTypeLabel(t, filter)}
                <span className={`ml-1 text-xs ${active ? "opacity-80" : "opacity-60"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted">
        {t.contacts.list.count(shown.length, contacts.length)}
      </p>

      {shown.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </ul>
      ) : (
        <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
          {t.contacts.list.noMatches}
        </p>
      )}
    </div>
  );
}
