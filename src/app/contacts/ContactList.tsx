"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { ArchivedBadge } from "@/components/ArchivedBadge";
import { ContactActions } from "@/components/ContactActions";
import { FriendBadge } from "@/components/FriendBadge";
import { CONTACT_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { contactTypeLabel } from "@/lib/i18n/enum-labels";
import {
  CARER_CONTACT_TYPE,
  CONTACT_TYPES,
  isArchived,
  type Contact,
  type ContactType,
} from "@/lib/contacts/contacts";

export type ContactSummary = Contact & {
  /** Residents fostered or adopted and living with this carer now. */
  inCareCount: number;
  /** Shelter Friend profile (0076): null when there is none, else whether it is published. */
  friendPublished: boolean | null;
};

/**
 * A contact type, everyone, or the Shelter Friends. Friends sit in the
 * same row of chips rather than a second filter: they are all Vendors
 * today, so "Vendor and Friend" would be the same list as "Friend".
 */
type TypeFilter = ContactType | "all" | "friends";

const isFriend = (c: ContactSummary) => c.friendPublished !== null;

/** Case-insensitive substring match over the fields someone would search by. */
function matches(contact: Contact, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return [
    contact.name,
    contact.phone,
    contact.email,
    contact.line_id,
    contact.messenger_id,
    contact.whatsapp,
    contact.address,
    contact.notes,
  ]
    .filter((v): v is string => Boolean(v))
    .some((v) => v.toLowerCase().includes(q));
}

function ContactCard({ contact }: { contact: ContactSummary }) {
  const { t } = useI18n();
  const isCarer = contact.type === CARER_CONTACT_TYPE;
  const archived = isArchived(contact);

  // The name link's ::after overlay makes the whole card tappable without
  // nesting the action links inside it (same trick as StatCard).
  return (
    <li
      className={`relative flex flex-col gap-3 rounded-lg border p-4 transition hover:bg-surface-hover ${
        archived ? "border-dashed border-border bg-background" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={`/contacts/${contact.id}`}
            className={`truncate font-medium after:absolute after:inset-0 after:content-[''] ${
              archived ? "text-muted" : "text-foreground"
            }`}
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
            {archived && <ArchivedBadge label={t.contacts.archive.badge} />}
            {contact.friendPublished !== null && (
              <FriendBadge
                label={t.shelterFriends.badge}
                published={contact.friendPublished && !archived}
                title={
                  contact.friendPublished && !archived
                    ? t.shelterFriends.card.onWebsite
                    : t.shelterFriends.card.notOnWebsite
                }
              />
            )}
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
          {archived && contact.archive_reason && (
            <p className="truncate text-xs text-muted">
              {t.contacts.archive.reason(contact.archive_reason)}
            </p>
          )}
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

export function ContactList({
  contacts,
  initialShowArchived = false,
}: {
  /** Every contact, archived ones included — the list decides what to show. */
  contacts: ContactSummary[];
  /** From ?archived=1, so a bookmarked or shared link keeps the toggle. */
  initialShowArchived?: boolean;
}) {
  const { t } = useI18n();
  const a = t.contacts.archive;
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [showArchived, setShowArchived] = useState(initialShowArchived);

  const archivedCount = useMemo(() => contacts.filter(isArchived).length, [contacts]);
  // What the list is "about": live contacts, or everyone with the toggle on.
  // The type chips and the "N of M" count are over this.
  const listed = useMemo(
    () => (showArchived ? contacts : contacts.filter((c) => !isArchived(c))),
    [contacts, showArchived],
  );

  const countByType = useMemo(() => {
    const counts = new Map<TypeFilter, number>([
      ["all", listed.length],
      ["friends", listed.filter(isFriend).length],
    ]);
    for (const c of listed) counts.set(c.type, (counts.get(c.type) ?? 0) + 1);
    return counts;
  }, [listed]);

  const q = query.trim();
  // A name search looks through archived contacts too, toggle or not: the
  // question "do we have a number for Khun Nid?" must never be answered
  // "no match" when we do. Archived matches come after the live ones.
  const shown = useMemo(() => {
    const pool = q ? contacts : listed;
    const hits = pool.filter(
      (c) =>
        (type === "all" || (type === "friends" ? isFriend(c) : c.type === type)) &&
        matches(c, q),
    );
    return [...hits.filter((c) => !isArchived(c)), ...hits.filter(isArchived)];
  }, [contacts, listed, type, q]);
  const archivedMatchesShown =
    !showArchived && q !== "" && shown.some((c) => isArchived(c));

  function toggleArchived() {
    const next = !showArchived;
    setShowArchived(next);
    // Keep the URL in step without a server round trip, so reload keeps it.
    try {
      const url = new URL(window.location.href);
      if (next) url.searchParams.set("archived", "1");
      else url.searchParams.delete("archived");
      window.history.replaceState(null, "", url);
    } catch {
      // The toggle still works for this visit.
    }
  }

  if (contacts.length === 0) {
    return (
      <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
        {t.contacts.list.noContacts}
      </p>
    );
  }

  // The Friends chip appears once there is a Friend to filter to.
  const filters: TypeFilter[] = [
    "all",
    ...CONTACT_TYPES,
    ...(contacts.some(isFriend) ? (["friends"] as const) : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Search and type chips stay put while the list scrolls under them —
          on a phone that's the difference between a contact list and a
          scroll hunt. */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-2 bg-background py-2 md:static md:mx-0 md:py-0">
        <label className="relative mx-4 block md:mx-0">
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
          className="flex gap-1.5 overflow-x-auto px-4 pb-1 md:flex-wrap md:px-0"
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
                {filter === "all"
                  ? t.contacts.allTypes
                  : filter === "friends"
                    ? t.shelterFriends.filterChip
                    : contactTypeLabel(t, filter)}
                <span className={`ml-1 text-xs ${active ? "opacity-80" : "opacity-60"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span>{t.contacts.list.count(shown.length, listed.length)}</span>
        {archivedCount > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              {showArchived ? a.archivedIncluded(archivedCount) : a.archivedHidden(archivedCount)}
            </span>
            <button
              type="button"
              aria-pressed={showArchived}
              onClick={toggleArchived}
              className={`rounded-full border px-2.5 py-0.5 font-medium ${
                showArchived
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {showArchived ? a.hideArchived : a.showArchived}
            </button>
          </>
        )}
        {archivedMatchesShown && <span className="w-full">{a.searchIncludesArchived}</span>}
      </div>

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
