import Image from "next/image";
import { Globe, Mail, MapPin, MessageCircle, Phone, Tag } from "lucide-react";
import { FacebookIcon } from "@/components/FacebookIcon";
import { lineHref, mailtoHref, mapHref, telHref } from "@/lib/contacts/contacts";
import { formatDate } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
import {
  friendAnchor,
  publicFriendText,
  type PublicFriend,
} from "@/lib/shelter-friends/friends";

const linkClass =
  "inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary";

/**
 * One Shelter Friend as a visitor sees it. /friends renders it from
 * public_shelter_friends, and the contact hub's preview renders it from
 * previewPublicFriend() — the same component, so the preview can't drift
 * from the page. No hooks: `t` and `locale` come in as props, so it works
 * on the server and inside the client card alike.
 *
 * Every row is drawn only when the view gave it a value, so a Friend who
 * opted into nothing reads as a name, a logo and a thank-you rather than
 * a stack of empty labels.
 */
export function FriendCard({
  friend,
  t,
  locale,
  mapSrc,
}: {
  friend: PublicFriend;
  t: Dictionary;
  locale: Locale;
  /** Embed URL for map_location, resolved on the server; null draws no map. */
  mapSrc: string | null;
}) {
  const f = t.shelterFriends;
  const { blurb, helpKind, discountNote } = publicFriendText(friend, locale);
  const tel = telHref(friend.phone);
  const line = lineHref(friend.line_id);
  const mail = mailtoHref(friend.email);
  const address = friend.address?.trim() || null;
  const addressIsLink = address !== null && /^https?:\/\//i.test(address);
  const mapsLink = mapHref(friend.map_location ?? friend.address);
  const hasLinks = Boolean(friend.website_url || friend.facebook_url);
  const hasContact = Boolean(tel || line || mail);

  return (
    <article
      id={friendAnchor(friend.id)}
      className="flex scroll-mt-6 flex-col gap-4 rounded-lg border border-border bg-surface p-5"
    >
      <div className="flex items-start gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
          {friend.logo_drive_file_id ? (
            <Image
              src={driveImageUrl(friend.logo_drive_file_id)}
              alt={f.logoAlt(friend.name)}
              fill
              sizes="64px"
              className="object-contain p-1"
            />
          ) : (
            <span aria-hidden="true" className="text-2xl font-semibold text-primary">
              {friend.name.trim().charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="break-words text-lg font-semibold text-foreground">{friend.name}</h2>
          {helpKind && <p className="text-sm font-medium text-primary">{helpKind}</p>}
          {friend.friend_since && (
            <p className="text-xs text-muted">
              {f.friendSince(formatDate(friend.friend_since, locale))}
            </p>
          )}
        </div>
      </div>

      {blurb ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{blurb}</p>
      ) : (
        !helpKind && !discountNote && <p className="text-sm text-muted">{f.fallbackBlurb}</p>
      )}

      {discountNote && (
        <div className="flex items-start gap-2 rounded border border-primary/30 bg-primary/5 px-3 py-2">
          <Tag aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wide text-primary">
              {f.supporterOffer}
            </span>
            <span className="whitespace-pre-line text-sm text-foreground">{discountNote}</span>
          </div>
        </div>
      )}

      {(hasLinks || hasContact) && (
        <div className="flex flex-wrap gap-2">
          {friend.website_url && (
            <a
              href={friend.website_url}
              target="_blank"
              rel="noreferrer"
              aria-label={f.websiteOf(friend.name)}
              className={linkClass}
            >
              <Globe aria-hidden="true" className="h-4 w-4" />
              {f.website}
            </a>
          )}
          {friend.facebook_url && (
            <a
              href={friend.facebook_url}
              target="_blank"
              rel="noreferrer"
              aria-label={f.facebookOf(friend.name)}
              className={linkClass}
            >
              <FacebookIcon aria-hidden="true" className="h-4 w-4" />
              {f.facebook}
            </a>
          )}
          {tel && (
            <a href={tel} className={linkClass}>
              <Phone aria-hidden="true" className="h-4 w-4" />
              <span>
                {f.call} <span className="text-muted">{friend.phone}</span>
              </span>
            </a>
          )}
          {line && (
            <a href={line} target="_blank" rel="noreferrer" className={linkClass}>
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              {f.line(friend.line_id ?? "")}
            </a>
          )}
          {mail && (
            <a href={mail} className={`${linkClass} min-w-0`}>
              <Mail aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="break-all">{friend.email}</span>
            </a>
          )}
        </div>
      )}

      {address && (
        <div className="flex items-start gap-2 text-sm">
          <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          {addressIsLink ? (
            <a
              href={address}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              {f.openInMaps}
            </a>
          ) : (
            <span className="whitespace-pre-line break-words text-foreground">{address}</span>
          )}
        </div>
      )}

      {mapSrc && (
        <div className="flex flex-col gap-1">
          <iframe
            src={mapSrc}
            title={f.mapOf(friend.name)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[200px] w-full rounded-lg border border-border bg-surface-hover"
          />
          {mapsLink && !addressIsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noreferrer"
              className="self-start text-xs font-medium text-primary hover:underline"
            >
              {f.openInMaps}
            </a>
          )}
        </div>
      )}
    </article>
  );
}
