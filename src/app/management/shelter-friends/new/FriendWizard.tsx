"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { FriendCard } from "@/components/FriendCard";
import { PendingPuppy } from "@/components/PuppyLoader";
import { ACTION_ICONS, CONTACT_ICONS } from "@/components/hub-icons";
import {
  mapEmbedSrc,
  mapQueryFromUrl,
  type Contact,
} from "@/lib/contacts/contacts";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { contactTypeLabel } from "@/lib/i18n/enum-labels";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { checkFacebookUrl, checkHttpsUrl, FACEBOOK_HOSTS, type LinkCheck } from "@/lib/links/validate";
import {
  FRIEND_CONTACT_TYPES,
  FRIEND_OPT_INS,
  previewPublicFriend,
  type FriendOptIn,
} from "@/lib/shelter-friends/friends";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { runUploadAction } from "@/lib/uploads/run-upload-action";
import { addShelterFriend, uploadFriendLogo, type WizardContact } from "../actions";
import { ReviewSummary, WizardNav, WizardProgress, type ReviewGroup } from "@/app/residents/new/WizardChrome";
import { FRIEND_REVIEW_STEP, FRIEND_STEPS } from "./steps";

const inputClass =
  "w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";
const buttonClass =
  "inline-flex min-h-11 items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50 md:min-h-0";

/** Kept per tab so a refresh (or a phone locking itself) keeps the typing, not just the step. */
const STORAGE_KEY = "shelter-friend-wizard-draft";

/**
 * Everything typed so far. Held in React state (not read back out of the
 * DOM as intake does) because the Review step's live card needs it, and
 * every step stays mounted — hidden, not unmounted — so nothing a step
 * holds is lost by moving away from it.
 */
type Draft = {
  mode: "existing" | "new";
  contactId: string;
  query: string;
  newName: string;
  newType: string;
  newPhone: string;
  newLine: string;
  newEmail: string;
  newAddress: string;
  helpKind: string;
  blurb: string;
  discountNote: string;
  websiteUrl: string;
  facebookUrl: string;
  /** Every box starts off: the business has to have said yes to each. */
  optIns: Record<FriendOptIn, boolean>;
};

const EMPTY_OPT_INS = Object.fromEntries(FRIEND_OPT_INS.map((key) => [key, false])) as Record<
  FriendOptIn,
  boolean
>;

const EMPTY_DRAFT: Draft = {
  mode: "existing",
  contactId: "",
  query: "",
  newName: "",
  newType: FRIEND_CONTACT_TYPES[0],
  newPhone: "",
  newLine: "",
  newEmail: "",
  newAddress: "",
  helpKind: "",
  blurb: "",
  discountNote: "",
  websiteUrl: "",
  facebookUrl: "",
  optIns: EMPTY_OPT_INS,
};

/** What a saved draft is allowed to bring back: known keys only, opt-ins strictly booleans. */
function readDraft(raw: string | null): { draft: Draft; logoName: string } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Draft> & { logoName?: unknown };
    const draft: Draft = { ...EMPTY_DRAFT, optIns: { ...EMPTY_OPT_INS } };
    for (const key of Object.keys(EMPTY_DRAFT) as (keyof Draft)[]) {
      if (key === "optIns") continue;
      const value = parsed[key];
      if (typeof value === "string") (draft[key] as string) = value;
    }
    if (draft.mode !== "new") draft.mode = "existing";
    for (const key of FRIEND_OPT_INS) draft.optIns[key] = parsed.optIns?.[key] === true;
    return { draft, logoName: typeof parsed.logoName === "string" ? parsed.logoName : "" };
  } catch {
    return null;
  }
}

function linkMessage(t: Dictionary, check: LinkCheck, hosts?: readonly string[]) {
  if (check.ok) return null;
  return check.error === "wrongHost"
    ? t.linkErrors.wrongHost((hosts ?? []).join(" / "))
    : t.linkErrors[check.error];
}

