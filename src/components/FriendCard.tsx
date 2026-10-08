import Image from "next/image";
import { Globe, Mail, MapPin, MessageCircle, Phone, Tag } from "lucide-react";
import { FacebookIcon } from "@/components/FacebookIcon";
import { MapThumbnail } from "@/components/MapThumbnail";
import {
  lineHref,
  mailtoHref,
  addressText as writtenAddress,
  telHref,
  type AddressMap,
} from "@/lib/contacts/contacts";
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
  map,
  reveal = false,
}: {
  friend: PublicFriend;
  t: Dictionary;
  locale: Locale;
  /**
   * The map for this Friend's map_location (contacts.ts `AddressMap`),
   * built where a short link can be followed; null when it leads nowhere
   * valid. Drawn only when the view gave a map_location (show_map, 0076).
   */
  map: AddressMap | null;
  /** Spring into view on the public /friends page (src/app/adopt/SpringMotion.tsx). */
  reveal?: boolean;
}) {
  const f = t.shelterFriends;
  const { blurb, helpKind, discountNote } = publicFriendText(friend, locale);
  const tel = telHref(friend.phone);
  const line = lineHref(friend.line_id);
  const mail = mailtoHref(friend.email);
  // The address prints as words only. The map comes from map_location
  // alone (show_map); a link still sitting in front of an address that
  // predates 0164 is never printed.
  const addressText = writtenAddress(friend.address);
  const showMap = Boolean(friend.map_location && map);
  const hasLinks = Boolean(friend.website_url || friend.facebook_url);
  const hasContact = Boolean(tel || line || mail);

  return (
    <article
      id={friendAnchor(friend.id)}
      data-reveal={reveal || undefined}
      className="flex scroll-mt-6 flex-col gap-4 rounded-lg border border-border bg-surface p-5"
    >
      <div className="flex items-start gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-hover">
          {friend.logo_drive_file_id ? (
            <Image
              src={driveImageUrl(friend.logo_drive_file_id, 160)}
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

      {addressText && (
        <div className="flex items-start gap-2 text-sm">
          <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
          <span className="min-w-0 whitespace-pre-line break-words text-foreground">{addressText}</span>
        </div>
      )}

      {showMap && map && (
        <div className="flex flex-col gap-1">
          <MapThumbnail map={map} title={f.mapOf(friend.name)} openLabel={f.openInMaps} />
          <a
            href={map.href}
            target="_blank"
            rel="noreferrer"
            className="self-start text-xs font-medium text-primary hover:underline"
          >
            {f.openInMaps}
          </a>
        </div>
      )}
    </article>
  );
}
