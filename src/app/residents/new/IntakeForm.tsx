"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { recordIntake } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import { formatDate } from "@/lib/format";
import { RESIDENT_SIZES, sizeLabel } from "@/lib/i18n/enum-labels";
import { AdoptionProfileFields } from "@/components/AdoptionProfileFields";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
import {
  BLOOD_TEST_INTERVALS,
  DEFAULT_BLOOD_TEST_INTERVAL,
} from "@/lib/residents/blood-test-interval";
import { INTAKE_STEPS, REVIEW_STEP } from "./steps";
import {
  ReviewSummary,
  WizardNav,
  WizardProgress,
  type ReviewGroup,
} from "./WizardChrome";

export type ZoneOption = { id: string; name: string; name_th: string | null };
export type DietTypeOption = { id: string; name: string };
export type EnclosureOption = { id: string; name: string; name_th: string | null; zoneId: string };
export type OriginOption = { id: string; name: string };

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * The first control in a step that fails HTML validation, or null.
 *
 * Inactive steps are hidden rather than unmounted, so their values and
 * `required` attributes survive — which also means a required field left
 * empty two steps back would still block the final submit. Every forward
 * move runs this over the steps it passes.
 */
function firstInvalid(container: HTMLElement | null): FormControl | null {
  if (!container) return null;
  const controls = container.querySelectorAll<FormControl>(
    "input, select, textarea",
  );
  for (const control of controls) {
    if (!control.checkValidity()) return control;
  }
  return null;
}

/**
 * What a control currently reads as, for the Review step: the chosen
 * option's own text for a select, Yes / No for a checkbox, the trimmed
 * value otherwise. null means "nothing entered". Controls are found by id
 * because a couple of them (the zone filter) aren't part of the submission.
 */
function display(
  form: HTMLFormElement,
  id: string,
  t: Dictionary,
): string | null {
  const el = form.querySelector<FormControl>(`#${id}`);
  if (!el) return null;
  if (el instanceof HTMLSelectElement) {
    if (el.value === "") return null;
    return el.selectedOptions[0]?.text.trim() ?? null;
  }
  if (el instanceof HTMLInputElement && el.type === "checkbox") {
    return el.checked ? t.common.yes : t.common.no;
  }
  const value = el.value.trim();
  return value === "" ? null : value;
}

/**
 * Reads every answer back out of the form for the Review step. This is a
 * mirror of what the one submission will send, not a second source of
 * truth — the values stay in the form's own controls throughout.
 */
function buildReview(
  form: HTMLFormElement,
  t: Dictionary,
  locale: Locale,
): ReviewGroup[] {
  const f = t.residents.new.fields;
  const w = t.residents.new.wizard;
  const v = (id: string) => display(form, id, t);
  const intakeDate = v("intakeDate");

  return [
    {
      step: 0,
      title: w.steps.who,
      entries: [
        { label: f.name, value: v("name") },
        { label: f.thaiName, value: v("thaiName") },
        { label: f.otherNames, value: v("otherNames") },
        { label: f.species, value: v("species") },
        { label: f.breed, value: v("breed") },
        // A blank Sex is the "Unknown" option, an answer in its own right.
        {
          label: f.sex,
          value: v("sex") ?? f.sexUnknown,
        },
        { label: f.size, value: v("size") },
      ],
    },
    {
      step: 1,
      title: w.steps.arrival,
      entries: [
        {
          label: f.intakeDate,
          value: intakeDate === null ? null : formatDate(intakeDate, locale),
        },
        // Whichever of the two origin controls is on screen: the picker,
        // or the box that appears when "+ Add new origin…" is chosen.
        { label: f.origin, value: v("originId") ?? v("newOriginName") },
        { label: f.zone, value: v("zoneId") },
        // Blank means the resident is placed as Unassigned, which is a
        // real outcome rather than a gap.
        { label: f.enclosure, value: v("enclosureId") ?? w.enclosureUnassigned },
        { label: f.intakeNotes, value: v("notes") },
        { label: f.readyForAdoptionShort, value: v("readyForAdoption") },
      ],
    },
    {
      step: 2,
      title: w.steps.health,
      entries: [
        { label: f.estimatedAge, value: v("estimatedAgeYears") },
        { label: f.weightKg, value: v("weightKg") },
        { label: f.bloodTestInterval, value: v("bloodTestIntervalMonths") },
        { label: f.startingDiet, value: v("dietTypeId") },
      ],
    },
    {
      step: 3,
      title: w.steps.adoption,
      entries: [
        { label: f.colour, value: v("colour") },
        { label: f.desexed, value: v("isDesexed") },
        { label: f.goodWithDogs, value: v("goodWithDogs") },
        { label: f.goodWithCats, value: v("goodWithCats") },
        { label: f.goodWithChildren, value: v("goodWithChildren") },
        { label: f.energyLevel, value: v("energyLevel") },
      ],
    },
    {
      step: 4,
      title: w.steps.story,
      entries: [
        { label: f.bio, value: v("bio") },
        { label: f.temperament, value: v("temperamentNotes") },
        { label: f.pastStory, value: v("pastStoryNotes") },
        { label: f.behaviourNotes, value: v("behaviourNotes") },
      ],
    },
  ];
}