/** What stops a step being left, or null. Pure, so a restored draft can be checked too. */
function stepProblem(step: number, d: Draft, contacts: Contact[], t: Dictionary): string | null {
  const w = t.shelterFriends.wizard;
  if (step === 0) {
    if (d.mode === "existing") {
      return contacts.some((c) => c.id === d.contactId) ? null : w.who.pickRequired;
    }
    return d.newName.trim() ? null : w.who.nameRequired;
  }
  if (step === 2) {
    return (
      linkMessage(t, checkHttpsUrl(d.websiteUrl)) ??
      linkMessage(t, checkFacebookUrl(d.facebookUrl), FACEBOOK_HOSTS)
    );
  }
  return null;
}

/** The embed for a preview; a pasted maps link is read, a short link is not followed (the card does that). */
function previewMapSrc(address: string | null) {
  const trimmed = address?.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return mapEmbedSrc(trimmed);
  const [link, ...rest] = trimmed.split(/\s+/);
  return mapEmbedSrc(mapQueryFromUrl(link) ?? rest.join(" "));
}

type Result = {
  friendId: string;
  contactId: string;
  name: string;
  published: boolean;
  /** "none": no logo was chosen. */
  logo: "none" | "uploaded" | { error: string };
};

/**
 * Add a Shelter Friend as a wizard: Who, How they help, Logo and links,
 * What the public may see, Review. It borrows intake's chrome (progress,
 * Back / Next, Review with Edit links, `?step=`) rather than rebuilding it,
 * and ends in one save — addShelterFriend, then the logo.
 *
 * Nothing is written until Review. Step 4 is the one with an obligation
 * behind it: every opt-in starts off, and the words beside them are the
 * point of the step — see docs/decisions, 2026-09-24 and 2026-10-02.
 */
export function FriendWizard(props: { contacts: Contact[]; initialStep?: number }) {
  // Client-only: the draft lives in sessionStorage, which the server render
  // cannot see, so the form is not drawn until it can read it (drawing it
  // first and swapping the answers in would flash an empty wizard).
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return isClient ? <FriendWizardForm {...props} /> : null;
}

