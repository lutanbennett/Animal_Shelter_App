"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { updateResident } from "./actions";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { RESIDENT_SIZES, sizeLabel } from "@/lib/i18n/enum-labels";
import { BLOOD_TEST_INTERVALS } from "@/lib/residents/blood-test-interval";
import type { PhotoRow } from "@/components/PhotoGallery";
import type { EnclosureOption, ZoneOption } from "@/lib/enclosures/options";
import {
  EnclosurePicker,
  capacityWarningLevel,
} from "@/components/EnclosurePicker";
import { CapacityWarningDialog } from "@/components/CapacityWarningDialog";
import {
  AdoptionProfileFields,
  type AdoptionProfile,
} from "@/components/AdoptionProfileFields";
import { todayIso } from "@/lib/format";

export type HousingState = {
  /** Current enclosure (physical or Lifecycle pseudo-enclosure), if any. */
  enclosureId: string | null;
  enclosureName: string | null;
  zoneName: string | null;
  isDeceased: boolean;
  /** In the Hospital pseudo-enclosure — moves are recorded as a return instead. */
  isHospitalised: boolean;
  /** Fostered or adopted — the way back into an enclosure is a return to shelter. */
  isWithCarer: boolean;
};

export type EditableResident = {
  id: string;
  name: string;
  resident_code: string;
  thai_name: string | null;
  other_names: string | null;
  species: string | null;
  breed: string | null;
  sex: string | null;
  size: string | null;
  estimated_age_years: number | null;
  age_estimated_on: string | null;
  blood_test_interval_months: number;
  bio: string | null;
  temperament_notes: string | null;
  past_story_notes: string | null;
  behaviour_notes: string | null;
  profile_photo_drive_file_id: string | null;
  ready_for_adoption: boolean;
  is_public_visible: boolean;
} & AdoptionProfile;

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";
// `rows` is the minimum; field-sizing-content lets the box grow with the text.
const textareaClass = `${inputClass} field-sizing-content`;