/**
 * Intake as a wizard: one step per group of questions, a Review step that
 * lists every answer, and a single Register press at the end.
 *
 * The steps are a view over one `<form>` — inactive steps are hidden, not
 * unmounted — so this is still the single `recordIntake` call it always
 * was. Nothing is written until Register, and nothing half-registered can
 * exist.
 */
export function IntakeForm({
  zones,
  enclosures,
  origins,
  dietTypes,
  initialStep = 0,
}: {
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  origins: OriginOption[];
  dietTypes: DietTypeOption[];
  initialStep?: number;
}) {
  const [state, formAction, pending] = useActionState(recordIntake, undefined);
  const { t, locale } = useI18n();
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedEnclosureId, setSelectedEnclosureId] = useState("");
  const [isAddingOrigin, setIsAddingOrigin] = useState(false);

  const [step, setStep] = useState(initialStep);
  const [maxVisited, setMaxVisited] = useState(initialStep);
  const [review, setReview] = useState<ReviewGroup[] | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const w = t.residents.new.wizard;
  const stepTitles = INTAKE_STEPS.map((id) => w.steps[id]);

  const enclosuresInZone = enclosures.filter((e) => e.zoneId === selectedZoneId);

  /**
   * Moves to `target`, refusing to go forward past a step whose required
   * fields aren't filled in — it opens that step instead and lets the
   * browser point at the control, so the message lands on the field rather
   * than in a summary at the top.
   */
  const go = useCallback(
    (target: number) => {
      const form = formRef.current;
      if (!form) return;

      const openStep = (next: number) => {
        setStep(next);
        setMaxVisited((seen) => Math.max(seen, next));
        const { pathname } = window.location;
        window.history.replaceState(
          null,
          "",
          next === 0 ? pathname : `${pathname}?step=${next + 1}`,
        );
        window.scrollTo(0, 0);
      };

      if (target > step) {
        for (let i = step; i < target; i++) {
          const invalid = firstInvalid(stepRefs.current[i]);
          if (invalid) {
            openStep(i);
            // After the commit that un-hides the step: the browser won't
            // show its message on a control it can't display.
            requestAnimationFrame(() => invalid.reportValidity());
            return;
          }
        }
      }

      if (target === REVIEW_STEP) setReview(buildReview(form, t, locale));
      openStep(target);
    },
    [step, t, locale],
  );

  /** The one submission, from the Review step. */
  function register() {
    const form = formRef.current;
    if (!form) return;
    for (let i = 0; i < REVIEW_STEP; i++) {
      const invalid = firstInvalid(stepRefs.current[i]);
      if (invalid) {
        setStep(i);
        requestAnimationFrame(() => invalid.reportValidity());
        return;
      }
    }
    form.requestSubmit();
  }

  // A rejected intake (name taken, enclosure full, the RPC itself) comes
  // back as an error on the action's state, and lands the user on Review
  // with the message rather than back at step 1 — Register is only
  // reachable from Review, and Back is disabled while the action is in
  // flight, so the step they pressed it on is still the step they are on.

  // A refresh that lands straight on ?step=6: the form only exists after
  // mount, so the summary is built here rather than by `go`.
  useEffect(() => {
    const form = formRef.current;
    if (review !== null || initialStep !== REVIEW_STEP || !form) return;
    setReview(buildReview(form, t, locale));
  }, [review, initialStep, t, locale]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex max-w-4xl flex-col gap-6"
    >
      <WizardProgress
        current={step}
        maxVisited={maxVisited}
        titles={stepTitles}
        pending={pending}
        onGo={go}
      />

      {/* Step 1 — Who */}
      <div
        ref={(el) => {
          stepRefs.current[0] = el;
        }}
        hidden={step !== 0}
        className={step === 0 ? "flex flex-col gap-4" : undefined}
      >
        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only">{w.steps.who}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium text-muted">
                {t.residents.new.fields.name} <span className="text-danger">*</span>
              </label>
              <input id="name" name="name" required className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="thaiName" className="text-sm font-medium text-muted">
                {t.residents.new.fields.thaiName}
              </label>
              <input id="thaiName" name="thaiName" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="otherNames" className="text-sm font-medium text-muted">
                {t.residents.new.fields.otherNames}
              </label>
              <input id="otherNames" name="otherNames" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="species" className="text-sm font-medium text-muted">
                {t.residents.new.fields.species}
              </label>
              <select
                id="species"
                name="species"
                defaultValue=""
                className={inputClass}
              >
                <option value="">{t.residents.new.fields.selectSpecies}</option>
                <option value="Dog">{t.enums.species.Dog}</option>
                <option value="Cat">{t.enums.species.Cat}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="breed" className="text-sm font-medium text-muted">
                {t.residents.new.fields.breed}
              </label>
              <input id="breed" name="breed" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sex" className="text-sm font-medium text-muted">
                {t.residents.new.fields.sex}
              </label>
              <select id="sex" name="sex" defaultValue="" className={inputClass}>
                <option value="">{t.residents.new.fields.sexUnknown}</option>
                <option value="Male">{t.enums.sex.Male}</option>
                <option value="Female">{t.enums.sex.Female}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="size" className="text-sm font-medium text-muted">
                {t.residents.new.fields.size} <span className="text-danger">*</span>
              </label>
              <select
                id="size"
                name="size"
                required
                defaultValue=""
                className={inputClass}
              >
                <option value="">{t.residents.new.fields.selectSize}</option>
                {RESIDENT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {sizeLabel(t, size)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">{t.residents.new.fields.sizeHint}</p>
            </div>
          </div>
        </fieldset>
      </div>

      {/* Step 2 — Arrival */}
      <div
        ref={(el) => {
          stepRefs.current[1] = el;
        }}
        hidden={step !== 1}
        className={step === 1 ? "flex flex-col gap-4" : undefined}
      >
        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only">{w.steps.arrival}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="intakeDate" className="text-sm font-medium text-muted">
                {t.residents.new.fields.intakeDate}{" "}
                <span className="text-danger">*</span>
              </label>
              <input
                id="intakeDate"
                name="intakeDate"
                type="date"
                required
                max={todayIso()}
                defaultValue={todayIso()}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="originId" className="text-sm font-medium text-muted">
                {t.residents.new.fields.origin}
              </label>
              {isAddingOrigin ? (
                <div className="flex gap-2">
                  <input
                    id="newOriginName"
                    name="newOriginName"
                    autoFocus
                    placeholder={t.residents.new.fields.newOriginPlaceholder}
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingOrigin(false)}
                    title={t.residents.new.fields.chooseExistingOrigin}
                    className="rounded border border-border px-3 text-sm text-muted hover:bg-surface-hover"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <select
                  id="originId"
                  name="originId"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value === "__new__") setIsAddingOrigin(true);
                  }}
                  className={inputClass}
                >
                  <option value="">
                    {t.residents.new.fields.noOriginSelected}
                  </option>
                  {origins.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                  <option value="__new__">
                    {t.residents.new.fields.addNewOrigin}
                  </option>
                </select>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="zoneId" className="text-sm font-medium text-muted">
                {t.residents.new.fields.zone}
              </label>
              <select
                id="zoneId"
                value={selectedZoneId}
                onChange={(e) => {
                  setSelectedZoneId(e.target.value);
                  setSelectedEnclosureId("");
                }}
                className={inputClass}
              >
                <option value="">{t.residents.new.fields.noZoneDefault}</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {placeName(locale, z.name, z.name_th)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="enclosureId" className="text-sm font-medium text-muted">
                {t.residents.new.fields.enclosure}
              </label>
              <select
                id="enclosureId"
                name="enclosureId"
                value={selectedEnclosureId}
                onChange={(e) => setSelectedEnclosureId(e.target.value)}
                className={inputClass}
              >
                <option value="">
                  {t.residents.new.fields.unassignedDefault}
                </option>
                {enclosuresInZone.map((e) => (
                  <option key={e.id} value={e.id}>
                    {placeName(locale, e.name, e.name_th)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="notes" className="text-sm font-medium text-muted">
              {t.residents.new.fields.intakeNotes}
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder={t.residents.new.fields.intakeNotesPlaceholder}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              id="readyForAdoption"
              type="checkbox"
              name="readyForAdoption"
              className="h-4 w-4 accent-primary"
            />
            {t.residents.new.fields.readyForAdoption}
          </label>
        </fieldset>
      </div>

      {/* Step 3 — Health */}
      <div
        ref={(el) => {
          stepRefs.current[2] = el;
        }}
        hidden={step !== 2}
        className={step === 2 ? "flex flex-col gap-4" : undefined}
      >
        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only">{w.steps.health}</legend>
          <p className="text-sm text-muted">{w.healthHint}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="estimatedAgeYears"
                className="text-sm font-medium text-muted"
              >
                {t.residents.new.fields.estimatedAge}
              </label>
              <input
                id="estimatedAgeYears"
                name="estimatedAgeYears"
                type="number"
                min={0}
                step="0.5"
                placeholder={t.residents.new.fields.estimatedAgeHint}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="weightKg" className="text-sm font-medium text-muted">
                {t.residents.new.fields.weightKg}
              </label>
              <input
                id="weightKg"
                name="weightKg"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                placeholder={t.residents.new.fields.weightKgHint}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="bloodTestIntervalMonths"
                className="text-sm font-medium text-muted"
              >
                {t.residents.new.fields.bloodTestInterval}
              </label>
              <select
                id="bloodTestIntervalMonths"
                name="bloodTestIntervalMonths"
                defaultValue={DEFAULT_BLOOD_TEST_INTERVAL}
                className={inputClass}
              >
                {BLOOD_TEST_INTERVALS.map((months) => (
                  <option key={months} value={months}>
                    {t.residents.new.fields.bloodTestEveryMonths(months)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">
                {t.residents.new.fields.bloodTestIntervalHint}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="dietTypeId" className="text-sm font-medium text-muted">
                {t.residents.new.fields.startingDiet}
              </label>
              <select
                id="dietTypeId"
                name="dietTypeId"
                defaultValue=""
                className={inputClass}
              >
                <option value="">{t.residents.new.fields.noStartingDiet}</option>
                {dietTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">
                {t.residents.new.fields.startingDietHint}
              </p>
            </div>
          </div>
        </fieldset>
      </div>

      {/* Step 4 — For adopters */}
      <div
        ref={(el) => {
          stepRefs.current[3] = el;
        }}
        hidden={step !== 3}
        className={step === 3 ? "flex flex-col gap-4" : undefined}
      >
        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only">{w.steps.adoption}</legend>
          <p className="text-sm text-muted">{t.residents.new.adoptionHint}</p>
          <AdoptionProfileFields />
        </fieldset>
      </div>

      {/* Step 5 — Story */}
      <div
        ref={(el) => {
          stepRefs.current[4] = el;
        }}
        hidden={step !== 4}
        className={step === 4 ? "flex flex-col gap-4" : undefined}
      >
        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only">{w.steps.story}</legend>
          <p className="text-sm text-muted">{w.storyHint}</p>
          <div className="flex flex-col gap-1">
            <label htmlFor="bio" className="text-sm font-medium text-muted">
              {t.residents.new.fields.bio}
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              className={`${inputClass} field-sizing-content`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="temperamentNotes"
                className="text-sm font-medium text-muted"
              >
                {t.residents.new.fields.temperament}
              </label>
              <textarea
                id="temperamentNotes"
                name="temperamentNotes"
                rows={3}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="pastStoryNotes"
                className="text-sm font-medium text-muted"
              >
                {t.residents.new.fields.pastStory}
              </label>
              <textarea
                id="pastStoryNotes"
                name="pastStoryNotes"
                rows={3}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label
                htmlFor="behaviourNotes"
                className="text-sm font-medium text-muted"
              >
                {t.residents.new.fields.behaviourNotes}
              </label>
              <textarea
                id="behaviourNotes"
                name="behaviourNotes"
                rows={3}
                className={inputClass}
              />
            </div>
          </div>
        </fieldset>
      </div>

      {/* Step 6 — Review */}
      <div hidden={step !== REVIEW_STEP}>
        {step === REVIEW_STEP && review !== null && (
          <ReviewSummary groups={review} onEdit={go} />
        )}
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <WizardNav
        current={step}
        pending={pending}
        onBack={() => go(step - 1)}
        onNext={() => go(step + 1)}
        onRegister={register}
      />
    </form>
  );
}
