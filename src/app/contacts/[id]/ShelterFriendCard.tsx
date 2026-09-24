"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { ExternalLink, Eye, EyeOff } from "lucide-react";
import { FriendBadge } from "@/components/FriendBadge";
import { FriendCard } from "@/components/FriendCard";
import { TranslationPanel } from "@/components/TranslationPanel";
import { isArchived, type Contact } from "@/lib/contacts/contacts";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { checkFacebookUrl, checkHttpsUrl, FACEBOOK_HOSTS, type LinkCheck } from "@/lib/links/validate";
import {
  canBecomeFriend,
  friendAnchor,
  FRIEND_OPT_INS,
  previewPublicFriend,
  type FriendOptIn,
  type ShelterFriend,
} from "@/lib/shelter-friends/friends";
import type { TranslationRow } from "@/lib/translations/types";
import {
  createFriend,
  deleteFriend,
  removeFriendLogo,
  setFriendPublished,
  updateFriend,
  uploadFriendLogo,
  type FriendActionResult,
  type FriendFields,
} from "@/app/management/shelter-friends/actions";

const inputClass =
  "w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
const buttonClass =
  "inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50";

/** Which contact detail each opt-in releases — the view's CASE columns (0076). */
const OPT_IN_SOURCE: Record<FriendOptIn, (c: Contact) => string | null> = {
  show_phone: (c) => c.phone,
  show_email: (c) => c.email,
  show_line: (c) => c.line_id,
  show_address: (c) => c.address,
  show_map: (c) => c.address,
};

function fieldsFrom(friend: ShelterFriend): FriendFields {
  return {
    blurb: friend.blurb ?? "",
    helpKind: friend.help_kind ?? "",
    discountNote: friend.discount_note ?? "",
    websiteUrl: friend.website_url ?? "",
    facebookUrl: friend.facebook_url ?? "",
    friendSince: friend.friend_since ?? "",
    show_phone: friend.show_phone,
    show_email: friend.show_email,
    show_line: friend.show_line,
    show_address: friend.show_address,
    show_map: friend.show_map,
  };
}

/**
 * The "Shelter Friend" card on a contact's page (0076). A manager makes
 * the contact a Friend, writes the profile, ticks what the business agreed
 * to show, publishes it and sees the card exactly as /friends will draw it
 * (the same FriendCard, fed by previewPublicFriend). Every other role sees
 * that the contact is a Friend and whether it is live, read-only.
 *
 * Offered only where canBecomeFriend() allows — Vendors, for now. A
 * contact that already has a profile keeps the card whatever its type.
 */
