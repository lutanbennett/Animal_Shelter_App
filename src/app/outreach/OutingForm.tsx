"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import {
  FileDropZone,
  PendingFileList,
  UploadProgressPanel,
  useDeferredUploads,
  type PendingFile,
} from "@/components/DeferredUploads";
import { WizardNav, WizardProgress } from "@/app/residents/new/WizardChrome";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { todayIso } from "@/lib/format";
import { HELP_KINDS, PLACE_KINDS, type CommunityPlace, type HelpKind, type Outing } from "@/lib/outreach/outings";
import { createOuting, updateOuting } from "./actions";

/** Recording walks one thing per screen: where, what, how many (the last one saves). */
const STEP_IDS = ["where", "what", "count"] as const;
const LAST_STEP = STEP_IDS.length - 1;

const inputClass =
  "min-h-11 rounded border border-border bg-surface px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:opacity-50";

/**
 * The outreach visit note (0169), typed standing at a temple in about 30
 * seconds: so on a phone it is three short steps with 44 px targets, and
 * photos are picked on the last step and uploaded after the save, as the
 * maintenance form does. Editing an existing note is one form, without the
 * photo picker; its photos are on the edit page beneath it.
 */
export function OutingForm({
  mode,
  places,
  initial,
}: {
  mode: "create" | "edit";
  places: CommunityPlace[];
  initial?: Outing;
}) {
  const { t } = useI18n();
  const o = t.outreach;
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [placeId, setPlaceId] = useState(initial?.place_id ?? (places.length === 0 ? "new" : ""));
  const [ticks, setTicks] = useState<Record<HelpKind, boolean>>(
    () => Object.fromEntries(HELP_KINDS.map((k) => [k, initial?.[k] ?? false])) as Record<HelpKind, boolean>,
  );

  const uploads = useDeferredUploads();
  const wizard = mode === "create";
  const [step, setStep] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const stepTitles = STEP_IDS.map((id) => o.steps[id]);
  const hiddenUnlessStep = (i: number) => wizard && step !== i;

  function problemOn(i: number): string | null {
    const data = new FormData(formRef.current ?? undefined);
    if (i === 0) {
      if (!String(data.get("outingOn") ?? "")) return o.errors.date;
      if (!placeId) return o.errors.place;
      if (placeId === "new") {
        if (!String(data.get("newPlaceName") ?? "").trim()) return o.errors.place;
        if (!data.get("newPlaceKind")) return o.errors.placeKind;
      }
    }
    if (i === 1 && !HELP_KINDS.some((k) => ticks[k])) return o.errors.someHelp;
    return null;
  }

  function goTo(target: number) {
    if (target > step) {
      for (let i = step; i < target; i += 1) {
        const problem = problemOn(i);
        if (problem) {
          setStepError(problem);
          setStep(i);
          return;
        }
      }
    }
    setStepError(null);
    setStep(target);
    setMaxVisited((v) => Math.max(v, target));
    window.scrollTo({ top: 0 });
  }

  // Enter in a text box would otherwise save a half-filled note.
  function blockEnterSubmit(event: KeyboardEvent<HTMLFormElement>) {
    if (wizard && event.key === "Enter" && (event.target as HTMLElement).tagName === "INPUT") {
      event.preventDefault();
    }
  }

  async function uploadPending(outingId: string, items?: PendingFile[]) {
    const { failed } = await uploads.upload(`/api/outreach/${outingId}/photos`, items);
    if (!failed) router.push("/outreach");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = mode === "create" ? await createOuting(formData) : await updateOuting(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedId(result.outingId);
      if (uploads.queued.length === 0) {
        router.push("/outreach");
        return;
      }
      await uploadPending(result.outingId);
    });
  }

  if (savedId && uploads.files.length > 0) {
    return (
      <UploadProgressPanel
        saved={o.saved}
        uploads={uploads}
        onRetry={(item) => void uploadPending(savedId, [item])}
        continueHref="/outreach"
        continueLabel={o.backToList}
        labels={{ uploading: o.uploading, uploadsFailed: o.uploadsFailed }}
      />
    );
  }

  const saveButton = (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        // Checked here rather than by the browser: a required field on a
        // hidden step would make it refuse silently.
        for (let i = 0; i < LAST_STEP; i += 1) {
          const problem = problemOn(i);
          if (problem) {
            setStepError(problem);
            setStep(i);
            return;
          }
        }
        formRef.current?.requestSubmit();
      }}
      className="flex-1 rounded bg-primary px-4 py-3 text-base font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 sm:flex-none sm:px-10"
    >
      {pending ? o.saving : o.save}
    </button>
  );

  return (
    <form ref={formRef} onSubmit={handleSubmit} onKeyDown={blockEnterSubmit} className="flex max-w-xl flex-col gap-6">
      {wizard && (
        <WizardProgress current={step} maxVisited={maxVisited} titles={stepTitles} pending={pending} onGo={goTo} />
      )}
      {initial && <input type="hidden" name="outingId" value={initial.id} />}

      {/* 1. Date and place */}
      <div hidden={hiddenUnlessStep(0)} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {o.fields.date}
          <input
            name="outingOn"
            type="date"
            max={todayIso()}
            defaultValue={initial?.outing_on ?? todayIso()}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {o.fields.place}
          <select
            name="placeId"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              {o.hints.place}
            </option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {o.kinds[p.kind]}
              </option>
            ))}
            <option value="new">{o.newPlace}</option>
          </select>
        </label>

        {placeId === "new" && (
          <div className="flex flex-col gap-4 rounded border border-border p-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-muted">
              {o.newPlaceName}
              <input name="newPlaceName" maxLength={120} autoComplete="off" className={inputClass} />
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium text-muted">{o.newPlaceKind}</legend>
              <div className="grid grid-cols-2 gap-2">
                {PLACE_KINDS.map((k) => (
                  <label
                    key={k}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded border border-border px-3 text-base text-foreground has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                  >
                    <input type="radio" name="newPlaceKind" value={k} className="size-5" />
                    {o.kinds[k]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}
      </div>

      {/* 2. What we did */}
      <fieldset hidden={hiddenUnlessStep(1)} className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-muted">{o.fields.whatWeDid}</legend>
        <p className="text-xs text-muted">{o.hints.whatWeDid}</p>
        {HELP_KINDS.map((k) => (
          <label
            key={k}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded border border-border px-3 text-base text-foreground has-[:checked]:border-primary has-[:checked]:bg-primary/10"
          >
            <input
              type="checkbox"
              name={k}
              checked={ticks[k]}
              onChange={(e) => setTicks((prev) => ({ ...prev, [k]: e.target.checked }))}
              className="size-5"
            />
            {o.help[k]}
          </label>
        ))}
      </fieldset>

      {/* 3. How many, and the rest */}
      <div hidden={hiddenUnlessStep(2)} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {o.fields.dogCount}
          <input
            name="dogCount"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            defaultValue={initial?.dog_count ?? ""}
            className={`${inputClass} w-32`}
          />
          <span className="text-xs font-normal">{o.hints.dogCount}</span>
        </label>

        {ticks.sterilised && (
          <label className="flex flex-col gap-1 text-sm font-medium text-muted">
            {o.fields.sterilisedCount}
            <input
              name="sterilisedCount"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              defaultValue={initial?.sterilised_count ?? ""}
              className={`${inputClass} w-32`}
            />
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {o.fields.note}
          <textarea name="note" rows={3} maxLength={2000} defaultValue={initial?.note ?? ""} className={inputClass} />
        </label>

        {wizard && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted">{o.fields.photos}</span>
            <p className="text-xs text-muted">{o.hints.photos}</p>
            <FileDropZone label={o.dropHere} hint={o.dropHint} onFiles={uploads.addFiles} />
            <PendingFileList files={uploads.files} onRemove={uploads.removeFile} onRetry={null} />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {wizard ? (
        <>
          {stepError && <p className="text-sm text-danger">{stepError}</p>}
          <WizardNav
            current={step}
            pending={pending}
            onBack={() => goTo(step - 1)}
            onNext={() => goTo(step + 1)}
            reviewStep={LAST_STEP}
            finalActions={saveButton}
          />
          <Link href="/outreach" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground">
            {t.common.cancel}
          </Link>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save} disabled={pending}>
            {pending ? o.saving : o.save}
          </ActionButton>
          <Link href="/outreach" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground">
            {t.common.cancel}
          </Link>
        </div>
      )}
    </form>
  );
}