export function EditResidentForm({
  resident,
  photos,
  housing,
  zones,
  enclosures,
  ageNow,
}: {
  resident: EditableResident;
  photos: PhotoRow[];
  housing: HousingState;
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  /** Current computed age (server-side, so it matches what the hub shows). */
  ageNow: number | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateResident.bind(null, resident.id),
    undefined,
  );
  const { t } = useI18n();
  const [profilePhotoId, setProfilePhotoId] = useState(
    resident.profile_photo_drive_file_id ?? "",
  );

  // Pre-select the current enclosure so saving without touching this
  // section records no move. A Lifecycle pseudo-enclosure isn't in the
  // picker, so it starts blank — blank means "leave housing alone".
  const currentPhysicalId = enclosures.some((e) => e.id === housing.enclosureId)
    ? housing.enclosureId!
    : "";
  const [enclosureId, setEnclosureId] = useState(currentPhysicalId);
  const [warningFor, setWarningFor] = useState<EnclosureOption | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Set once the capacity warning has been accepted so the re-submit goes through.
  const confirmedRef = useRef(false);

  const moveTarget =
    enclosureId && enclosureId !== housing.enclosureId
      ? (enclosures.find((e) => e.id === enclosureId) ?? null)
      : null;
  const currentLocation = [housing.enclosureName, housing.zoneName]
    .filter(Boolean)
    .join(" · ");

  // Field labels are shared with the intake form so the two stay worded alike.
  const f = t.residents.new.fields;
  const h = t.residents.edit.housing;

  return (
    <>
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(e) => {
        if (confirmedRef.current) {
          confirmedRef.current = false;
          return;
        }
        if (moveTarget && capacityWarningLevel(moveTarget)) {
          e.preventDefault();
          setWarningFor(moveTarget);
        }
      }}
      className="flex max-w-4xl flex-col gap-8"
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="text-base font-semibold text-foreground">
          {t.residents.edit.sections.photo}
        </legend>
        <input type="hidden" name="profilePhotoDriveFileId" value={profilePhotoId} />
        {photos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
            {t.residents.edit.photo.noPhotos}{" "}
            <Link
              href={`/residents/${resident.id}/photos`}
              className="font-medium text-primary hover:underline"
            >
              {t.residents.edit.photo.uploadLink}
            </Link>
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">{t.residents.edit.photo.hint}</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {photos.map((photo) => {
                const isSelected = photo.drive_file_id === profilePhotoId;
                const label = photo.file_name ?? t.photos.photoFallback;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setProfilePhotoId(photo.drive_file_id)}
                    aria-pressed={isSelected}
                    aria-label={t.residents.edit.photo.selectAriaLabel(label)}
                    className={`group relative aspect-square overflow-hidden rounded-lg border bg-surface-hover ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/50"
                        : "border-border hover:border-primary/60"
                    }`}
                  >
                    <img
                      src={driveImageUrl(photo.drive_file_id)}
                      alt={label}
                      className="h-full w-full object-cover transition group-hover:brightness-90"
                    />
                    {isSelected && (
                      <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                        <Check aria-hidden="true" className="h-3 w-3" />
                        {t.residents.edit.photo.selected}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </fieldset>

      {/* Identity, housing and adoption are closed after death (0026,
          0052); only the photo and bio sections remain. */}
      {!housing.isDeceased && (
        <>
        <fieldset className="flex flex-col gap-4">
          <legend className="text-base font-semibold text-foreground">
            {t.residents.edit.sections.identity}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium text-muted">
                {f.name} <span className="text-danger">*</span>
              </label>
              <input
                id="name"
                name="name"
                required
                defaultValue={resident.name}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="thaiName" className="text-sm font-medium text-muted">
                {f.thaiName}
              </label>
              <input
                id="thaiName"
                name="thaiName"
                defaultValue={resident.thai_name ?? ""}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="otherNames" className="text-sm font-medium text-muted">
                {f.otherNames}
              </label>
              <input
                id="otherNames"
                name="otherNames"
                defaultValue={resident.other_names ?? ""}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="species" className="text-sm font-medium text-muted">
                {f.species}
              </label>
              <select
                id="species"
                name="species"
                defaultValue={resident.species ?? ""}
                className={inputClass}
              >
                <option value="">{f.selectSpecies}</option>
                <option value="Dog">{t.enums.species.Dog}</option>
                <option value="Cat">{t.enums.species.Cat}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="breed" className="text-sm font-medium text-muted">
                {f.breed}
              </label>
              <input
                id="breed"
                name="breed"
                defaultValue={resident.breed ?? ""}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sex" className="text-sm font-medium text-muted">
                {f.sex}
              </label>
              <select
                id="sex"
                name="sex"
                defaultValue={resident.sex ?? ""}
                className={inputClass}
              >
                <option value="">{f.sexUnknown}</option>
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
                defaultValue={resident.size ?? ""}
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
            <div className="flex flex-col gap-1">
              <label
                htmlFor="estimatedAgeYears"
                className="text-sm font-medium text-muted"
              >
                {t.residents.edit.fields.estimatedAgeNow}
              </label>
              {/* Pre-filled with the age as it reads today, not the number
                  typed at intake — so "about 5" typed here shows as ~5. */}
              <input
                id="estimatedAgeYears"
                name="estimatedAgeYears"
                type="number"
                min={0}
                step="0.5"
                defaultValue={ageNow ?? ""}
                placeholder={f.estimatedAgeHint}
                className={inputClass}
              />
              <span className="text-xs text-muted">
                {t.residents.edit.fields.estimatedAgeNowHint}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="bloodTestIntervalMonths" className="text-sm font-medium text-muted">
                {t.residents.new.fields.bloodTestInterval}
              </label>
              <select
                id="bloodTestIntervalMonths"
                name="bloodTestIntervalMonths"
                defaultValue={resident.blood_test_interval_months}
                className={inputClass}
              >
                {BLOOD_TEST_INTERVALS.map((months) => (
                  <option key={months} value={months}>
                    {t.residents.new.fields.bloodTestEveryMonths(months)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">{t.residents.new.fields.bloodTestIntervalHint}</p>
            </div>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="text-base font-semibold text-foreground">
            {t.residents.edit.sections.housing}
          </legend>
          <p className="text-sm text-foreground">
            {currentLocation ? h.current(currentLocation) : h.currentUnassigned}
          </p>
          {housing.isDeceased ? (
            <p className="text-sm text-muted">{t.residents.move.errors.deceased}</p>
          ) : housing.isHospitalised ? (
            <p className="text-sm text-muted">
              {t.residents.move.errors.inHospital}{" "}
              <Link
                href={`/residents/${resident.id}/hospital/return`}
                className="font-medium text-primary hover:underline"
              >
                {h.inHospital}
              </Link>
            </p>
          ) : housing.isWithCarer ? (
            <p className="text-sm text-muted">
              {t.residents.move.errors.withCarer}{" "}
              <Link
                href={`/residents/${resident.id}/rehome/return`}
                className="font-medium text-primary hover:underline"
              >
                {h.withCarer}
              </Link>
            </p>
          ) : (
            <>
              <p className="text-sm text-muted">{h.hint}</p>
              <EnclosurePicker
                zones={zones}
                enclosures={enclosures}
                value={enclosureId}
                onChange={(id) => {
                  setEnclosureId(id);
                  confirmedRef.current = false;
                }}
                currentEnclosureId={housing.enclosureId}
                idPrefix="edit"
              />
              {moveTarget ? (
                <div className="flex flex-col gap-4 rounded-lg border border-primary/40 bg-primary/10 p-4">
                  <p className="text-sm font-medium text-primary">
                    {h.movingTo(moveTarget.name)}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="moveDate"
                        className="text-sm font-medium text-muted"
                      >
                        {t.residents.move.fields.moveDate}{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <input
                        id="moveDate"
                        name="moveDate"
                        type="date"
                        required
                        max={todayIso()}
                        defaultValue={todayIso()}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="moveNotes"
                      className="text-sm font-medium text-muted"
                    >
                      {t.common.notes}
                    </label>
                    <textarea
                      id="moveNotes"
                      name="moveNotes"
                      rows={2}
                      placeholder={t.residents.move.fields.notesPlaceholder}
                      className={textareaClass}
                    />
                  </div>
                </div>
              ) : (
                !enclosureId &&
                currentPhysicalId && (
                  <p className="text-xs text-muted">{h.keep}</p>
                )
              )}
            </>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-base font-semibold text-foreground">
            {t.residents.edit.sections.flags}
          </legend>
          <p className="text-sm text-muted">{t.residents.new.adoptionHint}</p>
          <AdoptionProfileFields value={resident} idPrefix="edit-" />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="readyForAdoption"
              defaultChecked={resident.ready_for_adoption}
              className="h-4 w-4 accent-primary"
            />
            {f.readyForAdoption}
          </label>
        </fieldset>
        </>
      )}

      <fieldset className="flex flex-col gap-4">
        <legend className="text-base font-semibold text-foreground">
          {t.residents.edit.sections.bio}
        </legend>
        <div className="flex flex-col gap-1">
          <label htmlFor="bio" className="text-sm font-medium text-muted">
            {f.bio}
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={resident.bio ?? ""}
            className={textareaClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="temperamentNotes"
              className="text-sm font-medium text-muted"
            >
              {f.temperament}
            </label>
            <textarea
              id="temperamentNotes"
              name="temperamentNotes"
              rows={3}
              defaultValue={resident.temperament_notes ?? ""}
              className={textareaClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="pastStoryNotes"
              className="text-sm font-medium text-muted"
            >
              {f.pastStory}
            </label>
            <textarea
              id="pastStoryNotes"
              name="pastStoryNotes"
              rows={3}
              defaultValue={resident.past_story_notes ?? ""}
              className={textareaClass}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label
              htmlFor="behaviourNotes"
              className="text-sm font-medium text-muted"
            >
              {f.behaviourNotes}
            </label>
            <textarea
              id="behaviourNotes"
              name="behaviourNotes"
              rows={3}
              defaultValue={resident.behaviour_notes ?? ""}
              className={textareaClass}
            />
          </div>
        </div>
      </fieldset>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.residents.edit.saving : t.common.saveChanges}
        </button>
        <Link
          href={`/residents/${resident.id}`}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {t.common.cancel}
        </Link>
      </div>
    </form>

    <CapacityWarningDialog
      enclosure={warningFor}
      pending={pending}
      onCancel={() => setWarningFor(null)}
      onConfirm={() => {
        setWarningFor(null);
        confirmedRef.current = true;
        formRef.current?.requestSubmit();
      }}
    />
    </>
  );
}
