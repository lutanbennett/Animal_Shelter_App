"use client";

import Link from "next/link";

import { ArchiveContactControl } from "@/components/ArchiveContactControl";
import { ArchivedBadge } from "@/components/ArchivedBadge";
import { ContactActions } from "@/components/ContactActions";
import { CONTACT_ICONS } from "@/components/hub-icons";
import { formatDate } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  contactTypeLabel,
  placementTypeLabel,
  speciesLabel,
} from "@/lib/i18n/enum-labels";
import { CARER_CONTACT_TYPE, isArchived, type Contact } from "@/lib/contacts/contacts";

/** A placement_history row naming this contact as carer, with its resident. */
export type CarerPlacement = {
  id: string;
  placement_type: string;
  start_date: string;
  end_date: string | null;
  residents: {
    id: string;
    name: string;
    thai_name: string | null;
    resident_code: string;
    species: string | null;
    profile_photo_drive_file_id: string | null;
  } | null;
};

function residentName(
  resident: CarerPlacement["residents"],
  fallback: string,
) {
  if (!resident) return fallback;
  return resident.thai_name ? `${resident.name} (${resident.thai_name})` : resident.name;
}

function ResidentThumb({
  resident,
  alt,
}: {
  resident: CarerPlacement["residents"];
  alt: string;
}) {
  return resident?.profile_photo_drive_file_id ? (
    <img
      src={driveImageUrl(resident.profile_photo_drive_file_id)}
      alt={alt}
      className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover"
    />
  ) : (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-hover text-muted">
      <CONTACT_ICONS.residents aria-hidden="true" className="h-6 w-6" />
    </div>
  );
}

export function ContactHub({
  contact,
  placements,
  canManage,
  mapSrc,
}: {
  contact: Contact;
  placements: CarerPlacement[];
  canManage: boolean;
  /** Embed URL for the address, resolved by the page (map-preview.ts); null hides the map. */
  mapSrc: string | null;
}) {
  const { t, locale } = useI18n();
  const h = t.contacts.hub;
  const isCarer = contact.type === CARER_CONTACT_TYPE;
  const archived = isArchived(contact);
  const a = t.contacts.archive;

  const inCare = placements.filter((p) => !p.end_date);
  const past = placements.filter((p) => p.end_date);

  const hasDetails = Boolean(
    contact.phone ||
      contact.line_id ||
      contact.messenger_id ||
      contact.whatsapp ||
      contact.email ||
      contact.address,
  );
  const address = contact.address?.trim() || null;
  const addressIsLink = address !== null && /^https?:\/\//i.test(address);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Link href="/contacts" className="text-sm text-muted hover:text-foreground">
        {h.backToContacts}
      </Link>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <CONTACT_ICONS.contact aria-hidden="true" className="h-6 w-6 shrink-0 text-muted" />
            <h1 className="text-2xl font-semibold text-foreground">{contact.name}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isCarer ? "bg-success/15 text-success" : "bg-surface-hover text-muted"
              }`}
            >
              {contactTypeLabel(t, contact.type)}
            </span>
            {archived && <ArchivedBadge label={a.badge} />}
          </div>
          {canManage && (
            <Link
              href={archived ? "/management/contacts?archived=1" : "/management/contacts"}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t.contacts.manageInAdmin}
            </Link>
          )}
        </div>

        {archived && (
          <div className="flex flex-col gap-0.5 rounded border border-dashed border-border bg-background px-3 py-2 text-sm text-muted">
            <span className="font-medium">
              {a.archivedOn(formatDate(contact.archived_at, locale))}
            </span>
            {contact.archive_reason && (
              <span className="whitespace-pre-line">{a.reason(contact.archive_reason)}</span>
            )}
          </div>
        )}
        {canManage && (
          <div className="self-start">
            <ArchiveContactControl
              contact={contact}
              blocker={inCare.length > 0 ? a.errors.hasResidentsInCare(inCare.length) : null}
            />
          </div>
        )}

        {/* The action tiles carry each channel's value, so the only detail
            repeated below them is the address: a tile truncates a long Thai
            address, and the map preview belongs under the full text. */}
        {hasDetails ? (
          <>
            <ContactActions contact={contact} size="lg" />
            {address && (
              <div className="flex items-start gap-2">
                <CONTACT_ICONS.address aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted">{h.address}</span>
                    {addressIsLink ? (
                      <a
                        href={address}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm text-primary hover:underline"
                      >
                        {address}
                      </a>
                    ) : (
                      <span className="whitespace-pre-line break-words text-sm text-foreground">
                        {address}
                      </span>
                    )}
                  </div>
                  {mapSrc && (
                    <iframe
                      src={mapSrc}
                      title={h.mapPreview(contact.name)}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="h-[200px] w-full rounded-lg border border-border bg-surface-hover"
                    />
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">{h.noDetails}</p>
        )}
        {contact.notes && (
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <span className="text-xs text-muted">{h.notes}</span>
            <p className="whitespace-pre-line text-sm text-foreground">{contact.notes}</p>
          </div>
        )}
      </div>

      {/* Residents only make sense for carers. A contact of another type
          that somehow has placements (the type was Carer at the time)
          still gets them listed rather than hidden. */}
      {(isCarer || placements.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CONTACT_ICONS.inCare aria-hidden="true" className="h-5 w-5 text-muted" />
              <h2 className="text-lg font-semibold text-foreground">{h.residentsInCare}</h2>
              <span className="text-sm text-muted">({inCare.length})</span>
            </div>
            <p className="text-xs text-muted">{h.residentsInCareDetail}</p>
            {inCare.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {inCare.map((p) => {
                  const name = residentName(p.residents, h.unknownResident);
                  return (
                    <li key={p.id}>
                      <Link
                        href={p.residents ? `/residents/${p.residents.id}` : "#"}
                        className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition hover:bg-surface-hover"
                      >
                        <ResidentThumb resident={p.residents} alt={name} />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium text-foreground">{name}</span>
                          <span className="truncate text-xs text-muted">
                            {[p.residents?.resident_code, speciesLabel(t, p.residents?.species)]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                          <span className="text-xs text-muted">
                            {h.since(formatDate(p.start_date, locale))}
                          </span>
                        </div>
                        <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                          {placementTypeLabel(t, p.placement_type)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
                {isCarer ? h.noResidentsInCare : h.notACarer}
              </p>
            )}
            {isCarer && (
              <p className="text-xs text-muted">
                {archived ? h.archivedCarer : h.assignFromResident}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CONTACT_ICONS.residents aria-hidden="true" className="h-5 w-5 text-muted" />
              <h2 className="text-lg font-semibold text-foreground">{h.pastPlacements}</h2>
              <span className="text-sm text-muted">({past.length})</span>
            </div>
            <p className="text-xs text-muted">{h.pastPlacementsDetail}</p>
            {past.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {past.map((p) => {
                  const name = residentName(p.residents, h.unknownResident);
                  return (
                    <li key={p.id}>
                      <Link
                        href={p.residents ? `/residents/${p.residents.id}/housing` : "#"}
                        className="flex items-center justify-between gap-3 rounded border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-hover"
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium text-foreground">{name}</span>
                          <span className="truncate text-xs text-muted">
                            {placementTypeLabel(t, p.placement_type)}
                            {p.residents?.resident_code && ` · ${p.residents.resident_code}`}
                          </span>
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-xs text-muted">
                          {h.placementRange(
                            formatDate(p.start_date, locale),
                            formatDate(p.end_date, locale),
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
                {h.noPastPlacements}
              </p>
            )}
          </section>
        </div>
      )}

    </main>
  );
}