export function ShelterFriendCard({
  contact,
  friend,
  canManage,
  mapSrc,
  translations,
}: {
  contact: Contact;
  friend: ShelterFriend | null;
  canManage: boolean;
  /** The contact's address as a map embed, for the preview when Map is ticked. */
  mapSrc: string | null;
  translations: Partial<Record<"blurb" | "help_kind" | "discount_note", TranslationRow>>;
}) {
  const { t, locale } = useI18n();
  const f = t.shelterFriends;
  const c = f.card;
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null,
  );
  const [editing, setEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [draft, setDraft] = useState<FriendFields | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  function run(action: () => Promise<FriendActionResult>, after?: () => void) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await action();
        if ("error" in result) {
          setMessage({ type: "error", text: result.error });
        } else {
          setMessage({ type: "success", text: result.success });
          after?.();
        }
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : t.common.failedToSave,
        });
      }
    });
  }

  const feedback = message && (
    <p className={`text-sm ${message.type === "error" ? "text-danger" : "text-success"}`}>
      {message.text}
    </p>
  );

  // --- Not a Friend yet: a manager may make one, where the gate allows.
  if (!friend) {
    if (!canManage || !canBecomeFriend(contact) || isArchived(contact)) return null;
    return (
      <section className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">{c.heading}</h2>
        <p className="text-sm text-muted">{c.intro}</p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => createFriend(contact.id), () => setEditing(true))}
          className="self-start rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? c.making : c.make}
        </button>
        {feedback}
      </section>
    );
  }

  // The draft is seeded by Edit profile; until then (and straight after
  // Make a Shelter Friend, when the new row has just arrived) it is the
  // saved profile.
  const fields = draft ?? fieldsFrom(friend);

  const archived = isArchived(contact);
  const live = friend.published && !archived;
  const shown: FriendFields = editing ? fields : fieldsFrom(friend);
  const shownWebsite = checkHttpsUrl(shown.websiteUrl);
  const shownFacebook = checkFacebookUrl(shown.facebookUrl);
  const preview = previewPublicFriend(
    {
      id: friend.id,
      blurb: shown.blurb.trim() || null,
      help_kind: shown.helpKind.trim() || null,
      discount_note: shown.discountNote.trim() || null,
      // What the server would save: normalised, or left off while invalid.
      website_url: shownWebsite.ok ? shownWebsite.url : null,
      facebook_url: shownFacebook.ok ? shownFacebook.url : null,
      logo_drive_file_id: friend.logo_drive_file_id,
      friend_since: shown.friendSince || null,
      sort_order: friend.sort_order,
      show_phone: shown.show_phone,
      show_email: shown.show_email,
      show_line: shown.show_line,
      show_address: shown.show_address,
      show_map: shown.show_map,
    },
    contact,
  );

  const set = <K extends keyof FriendFields>(key: K, value: FriendFields[K]) =>
    setDraft({ ...fields, [key]: value });

  const websiteCheck = checkHttpsUrl(fields.websiteUrl);
  const facebookCheck = checkFacebookUrl(fields.facebookUrl);
  const linkError = (check: LinkCheck, hosts?: readonly string[]) =>
    check.ok
      ? null
      : check.error === "wrongHost"
        ? t.linkErrors.wrongHost((hosts ?? []).join(" / "))
        : t.linkErrors[check.error];
  const websiteError = linkError(websiteCheck);
  const facebookError = linkError(facebookCheck, FACEBOOK_HOSTS);

  const savedProse = [
    { key: "help_kind" as const, label: c.helpKind, value: friend.help_kind },
    { key: "blurb" as const, label: c.blurb, value: friend.blurb },
    { key: "discount_note" as const, label: c.discountNote, value: friend.discount_note },
  ];

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">{c.heading}</h2>
        <FriendBadge
          label={live ? c.onWebsite : c.notOnWebsite}
          published={live}
        />
      </div>

      {archived && friend.published && (
        <p className="rounded border border-dashed border-border bg-background px-3 py-2 text-sm text-muted">
          {c.archivedHidden}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {canManage && !editing && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => setFriendPublished(friend.id, !friend.published))}
              className={
                friend.published
                  ? buttonClass
                  : "rounded bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
              }
            >
              {friend.published ? c.unpublish : c.publish}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setDraft(fieldsFrom(friend));
                setEditing(true);
              }}
              className={buttonClass}
            >
              {c.editProfile}
            </button>
          </>
        )}
        <button
          type="button"
          aria-expanded={showPreview}
          onClick={() => setShowPreview(!showPreview)}
          className={buttonClass}
        >
          {showPreview ? (
            <EyeOff aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Eye aria-hidden="true" className="h-4 w-4" />
          )}
          {showPreview ? c.hidePreview : c.preview}
        </button>
        {live && (
          <Link
            href={`/friends#${friendAnchor(friend.id)}`}
            target="_blank"
            className={buttonClass}
          >
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            {c.viewOnSite}
          </Link>
        )}
      </div>
      {!editing && feedback}

      {showPreview && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{c.previewHeading}</span>
            {editing && <span className="text-xs text-muted">{c.previewUnsaved}</span>}
            {!live && <span className="text-xs text-muted">{c.previewNotLive}</span>}
          </div>
          <div className="max-w-md">
            <FriendCard
              friend={preview}
              t={t}
              locale={locale}
              mapSrc={preview.map_location ? mapSrc : null}
            />
          </div>
        </div>
      )}

      {!editing && (
        <dl className="flex flex-col gap-3">
          {savedProse
            .filter((p) => p.value)
            .map((p) => (
              <div key={p.key} className="flex flex-col gap-1">
                <dt className="text-xs text-muted">{p.label}</dt>
                <dd className="whitespace-pre-line text-sm text-foreground">{p.value}</dd>
                {translations[p.key] && (
                  <TranslationPanel
                    key={translations[p.key]!.id + translations[p.key]!.updated_at}
                    row={translations[p.key]!}
                    canManage={canManage}
                    recordPath={`/contacts/${contact.id}`}
                  />
                )}
              </div>
            ))}
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted">{c.optInsHeading}</dt>
            <dd className="text-sm text-foreground">
              {FRIEND_OPT_INS.filter((key) => friend[key])
                .map((key) => c.optIns[key])
                .join(" · ") || t.common.dash}
            </dd>
          </div>
          {!canManage && <p className="text-xs text-muted">{c.readOnly}</p>}
        </dl>
      )}

      {canManage && editing && (
        // noValidate: the browser's own type="url" check would refuse a
        // bare "www.shop.co.th" that checkHttpsUrl accepts, so the shared
        // validator is the only rule (the inputs keep type="url" for the
        // phone keyboard).
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (websiteError || facebookError) return;
            run(() => updateFriend(friend.id, fields), () => setEditing(false));
          }}
        >
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted">{c.logo}</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
                {friend.logo_drive_file_id ? (
                  <Image
                    src={driveImageUrl(friend.logo_drive_file_id)}
                    alt={f.logoAlt(contact.name)}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                ) : (
                  <span className="text-xs text-muted">{c.noLogo}</span>
                )}
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => logoInput.current?.click()}
                className={buttonClass}
              >
                {isPending ? t.common.uploading : friend.logo_drive_file_id ? c.replaceLogo : c.uploadLogo}
              </button>
              {friend.logo_drive_file_id && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (window.confirm(c.removeLogoConfirm)) run(() => removeFriendLogo(friend.id));
                  }}
                  className="rounded border border-danger/40 px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
                >
                  {c.removeLogo}
                </button>
              )}
              <input
                ref={logoInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("file", file);
                  run(() => uploadFriendLogo(friend.id, formData));
                }}
              />
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted">{c.helpKind}</span>
            <input
              value={fields.helpKind}
              onChange={(e) => set("helpKind", e.target.value)}
              placeholder={c.helpKindPlaceholder}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted">{c.blurb}</span>
            <span className="text-xs text-muted">{c.blurbHint}</span>
            <textarea
              value={fields.blurb}
              onChange={(e) => set("blurb", e.target.value)}
              rows={3}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted">{c.discountNote}</span>
            <input
              value={fields.discountNote}
              onChange={(e) => set("discountNote", e.target.value)}
              placeholder={c.discountNotePlaceholder}
              className={inputClass}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted">{c.website}</span>
              <input
                type="url"
                inputMode="url"
                value={fields.websiteUrl}
                onChange={(e) => set("websiteUrl", e.target.value)}
                placeholder={c.websitePlaceholder}
                aria-invalid={websiteError ? true : undefined}
                className={inputClass}
              />
              {websiteError && <span className="text-xs text-danger">{websiteError}</span>}
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted">{c.facebook}</span>
              <input
                type="url"
                inputMode="url"
                value={fields.facebookUrl}
                onChange={(e) => set("facebookUrl", e.target.value)}
                placeholder={c.facebookPlaceholder}
                aria-invalid={facebookError ? true : undefined}
                className={inputClass}
              />
              {facebookError && <span className="text-xs text-danger">{facebookError}</span>}
            </label>
          </div>
          <label className="flex flex-col gap-1 sm:w-56">
            <span className="text-sm font-medium text-muted">{c.friendSince}</span>
            <input
              type="date"
              value={fields.friendSince}
              onChange={(e) => set("friendSince", e.target.value)}
              className={inputClass}
            />
          </label>

          <fieldset className="flex flex-col gap-2 rounded border border-border p-3">
            <legend className="px-1 text-sm font-medium text-foreground">{c.optInsHeading}</legend>
            <p className="text-xs text-muted">{c.optInsHint}</p>
            {FRIEND_OPT_INS.map((key) => {
              const value = OPT_IN_SOURCE[key](contact);
              return (
                <label key={key} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={fields[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium text-foreground">{c.optIns[key]}</span>
                    <span className="truncate text-xs text-muted">{value?.trim() || c.notRecorded}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={isPending || Boolean(websiteError || facebookError)}
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? t.common.saving : t.common.save}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setDraft(fieldsFrom(friend));
                setEditing(false);
                setMessage(null);
              }}
              className={buttonClass}
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (window.confirm(c.removeConfirm(contact.name))) {
                  run(() => deleteFriend(friend.id), () => {
                    setEditing(false);
                    setDraft(null);
                  });
                }
              }}
              className="ml-auto rounded border border-danger/40 px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              {c.removeProfile}
            </button>
          </div>
          {feedback}
        </form>
      )}
    </section>
  );
}
