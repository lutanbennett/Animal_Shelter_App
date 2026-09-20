"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { updateResident } from "./actions";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { PhotoRow } from "@/components/PhotoGallery";

export type EditableResident = {
  id: string;
  name: string;
  animal_code: string;
  thai_name: string | null;
  other_names: string | null;
  species: string | null;
  breed: string | null;
  sex: string | null;
  estimated_age_years: number | null;
  age_estimated_on: string | null;
  bio: string | null;
  temperament_notes: string | null;
  past_story_notes: string | null;
  behaviour_notes: string | null;
  profile_photo_drive_file_id: string | null;
  ready_for_adoption: boolean;
  is_public_visible: boolean;
};

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";
// `rows` is the minimum; field-sizing-content lets the box grow with the text.
const textareaClass = `${inputClass} field-sizing-content`;

export function EditResidentForm({
  resident,
  photos,
  ageNow,
}: {
  resident: EditableResident;
  photos: PhotoRow[];
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

  // Field labels are shared with the intake form so the two stay worded alike.
  const f = t.residents.new.fields;

  return (
    <form action={formAction} className="flex max-w-4xl flex-col gap-8">
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
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-base font-semibold text-foreground">
          {t.residents.edit.sections.flags}
        </legend>
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
  );
}
