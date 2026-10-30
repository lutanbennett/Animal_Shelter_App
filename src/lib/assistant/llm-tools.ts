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
 */
import type { LlmToolDef } from "./llm";
import type {
  CarerReturnDraft,
  ClinicVisitDraft,
  DeathDraft,
  Draft,
  DueDraft,
  HospitalDraft,
  HospitalReturnDraft,
  ImmunizationDraft,
  Intent,
  MoveDraft,
  RehomeDraft,
  WeightDraft,
  WhereDraft,
  WhoDraft,
} from "./types";

type FieldSpec =
  | { type: "id" | "date" | "time" | "text"; about: string }
  | { type: "number"; about: string; integer?: boolean }
  | { type: "choice"; about: string; options: readonly string[] }
  | { type: "id_list"; about: string };

type Fields<D extends { kind: Intent }> = { [K in Exclude<keyof D, "kind">]-?: FieldSpec };

type ToolSpec<D extends { kind: Intent }> = { about: string; fields: Fields<D> };

const DATE = "YYYY-MM-DD, or null if the sentence did not say.";

const SPECS: { [K in Draft["kind"]]: ToolSpec<Extract<Draft, { kind: K }>> } = {
  move: {
    about: "Move a resident to another enclosure.",
    fields: {
      residentId: { type: "id", about: "Id of the resident, from a lookup. Null if unknown." },
      enclosureId: { type: "id", about: "Id of the destination enclosure. Null if unknown." },
      date: { type: "date", about: DATE },
    },
  } satisfies ToolSpec<MoveDraft>,
  clinic: {
    about: "Book a clinic visit for a resident.",
    fields: {
      residentId: { type: "id", about: "Id of the resident. Null if unknown." },
      clinicId: { type: "id", about: "Id of the clinic. Null if unknown." },
      date: { type: "date", about: DATE },
      time: { type: "time", about: "HH:MM, or null if the sentence did not say." },
      reason: { type: "text", about: "Why, as said. Null if not said." },
      doctorName: { type: "text", about: "The doctor, as said (with Dr X). Null if no one was named." },
    },
  } satisfies ToolSpec<ClinicVisitDraft>,
  hospital: {
    about: "Admit a resident to hospital.",
    fields: {
      residentId: { type: "id", about: "Id of the resident. Null if unknown." },
      date: { type: "date", about: DATE },
    },
  } satisfies ToolSpec<HospitalDraft>,
  "hospital-return": {
    about: "Record a resident coming back from hospital.",
    fields: {
      residentId: { type: "id", about: "Id of the resident. Null if unknown." },
      enclosureId: { type: "id", about: "Enclosure they go back to; null means wherever they came from." },
      date: { type: "date", about: DATE },
    },
  } satisfies ToolSpec<HospitalReturnDraft>,
  weight: {
    about: "Record a resident's weight.",
    fields: {
      residentId: { type: "id", about: "Id of the resident. Null if unknown." },
      weightKg: { type: "number", about: "Weight in kilograms. Null if not said." },
      date: { type: "date", about: DATE },
    },
  } satisfies ToolSpec<WeightDraft>,
  death: {
    about: "Record that a resident has died.",
    fields: {
      residentId: { type: "id", about: "Id of the resident. Null if unknown." },
      date: { type: "date", about: "YYYY-MM-DD. Never guess: null for 'last night' or anything vague." },
      causeOfDeath: { type: "text", about: "Cause, as said. Null if not said." },
    },
  } satisfies ToolSpec<DeathDraft>,
  rehome: {
    about: "Place a resident with a foster carer or an adopter.",
    fields: {
      residentId: { type: "id", about: "Id of the resident. Null if unknown." },
      rehomeKind: { type: "choice", about: "foster or adopt. Null if the sentence said neither, or both.", options: ["foster", "adopt"] },
      carerId: { type: "id", about: "Id of an EXISTING carer the sentence named. Null otherwise; never invent one." },
      date: { type: "date", about: DATE },
    },
  } satisfies ToolSpec<RehomeDraft>,
  "carer-return": {
    about: "Record a resident coming back from a carer.",
    fields: {
      residentId: { type: "id", about: "Id of the resident. Null if unknown." },
      carerId: { type: "id", about: "Id of an existing carer named. Null otherwise." },
      carerName: { type: "text", about: "The name said after 'from' when it matched no carer. Null otherwise." },
      enclosureId: { type: "id", about: "Enclosure they come back to. Null until the person picks one." },
      date: { type: "date", about: DATE },
    },
  } satisfies ToolSpec<CarerReturnDraft>,
  immunization: {
    about: "Record one or more vaccinations for a resident.",
    fields: {
      residentId: { type: "id", about: "Id of the resident. Null if unknown." },
      immunizationTypeIds: { type: "id_list", about: "Ids of every vaccine named. Empty if none." },
      date: { type: "date", about: DATE },
    },
  } satisfies ToolSpec<ImmunizationDraft>,
  where: {
    about: "Answer: where is this resident? Read only.",
    fields: { residentId: { type: "id", about: "Id of the resident. Null if unknown." } },
  } satisfies ToolSpec<WhereDraft>,
  who: {
    about: "Answer: who is in this enclosure? Read only.",
    fields: { enclosureId: { type: "id", about: "Id of the enclosure. Null if unknown." } },
  } satisfies ToolSpec<WhoDraft>,
  due: {
    about: "Answer: what is due soon? Read only.",
    fields: { days: { type: "number", integer: true, about: "Days ahead to look: today is 1, this week is 7." } },
  } satisfies ToolSpec<DueDraft>,
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
      return { type: f.integer ? "integer" : "number", description: f.about };
    case "choice":
      return { enum: [...f.options, null], description: f.about };
    case "id_list":
      return { type: "array", items: { type: "string" }, description: f.about };
  }
}

type AnySpec = { about: string; fields: Record<string, FieldSpec> };

export const DRAFT_KINDS = Object.keys(SPECS) as Draft["kind"][];

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
      return Number.isFinite(n) ? n : null;
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
