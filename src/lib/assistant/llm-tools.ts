/**
 * Tool definitions for the model, derived from the `Draft` types.
 *
 * One tool per intent; a tool call IS a Draft (plus `kind`, which is the tool
 * name). The field table for each kind is typed `Record<keyof Draft minus
 * kind, FieldSpec>`, so adding, renaming or dropping a Draft field without
 * touching this table fails `npm run typecheck`. They cannot drift quietly.
 *
 * Every field is nullable and required: null means "the sentence did not
 * say", which is what the cards already render as a blank for the person.
 *
 * The table is also the one place that says, per tool: which rows an id
 * field must come from (`of`), what else a login must hold before the tool
 * is offered at all (`needs`), and whether the write is low-risk enough to
 * skip the confirm card (`lowRisk`). All three sit beside the tool's own
 * activity on purpose — never beside a role
 * (docs/decisions/2026-10-31-assistant-v2-more-tools.md).
 */
import type { LevelKey } from "@/lib/permissions/catalogue";
import type { LlmToolDef } from "./llm";
import type {
  CarerReturnDraft,
  ClinicVisitDraft,
  DeathDraft,
  Draft,
  DueDraft,
  FindEnclosureDraft,
  HospitalDraft,
  HospitalReturnDraft,
  ImmunizationDraft,
  Intent,
  MoveDraft,
  PrescriptionDraft,
  RehomeDraft,
  SummaryDraft,
  WeightDraft,
  WhereDraft,
  WhoDraft,
} from "./types";

/**
 * What the `lookup` tool can be asked for, and what an `id` field may point
 * at: one list, so a new id field cannot be added without the model having a
 * way to find a real one.
 */
export const LOOKUP_KINDS = [
  "resident",
  "enclosure",
  "zone",
  "clinic",
  "carer",
  "vaccine",
  "medication",
] as const;
export type LookupKind = (typeof LOOKUP_KINDS)[number];

export type FieldSpec =
  | { type: "id"; about: string; of: LookupKind }
  | { type: "id_list"; about: string; of: LookupKind }
  | { type: "date" | "time" | "text"; about: string }
  | { type: "number"; about: string; integer?: boolean; min?: number; max?: number }
  | { type: "choice"; about: string; options: readonly string[] };

type Fields<D extends { kind: Intent }> = { [K in Exclude<keyof D, "kind">]-?: FieldSpec };

type ToolSpec<D extends { kind: Intent }> = {
  about: string;
  fields: Fields<D>;
  /**
   * An activity the login must hold at `edit` on top of `assistant.record`
   * before this tool is offered. Set only where the write the tool routes
   * into asks for one of its own — `createPrescription` asks
   * `medical.prescriptions`, so a login without it is never shown the tool
   * and never offered a button it could not press (CLAUDE.md, "A button is
   * shown only if the login's cards let it do that action").
   */
  needs?: LevelKey;
  /**
   * Low risk: this write goes in without the confirm card when the sentence
   * left nothing blank. A property of the TOOL, declared here beside its
   * fields, never of whoever is asking.
   */
  lowRisk?: true;
};

const DATE = "YYYY-MM-DD, or null if the sentence did not say.";