function FriendWizardForm({
  contacts,
  initialStep = 0,
}: {
  contacts: Contact[];
  initialStep?: number;
}) {
  const { t, locale } = useI18n();
  const w = t.shelterFriends.wizard;
  const card = t.shelterFriends.card;
  const form = t.management.contacts.createForm;
  const [pending, startTransition] = useTransition();

  // What was typed before a refresh, read once. This component only renders
  // on the client (see FriendWizard), so sessionStorage is there.
  const [saved] = useState(() => {
    try {
      return readDraft(sessionStorage.getItem(STORAGE_KEY));
    } catch {
      return null; // Storage blocked: it works, it just can't survive a refresh.
    }
  });
  // A refresh that lands on ?step=3 with Who still unanswered goes back to
  // the first step that needs an answer, rather than past it.
  const [startStep] = useState(() => {
    for (let i = 0; i < initialStep; i++) {
      if (stepProblem(i, saved?.draft ?? EMPTY_DRAFT, contacts, t)) return i;
    }
    return initialStep;
  });

  const [draft, setDraft] = useState<Draft>(saved?.draft ?? EMPTY_DRAFT);
  const [logo, setLogo] = useState<File | null>(null);
  const [lostLogoName, setLostLogoName] = useState(saved?.logoName ?? "");
  const [logoError, setLogoError] = useState<string | null>(null);
  const [step, setStep] = useState(startStep);
  const [maxVisited, setMaxVisited] = useState(startStep);
  const [showErrors, setShowErrors] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  /**
   * Who the profile is for changed: what was ticked was agreed by the
   * previous business, not this one, so every box goes back to off.
   */
  const changeWho = (change: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...change, optIns: { ...EMPTY_OPT_INS } }));

  const openStep = useCallback((next: number) => {
    setStep(next);
    setMaxVisited((seen) => Math.max(seen, next));
    setShowErrors(false);
    const { pathname } = window.location;
    window.history.replaceState(null, "", next === 0 ? pathname : `${pathname}?step=${next + 1}`);
    window.scrollTo(0, 0);
  }, []);

  // Point the address bar at the step actually opened.
  useEffect(() => {
    if (startStep === initialStep) return;
    const { pathname } = window.location;
    window.history.replaceState(null, "", startStep === 0 ? pathname : `${pathname}?step=${startStep + 1}`);
  }, [startStep, initialStep]);

  useEffect(() => {
    if (result) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, logoName: logo?.name ?? lostLogoName }));
    } catch {
      // see above
    }
  }, [result, draft, logo, lostLogoName]);

  const logoUrl = useMemo(() => (logo ? URL.createObjectURL(logo) : null), [logo]);
  useEffect(() => () => (logoUrl ? URL.revokeObjectURL(logoUrl) : undefined), [logoUrl]);

  const chosen = contacts.find((c) => c.id === draft.contactId) ?? null;
  const contactView = useMemo(
    () =>
      draft.mode === "existing"
        ? chosen
          ? { name: chosen.name, phone: chosen.phone, email: chosen.email, line_id: chosen.line_id, address: chosen.address }
          : null
        : {
            name: draft.newName.trim(),
            phone: draft.newPhone.trim() || null,
            email: draft.newEmail.trim() || null,
            line_id: draft.newLine.trim() || null,
            address: draft.newAddress.trim() || null,
          },
    [draft, chosen],
  );

  const go = (target: number) => {
    if (target > step) {
      for (let i = step; i < target; i++) {
        if (stepProblem(i, draft, contacts, t)) {
          openStep(i);
          setShowErrors(true);
          return;
        }
      }
    }
    openStep(target);
  };

  const website = checkHttpsUrl(draft.websiteUrl);
  const facebook = checkFacebookUrl(draft.facebookUrl);
  const websiteError = linkMessage(t, website);
  const facebookError = linkMessage(t, facebook, FACEBOOK_HOSTS);
  const whoProblem = showErrors && step === 0 ? stepProblem(0, draft, contacts, t) : null;

  const query = draft.query.trim().toLowerCase();
  const matches = contacts.filter(
    (c) => !query || c.name.toLowerCase().includes(query) || (c.phone ?? "").includes(query),
  );

  const optInValue: Record<FriendOptIn, string | null> = {
    show_phone: contactView?.phone ?? null,
    show_email: contactView?.email ?? null,
    show_line: contactView?.line_id ?? null,
    show_address: contactView?.address ?? null,
    show_map: contactView?.address ?? null,
  };

  const ticked = FRIEND_OPT_INS.filter((key) => draft.optIns[key]);
  const review: ReviewGroup[] = [
    {
      step: 0,
      title: w.review.groupWho,
      entries: [
        { label: form.name, value: contactView?.name || null },
        {
          label: form.type,
          value: contactTypeLabel(t, draft.mode === "new" ? draft.newType : (chosen?.type ?? "")),
        },
        {
          label: w.review.groupWho,
          value: draft.mode === "new" ? w.review.newBusiness : w.review.existingBusiness,
        },
        ...(draft.mode === "new"
          ? [
              { label: form.phone, value: contactView?.phone ?? null },
              { label: form.lineId, value: contactView?.line_id ?? null },
              { label: form.email, value: contactView?.email ?? null },
              { label: form.address, value: contactView?.address ?? null },
            ]
          : []),
      ],
    },
    {
      step: 1,
      title: w.review.groupHelp,
      entries: [
        { label: card.helpKind, value: draft.helpKind.trim() || null },
        { label: card.blurb, value: draft.blurb.trim() || null },
        { label: card.discountNote, value: draft.discountNote.trim() || null },
      ],
    },
    {
      step: 2,
      title: w.review.groupLinks,
      entries: [
        { label: card.logo, value: logo ? w.review.logoChosen(logo.name) : w.review.noLogo },
        { label: card.website, value: website.ok ? website.url : draft.websiteUrl.trim() || null },
        { label: card.facebook, value: facebook.ok ? facebook.url : draft.facebookUrl.trim() || null },
      ],
    },
    {
      step: 3,
      title: w.review.groupVisibility,
      entries: [
        {
          label: w.review.shownLabel,
          value: ticked.length ? ticked.map((key) => card.optIns[key]).join(" · ") : w.review.nothingShown,
        },
      ],
    },
  ];

  const preview =
    contactView &&
    previewPublicFriend(
      {
        id: "preview",
        blurb: draft.blurb.trim() || null,
        help_kind: draft.helpKind.trim() || null,
        discount_note: draft.discountNote.trim() || null,
        website_url: website.ok ? website.url : null,
        facebook_url: facebook.ok ? facebook.url : null,
        // A chosen logo is still a local file; it is uploaded after the save.
        logo_drive_file_id: null,
        friend_since: null,
        sort_order: 0,
        ...draft.optIns,
      },
      contactView,
    );

  function chooseLogo(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError(w.links.notAnImage);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setLogoError(t.admin.website.errors.fileTooLarge);
      return;
    }
    setLogoError(null);
    setLostLogoName("");
    setLogo(file);
  }

  function save(publish: boolean) {
    for (let i = 0; i < FRIEND_REVIEW_STEP; i++) {
      if (stepProblem(i, draft, contacts, t)) {
        openStep(i);
        setShowErrors(true);
        return;
      }
    }
    setSaveError(null);
    const contact: WizardContact =
      draft.mode === "existing"
        ? { mode: "existing", id: draft.contactId }
        : {
            mode: "new",
            name: draft.newName,
            type: draft.newType,
            phone: draft.newPhone,
            email: draft.newEmail,
            lineId: draft.newLine,
            address: draft.newAddress,
          };
    startTransition(async () => {
      try {
        const saved = await addShelterFriend({
          contact,
          publish,
          fields: {
            blurb: draft.blurb,
            helpKind: draft.helpKind,
            discountNote: draft.discountNote,
            websiteUrl: draft.websiteUrl,
            facebookUrl: draft.facebookUrl,
            friendSince: "",
            ...draft.optIns,
          },
        });
        if (!saved.ok) {
          setSaveError(saved.error);
          return;
        }
        // The rows exist now. A failed logo must not lose them, so it is
        // reported on the done screen instead of failing the save.
        let logoOutcome: Result["logo"] = "none";
        if (logo) {
          const formData = new FormData();
          formData.append("file", logo);
          const uploaded = await runUploadAction(logo, t.admin.website.errors, () =>
            uploadFriendLogo(saved.friendId, formData),
          );
          logoOutcome = uploaded.ok ? "uploaded" : { error: uploaded.error };
        }
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          // nothing to clear
        }
        setResult({
          friendId: saved.friendId,
          contactId: saved.contactId,
          name: saved.name,
          published: publish,
          logo: logoOutcome,
        });
        window.scrollTo(0, 0);
      } catch (err) {
        console.error("addShelterFriend failed:", err);
        setSaveError(t.common.failedToSave);
      }
    });
  }

  function startOver() {
    setDraft(EMPTY_DRAFT);
    setLogo(null);
    setLostLogoName("");
    setResult(null);
    setSaveError(null);
    openStep(0);
    setMaxVisited(0);
  }

  // --- Done: what was saved, and the logo if it didn't make it.
  if (result) {
    return (
      <section className="flex max-w-2xl flex-col gap-4 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">{w.created(result.name, result.published)}</h2>
        <p className="text-sm text-muted">{result.published ? w.done.publishedHint : w.done.draftHint}</p>
        {result.logo === "uploaded" && <p className="text-sm text-success">{w.done.logoUploaded}</p>}
        {typeof result.logo === "object" && (
          <p role="alert" className="text-sm text-danger">
            {w.done.logoMissing} {result.logo.error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/contacts/${result.contactId}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover md:min-h-0"
          >
            <CONTACT_ICONS.contact aria-hidden="true" className="h-4 w-4" />
            {w.done.openCard}
          </Link>
          <Link href="/management/shelter-friends" className={buttonClass}>
            <ACTION_ICONS.back aria-hidden="true" className="h-4 w-4" />
            {w.done.viewList}
          </Link>
          <button type="button" onClick={startOver} className={buttonClass}>
            <ACTION_ICONS.add aria-hidden="true" className="h-4 w-4" />
            {w.done.addAnother}
          </button>
        </div>
      </section>
    );
  }

  const stepTitles = FRIEND_STEPS.map((id) => w.steps[id]);
  const stepClass = (i: number) => (step === i ? "flex flex-col gap-4" : undefined);
  const field = (id: string, label: string, children: ReactNode, hint?: string) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <WizardProgress
        current={step}
        maxVisited={maxVisited}
        titles={stepTitles}
        pending={pending}
        onGo={go}
        labels={w}
      />

      {/* Step 1 — Who */}
      <div hidden={step !== 0} className={stepClass(0)}>
        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only">{w.steps.who}</legend>
          <div className="flex flex-wrap gap-2" role="group">
            {(["existing", "new"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={draft.mode === mode}
                onClick={() => draft.mode !== mode && changeWho({ mode })}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  draft.mode === mode
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:bg-surface-hover"
                }`}
              >
                {mode === "existing" ? w.who.existing : w.who.brandNew}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">{w.who.onlySuppliers}</p>

          {draft.mode === "existing" ? (
            contacts.length === 0 ? (
              <p className="rounded border border-dashed border-border px-4 py-4 text-sm text-muted">
                {w.who.noneAvailable}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {field(
                  "friend-search",
                  w.who.searchLabel,
                  <input
                    id="friend-search"
                    type="search"
                    value={draft.query}
                    onChange={(e) => set("query", e.target.value)}
                    placeholder={w.who.searchPlaceholder}
                    className={inputClass}
                  />,
                )}
                <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded border border-border bg-background p-1">
                  {matches.length === 0 && (
                    <li className="px-3 py-2 text-sm text-muted">{w.who.noMatches}</li>
                  )}
                  {matches.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        aria-pressed={draft.contactId === c.id}
                        onClick={() => draft.contactId !== c.id && changeWho({ contactId: c.id })}
                        className={`flex w-full flex-col rounded px-3 py-2 text-left text-sm ${
                          draft.contactId === c.id
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-surface-hover"
                        }`}
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.phone && <span className="text-xs text-muted">{c.phone}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
                {chosen && <p className="text-sm font-medium text-foreground">{w.who.selected(chosen.name)}</p>}
              </div>
            )
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted">{w.who.newIntro}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {field(
                  "friend-new-name",
                  form.name,
                  <input
                    id="friend-new-name"
                    value={draft.newName}
                    onChange={(e) => set("newName", e.target.value)}
                    placeholder={form.namePlaceholder}
                    aria-invalid={whoProblem ? true : undefined}
                    className={inputClass}
                  />,
                )}
                {field(
                  "friend-new-type",
                  form.type,
                  <select
                    id="friend-new-type"
                    value={draft.newType}
                    onChange={(e) => set("newType", e.target.value)}
                    className={inputClass}
                  >
                    {FRIEND_CONTACT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {contactTypeLabel(t, type)}
                      </option>
                    ))}
                  </select>,
                )}
                {field(
                  "friend-new-phone",
                  form.phone,
                  <input
                    id="friend-new-phone"
                    type="tel"
                    value={draft.newPhone}
                    onChange={(e) => set("newPhone", e.target.value)}
                    placeholder={form.phonePlaceholder}
                    className={inputClass}
                  />,
                )}
                {field(
                  "friend-new-line",
                  form.lineId,
                  <input
                    id="friend-new-line"
                    value={draft.newLine}
                    onChange={(e) => set("newLine", e.target.value)}
                    placeholder={form.lineIdPlaceholder}
                    className={inputClass}
                  />,
                )}
                {field(
                  "friend-new-email",
                  form.email,
                  <input
                    id="friend-new-email"
                    type="email"
                    value={draft.newEmail}
                    onChange={(e) => set("newEmail", e.target.value)}
                    placeholder={form.emailPlaceholder}
                    className={inputClass}
                  />,
                )}
                {field(
                  "friend-new-address",
                  form.address,
                  <input
                    id="friend-new-address"
                    value={draft.newAddress}
                    onChange={(e) => set("newAddress", e.target.value)}
                    placeholder={form.addressPlaceholder}
                    className={inputClass}
                  />,
                  form.addressHint,
                )}
              </div>
            </div>
          )}
          {whoProblem && (
            <p role="alert" className="text-sm text-danger">
              {whoProblem}
            </p>
          )}
        </fieldset>
      </div>

      {/* Step 2 — How they help */}
      <div hidden={step !== 1} className={stepClass(1)}>
        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only">{w.steps.help}</legend>
          <p className="text-sm text-muted">{w.help.intro}</p>
          {field(
            "friend-help-kind",
            card.helpKind,
            <input
              id="friend-help-kind"
              value={draft.helpKind}
              onChange={(e) => set("helpKind", e.target.value)}
              placeholder={card.helpKindPlaceholder}
              className={inputClass}
            />,
          )}
          {field(
            "friend-blurb",
            card.blurb,
            <textarea
              id="friend-blurb"
              value={draft.blurb}
              onChange={(e) => set("blurb", e.target.value)}
              rows={4}
              className={inputClass}
            />,
            card.blurbHint,
          )}
          {field(
            "friend-discount",
            card.discountNote,
            <input
              id="friend-discount"
              value={draft.discountNote}
              onChange={(e) => set("discountNote", e.target.value)}
              placeholder={card.discountNotePlaceholder}
              className={inputClass}
            />,
          )}
          <p className="text-xs text-muted">{w.help.thaiNote}</p>
        </fieldset>
      </div>

      {/* Step 3 — Logo and links */}
      <div hidden={step !== 2} className={stepClass(2)}>
        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only">{w.steps.links}</legend>
          <p className="text-sm text-muted">{w.links.intro}</p>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted">{card.logo}</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
                {logoUrl ? (
                  // A local preview of the file about to be uploaded; next/image cannot take a blob URL.
                  <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <span className="text-xs text-muted">{card.noLogo}</span>
                )}
              </div>
              <button type="button" onClick={() => logoInput.current?.click()} className={buttonClass}>
                <ACTION_ICONS.uploadImage aria-hidden="true" className="h-4 w-4" />
                {logo ? w.links.replaceLogo : w.links.chooseLogo}
              </button>
              {logo && (
                <button
                  type="button"
                  onClick={() => {
                    setLogo(null);
                    setLogoError(null);
                  }}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded border border-danger/40 px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10 md:min-h-0"
                >
                  <ACTION_ICONS.removeImage aria-hidden="true" className="h-4 w-4" />
                  {w.links.removeLogo}
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
                  chooseLogo(file);
                }}
              />
            </div>
            <p className="text-xs text-muted">{w.links.logoHint}</p>
            {/* Beside the logo, not below the buttons: the message is about the logo. */}
            {logoError && (
              <p role="alert" className="text-sm text-danger">
                {logoError}
              </p>
            )}
            {!logo && lostLogoName && (
              <p role="status" className="text-sm text-muted">
                {w.links.logoLostOnRefresh(lostLogoName)}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field(
              "friend-website",
              card.website,
              <input
                id="friend-website"
                type="url"
                inputMode="url"
                value={draft.websiteUrl}
                onChange={(e) => set("websiteUrl", e.target.value)}
                placeholder={card.websitePlaceholder}
                aria-invalid={websiteError ? true : undefined}
                className={inputClass}
              />,
            )}
            {field(
              "friend-facebook",
              card.facebook,
              <input
                id="friend-facebook"
                type="url"
                inputMode="url"
                value={draft.facebookUrl}
                onChange={(e) => set("facebookUrl", e.target.value)}
                placeholder={card.facebookPlaceholder}
                aria-invalid={facebookError ? true : undefined}
                className={inputClass}
              />,
            )}
          </div>
          {websiteError && <p className="text-xs text-danger">{websiteError}</p>}
          {facebookError && <p className="text-xs text-danger">{facebookError}</p>}
        </fieldset>
      </div>

      {/* Step 4 — What the public may see. Every box off; the words are the point. */}
      <div hidden={step !== 3} className={stepClass(3)}>
        <fieldset className="flex flex-col gap-3 rounded border border-border p-4">
          <legend className="px-1 text-sm font-medium text-foreground">{card.optInsHeading}</legend>
          <p className="text-sm text-muted">{w.visibility.intro}</p>
          <p className="rounded border border-dashed border-primary/40 bg-background px-3 py-2 text-sm font-medium text-foreground">
            {w.visibility.askFirst}
          </p>
          {FRIEND_OPT_INS.map((key) => (
            <label key={key} className="flex items-start gap-3 py-1 text-sm">
              <input
                type="checkbox"
                checked={draft.optIns[key]}
                onChange={(e) => set("optIns", { ...draft.optIns, [key]: e.target.checked })}
                className="mt-0.5 h-5 w-5"
              />
              <span className="flex min-w-0 flex-col">
                <span className="font-medium text-foreground">{card.optIns[key]}</span>
                <span className="truncate text-xs text-muted">
                  {optInValue[key]?.trim() || card.notRecorded}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      {/* Step 5 — Review */}
      <div hidden={step !== FRIEND_REVIEW_STEP} className={step === FRIEND_REVIEW_STEP ? "flex flex-col gap-6" : undefined}>
        {step === FRIEND_REVIEW_STEP && (
          <>
            <ReviewSummary groups={review} onEdit={go} labels={w} />
            {preview && (
              <section className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4">
                <span className="text-sm font-semibold text-foreground">{w.review.previewHeading}</span>
                <span className="text-xs text-muted">{w.review.previewLogoNote}</span>
                <div className="max-w-md">
                  <FriendCard
                    friend={preview}
                    t={t}
                    locale={locale}
                    mapSrc={preview.map_location ? previewMapSrc(preview.map_location) : null}
                  />
                </div>
              </section>
            )}
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-foreground">{w.review.choiceHeading}</h3>
              <p className="text-sm text-muted">{w.review.choiceHint}</p>
            </section>
          </>
        )}
      </div>

      {saveError && (
        <p role="alert" className="text-sm text-danger">
          {saveError}
        </p>
      )}

      <WizardNav
        current={step}
        pending={pending}
        onBack={() => go(step - 1)}
        onNext={() => go(step + 1)}
        reviewStep={FRIEND_REVIEW_STEP}
        labels={w}
        finalActions={
          <>
            <button
              type="button"
              onClick={() => save(false)}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded border border-border px-3 py-3 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50 sm:flex-none sm:px-6 sm:text-base"
            >
              {pending && <PendingPuppy />}
              {pending ? w.review.saving : w.review.saveDraft}
            </button>
            <button
              type="button"
              onClick={() => save(true)}
              disabled={pending}
              className="flex-1 rounded bg-primary px-3 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 sm:flex-none sm:px-8 sm:text-base"
            >
              {w.review.publishNow}
            </button>
          </>
        }
      />
    </div>
  );
}
