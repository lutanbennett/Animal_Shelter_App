// The stock-room pick list (src/lib/medication-list/pick.ts) on a fixed list, on the real source file.
//
//   node scripts/check-medication-pick.mjs
//
// It holds: doses are summed per zone and per enclosure; a zone's lines are the sum of its enclosures';
// as-needed doses are not counted; no-round doses are not counted but ARE reported (nothing is
// silently left out of the bag); a missing amount flags the line rather than reading as zero;
// apart residents are not bagged for; same medicine in two units stays two lines.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { buildPickList } = await import(pathToFileURL(join(process.cwd(), "src/lib/medication-list/pick.ts")).href);

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) { failed++; console.log(`FAIL ${name} ${detail}`); }
};
const med = (id, qty, place = "round", unit = "tablet", name = id) => ({
  prescriptionId: Math.random().toString(36), medicationId: id, place, rounds: ["morning"],
  name, doseUnit: unit, quantity: qty, schedule: null, frequencyLabel: null, labelFileId: null, lastDay: false,
});
const res = (...medications) => ({ id: Math.random().toString(36), name: "r", thaiName: null, photoFileId: null, medications });
const enc = (name, ...residents) => ({ enclosure: { name, nameTh: null }, residents });
const list = {
  today: "2026-10-04", round: "morning", error: null,
  apart: [{ ...res(med("amox", 9)), status: "Hospitalised" }],
  zones: [
    { zone: { name: "A", nameTh: null }, enclosures: [
      enc("Kennel 1", res(med("amox", 2), med("pred", 1)), res(med("amox", 0.5))),
      enc("Kennel 2", res(med("amox", 1, "round", "tablet"), med("prn", 1, "asNeeded"), med("norx", 1, "noRound"))),
    ] },
    { zone: { name: "B", nameTh: null }, enclosures: [
      enc("Pen 1", res(med("amox", null), med("syr", 2.5, "round", "ml"), med("syr", 1, "round", "tablet"))),
    ] },
    { zone: { name: "C", nameTh: null }, enclosures: [enc("Only prn", res(med("prn", 1, "asNeeded")))] },
  ],
};
const out = buildPickList(list);
const A = out.zones.find((z) => z.zone.name === "A");
const B = out.zones.find((z) => z.zone.name === "B");
const line = (lines, id, unit = "tablet") => lines.find((l) => l.medicationId === id && l.doseUnit === unit);

check("zone with only as-needed is absent", !out.zones.some((z) => z.zone.name === "C"));
check("zone A amox: 3 doses", line(A.lines, "amox")?.doses === 3, JSON.stringify(line(A.lines, "amox")));
check("zone A amox: total 3.5", line(A.lines, "amox")?.total === 3.5);
check("zone A pred: 1 dose", line(A.lines, "pred")?.doses === 1);
check("kennel 1 amox: 2 doses, total 2.5", line(A.enclosures[0].lines, "amox")?.doses === 2 && line(A.enclosures[0].lines, "amox")?.total === 2.5);
check("kennel 2 amox: 1 dose", line(A.enclosures[1].lines, "amox")?.doses === 1);
check("as-needed not counted", !A.lines.some((l) => l.medicationId === "prn"));
check("no-round not counted", !A.lines.some((l) => l.medicationId === "norx"));
check("no-round reported", out.noRoundDoses === 1, String(out.noRoundDoses));
check("missing amount flags the line", line(B.lines, "amox")?.amountMissing === true);
check("missing amount still counts the dose", line(B.lines, "amox")?.doses === 1);
check("units stay separate lines", line(B.lines, "syr", "ml") && line(B.lines, "syr", "tablet"));
check("apart not bagged", !out.zones.some((z) => z.lines.some((l) => l.total === 9)));
check("zone lines are the enclosure sums", A.lines.reduce((n, l) => n + l.doses, 0) === A.enclosures.reduce((n, e) => n + e.lines.reduce((m, l) => m + l.doses, 0), 0));
check("empty list", buildPickList({ ...list, zones: [] }).zones.length === 0);

console.log(failed ? `${failed} FAILED` : "all held");
process.exit(failed ? 1 : 0);