const SPECS: { [K in Draft["kind"]]: ToolSpec<Extract<Draft, { kind: K }>> } = {
  move: {
    about: "Move a resident to another enclosure.",
    fields: {
      residentId: { type: "id", of: "resident", about: "Id of the resident, from a lookup. Null if unknown." },
      enclosureId: { type: "id", of: "enclosure", about: "Id of the destination enclosure. Null if unknown." },
      date: { type: "date", about: DATE },
    },
  } satisfies ToolSpec<MoveDraft>,
  clinic: {
    about: "Book a clinic visit for a resident.",
    fields: {
      residentId: { type: "id", of: "resident", about: "Id of the resident. Null if unknown." },
      clinicId: { type: "id", of: "clinic", about: "Id of the clinic. Null if unknown." },
      date: { type: "date", about: DATE },
      time: { type: "time", about: "HH:MM, or null if the sentence did not say." },
      reason: { type: "text", about: "Why, as said. Null if not said." },
      doctorName: { type: "text", about: "The doctor, as said (with Dr X). Null if no one was named." },
    },
  } satisfies ToolSpec<ClinicVisitDraft>,
  hospital: {
    about: "Admit a resident to hospital.",
    fields: {
      residentId: { type: "id", of: "resident", about: "Id of the resident. Null if unknown." },
      date: { type: "date", about: DATE },
    },
  } satisfies ToolSpec<HospitalDraft>,
  "hospital-return": {
    about: "Record a resident coming back from hospital.",
    fields: {
      residentId: { type: "id", of: "resident", about: "Id of the resident. Null if unknown." },
      enclosureId: { type: "id", of: "enclosure", about: "Enclosure they go back to; null means wherever they came from." },
      date: { type: "date", about: DATE },
    },
  } satisfies ToolSpec<HospitalReturnDraft>,
  weight: {
    about: "Record a resident's weight.",
    fields: {
      residentId: { type: "id", of: "resident", about: "Id of the resident. Null if unknown." },
      weightKg: { type: "number", about: "Weight in kilograms. Null if not said." },
      date: { type: "date", about: DATE },
    },
    // One number against one animal on one day, corrected by recording the
    // right one. Nothing is closed and nothing moves.
    lowRisk: true,
  } satisfies ToolSpec<WeightDraft>,
  death: {
    about: "Record that a resident has died.",
    fields: {
      residentId: { type: "id", of: "resident", about: "Id of the resident. Null if unknown." },
      date: { type: "date", about: "YYYY-MM-DD. Never guess: null for 'last night' or anything vague." },
      causeOfDeath: { type: "text", about: "Cause, as said. Null if not said." },
    },
  } satisfies ToolSpec<DeathDraft>,
  rehome: {
    about: "Place a resident with a foster carer or an adopter.",
    fields: {
      residentId: { type: "id", of: "resident", about: "Id of the resident. Null if unknown." },
      rehomeKind: { type: "choice", about: "foster or adopt. Null if the sentence said neither, or both.", options: ["foster", "adopt"] },
      carerId: { type: "id", of: "carer", about: "Id of an EXISTING carer the sentence named. Null otherwise; never invent one." },
      date: { type: "date", about: DATE },
    },
  } satisfies ToolSpec<RehomeDraft>,
  "carer-return": {
    about: "Record a resident coming back from a carer.",
    fields: {
      residentId: { type: "id", of: "resident", about: "Id of the resident. Null if unknown." },
      carerId: { type: "id", of: "carer", about: "Id of an existing carer named. Null otherwise." },
      carerName: { type: "text", about: "The name said after 'from' when it matched no carer. Null otherwise." },
      enclosureId: { type: "id", of: "enclosure", about: "Enclosure they come back to. Null until the person picks one." },
      date: { type: "date", about: DATE },
    },
  } satisfies ToolSpec<CarerReturnDraft>,
  immunization: {
    about: "Record one or more vaccinations for a resident.",
    fields: {
      residentId: { type: "id", of: "resident", about: "Id of the resident. Null if unknown." },
      immunizationTypeIds: { type: "id_list", of: "vaccine", about: "Ids of every vaccine named. Empty if none." },
      date: { type: "date", about: DATE },
    },
    // A vaccination that happened, against one animal on one day. The same
    // shape as a weight: additive, visible on the record, and corrected by
    // recording the right one.
    lowRisk: true,
  } satisfies ToolSpec<ImmunizationDraft>,
  prescription: {
    about:
      "Prescribe a medicine for a resident. Use for 'put X on <medicine>' or 'start X on <medicine> <amount> twice a day'.",
    fields: {
      residentId: { type: "id", of: "resident", about: "Id of the resident. Null if unknown." },
      medicationId: { type: "id", of: "medication", about: "Id of the medicine, from a lookup. Null if it matched nothing." },
      doseQuantity: { type: "number", about: "Amount per dose, in the medicine's own unit. Null if not said.", min: 0 },
      timesPerDay: { type: "number", integer: true, min: 1, max: 4, about: "Doses a day, 1 to 4. Null if the sentence did not say." },
      startDate: { type: "date", about: "The day it starts. " + DATE },
      endDate: { type: "date", about: "The day it stops, if the sentence said one; null for an open course." },
      notes: { type: "text", about: "Anything else said about how to give it. Null otherwise." },
    },
    needs: "medical.prescriptions",
  } satisfies ToolSpec<PrescriptionDraft>,
  where: {
    about: "Answer: where is this resident? Read only.",
    fields: { residentId: { type: "id", of: "resident", about: "Id of the resident. Null if unknown." } },
  } satisfies ToolSpec<WhereDraft>,
  who: {
    about: "Answer: who is in this enclosure? Read only.",
    fields: { enclosureId: { type: "id", of: "enclosure", about: "Id of the enclosure. Null if unknown." } },
  } satisfies ToolSpec<WhoDraft>,
  due: {
    about: "Answer: what is due soon? Read only.",
    fields: { days: { type: "number", integer: true, min: 1, about: "Days ahead to look: today is 1, this week is 7." } },
  } satisfies ToolSpec<DueDraft>,
  "find-enclosure": {
    about: "Answer: which enclosures have room? Read only.",
    fields: {
      zoneId: { type: "id", of: "zone", about: "Id of a zone to look in, from a lookup. Null for the whole shelter." },
      places: { type: "number", integer: true, min: 1, about: "How many residents need a place. Null means one." },
    },
  } satisfies ToolSpec<FindEnclosureDraft>,
  summary: {
    about:
      "Answer: how is this resident doing? Where they are, their weight, medicines, visits and vaccinations. Read only.",
    fields: { residentId: { type: "id", of: "resident", about: "Id of the resident. Null if unknown." } },
  } satisfies ToolSpec<SummaryDraft>,
};

