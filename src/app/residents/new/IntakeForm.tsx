"use client";

import { useActionState, useState } from "react";
import { recordIntake } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type ZoneOption = { id: string; name: string };
export type EnclosureOption = { id: string; name: string; zoneId: string };
export type OriginOption = { id: string; name: string };

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function IntakeForm({
  zones,
  enclosures,
  origins,
}: {
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  origins: OriginOption[];
}) {
  const [state, formAction, pending] = useActionState(recordIntake, undefined);
  const { t } = useI18n();
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedEnclosureId, setSelectedEnclosureId] = useState("");
  const [isAddingOrigin, setIsAddingOrigin] = useState(false);

  const enclosuresInZone = enclosures.filter(
    (e) => e.zoneId === selectedZoneId,
  );

  return (
    <form action={formAction} className="flex max-w-4xl flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="text-base font-semibold text-foreground">
          {t.residents.new.sections.identity}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-muted">
              {t.residents.new.fields.name} <span className="text-danger">*</span>
            </label>
            <input id="name" name="name" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="thaiName"
              className="text-sm font-medium text-muted"
            >
              {t.residents.new.fields.thaiName}
            </label>
            <input id="thaiName" name="thaiName" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="otherNames"
              className="text-sm font-medium text-muted"
            >
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
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-base font-semibold text-foreground">
          {t.residents.new.sections.arrival}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="intakeDate"
              className="text-sm font-medium text-muted"
            >
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
                  {z.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="enclosureId"
              className="text-sm font-medium text-muted"
            >
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
                  {e.name}
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
            type="checkbox"
            name="readyForAdoption"
            className="h-4 w-4 accent-primary"
          />
          {t.residents.new.fields.readyForAdoption}
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-base font-semibold text-foreground">
          {t.residents.new.sections.bio}
        </legend>
        <div className="flex flex-col gap-1">
          <label htmlFor="bio" className="text-sm font-medium text-muted">
            {t.residents.new.fields.bio}
          </label>
          <textarea id="bio" name="bio" rows={2} className={inputClass} />
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

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.residents.new.registering : t.residents.new.registerButton}
        </button>
      </div>
    </form>
  );
}