function schemaOf(f: FieldSpec): Record<string, unknown> {
  switch (f.type) {
    case "id":
    case "text":
      return { type: ["string", "null"], description: f.about };
    case "date":
      return { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: f.about };
    case "time":
      return { type: ["string", "null"], pattern: "^\\d{2}:\\d{2}$", description: f.about };
    case "number":
      return {
        type: f.integer ? "integer" : "number",
        ...(f.min === undefined ? {} : { minimum: f.min }),
        ...(f.max === undefined ? {} : { maximum: f.max }),
        description: f.about,
      };
    case "choice":
      return { enum: [...f.options, null], description: f.about };
    case "id_list":
      return { type: "array", items: { type: "string" }, description: f.about };
  }
}

type AnySpec = { about: string; fields: Record<string, FieldSpec>; needs?: LevelKey; lowRisk?: true };

export const DRAFT_KINDS = Object.keys(SPECS) as Draft["kind"][];

/**
 * The field table for one tool, so the modal and the validator ask what a
 * field IS rather than guessing it from the field's name or by probing its
 * JSON schema (#1122).
 */
export function fieldSpecs(kind: Draft["kind"]): Record<string, FieldSpec> {
  return (SPECS[kind] as AnySpec).fields;
}

/** The extra activity a tool's write asks for, on top of `assistant.record`. Null for most. */
export function toolNeeds(kind: Draft["kind"]): LevelKey | null {
  return (SPECS[kind] as AnySpec).needs ?? null;
}

/**
 * Whether this write may go in without the confirm card. A property of the
 * tool, not of the asker: the server action and the database still check the
 * card, exactly as they do for a confirmed one.
 */
export function isLowRiskWrite(kind: Draft["kind"]): boolean {
  return (SPECS[kind] as AnySpec).lowRisk === true;
}

/** The tool list to hand the model: one per intent. */
export function draftTools(): LlmToolDef[] {
  return DRAFT_KINDS.map((kind) => {
    const spec = SPECS[kind] as AnySpec;
    const names = Object.keys(spec.fields);
    return {
      name: kind,
      description: spec.about,
      inputSchema: {
        type: "object",
        properties: Object.fromEntries(names.map((n) => [n, schemaOf(spec.fields[n])])),
        required: names,
        additionalProperties: false,
      },
    };
  });
}

function coerce(f: FieldSpec, v: unknown): unknown {
  switch (f.type) {
    case "id":
    case "text":
    case "date":
    case "time":
      return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
    case "number": {
      const n = typeof v === "number" ? v : NaN;
      if (!Number.isFinite(n)) return null;
      if (f.integer && !Number.isInteger(n)) return null;
      if (f.min !== undefined && n < f.min) return null;
      if (f.max !== undefined && n > f.max) return null;
      return n;
    }
    case "choice":
      return typeof v === "string" && f.options.includes(v) ? v : null;
    case "id_list":
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x !== "") : [];
  }
}

/**
 * A tool call back into a Draft. Unknown tool: null. A field of the wrong
 * type becomes null (a blank on the card) rather than an error: the card
 * and the server action are what validate, as they do for the keyword parser.
 * `due.days` falls back to 7 when absent.
 */
export function draftFromToolCall(name: string, input: Record<string, unknown>): Draft | null {
  if (!Object.prototype.hasOwnProperty.call(SPECS, name)) return null;
  const spec = SPECS[name as Draft["kind"]] as AnySpec;
  const out: Record<string, unknown> = { kind: name };
  for (const [field, f] of Object.entries(spec.fields)) out[field] = coerce(f, input[field]);
  if (name === "due" && out.days === null) out.days = 7;
  return out as Draft;
}
