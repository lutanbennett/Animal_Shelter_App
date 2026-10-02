import fs from "node:fs";
let p = "src/lib/manual/en.ts";
let s = fs.readFileSync(p, "utf8");
const marker = `      ],\n    },\n    {\n      id: "photos",`;
if (s.split(marker).length !== 2) throw new Error("marker");
const topic = `        {
          id: "archive-records",
          title: "Archiving a medical record",
          roles: ["admin", "management", "staff"],
          path: "Resident hub → Weight, Prescriptions, Vet appointments or Immunizations",
          steps: [
            "A weight reading, a prescription, a vet visit or an immunization that was entered by mistake is archived rather than deleted. Tap Archive on its row and, if you like, say why — for example that it was entered on the wrong resident.",
            "An archived record leaves the list and everything built from it: the weight chart, the medication and cost forecasts, stock usage, the vaccinated and in-treatment counts, and the public website. It is not gone. If you archive the newest dose of a vaccine, the resident's next-due date goes back to the dose before it.",
            "Under each list, 'N archived hidden' appears when something has been archived. Tap Show archived to see those records below the live ones, greyed out with the reason, and Restore to bring one back. Hide archived puts the list back as it was.",
            "An archived weight or immunization no longer holds its day, so you can enter the correct one straight away. If you then restore the old one while a new one has taken its day, Restore says so and does nothing; archive or correct the new one first.",
            "Vets and volunteers don't see Archive. A vet who enters something by mistake asks the shelter to archive it. A deceased resident's record is closed, so nothing on it can be archived or restored.",
            "Photos and other attachments are not archived this way — they are still deleted from their own row.",
          ],
        },
`;
s = s.replace(marker, () => topic + marker);
fs.writeFileSync(p, s);

p = "src/lib/releases.ts";
s = fs.readFileSync(p, "utf8");
s = s.replace("export const unreleased: ReleaseNote[] = [];", `export const unreleased: ReleaseNote[] = [
  {
    text: "Weight readings, prescriptions, vet visits and immunizations can now be archived. If one was entered by mistake, tap Archive on its row on the resident's page and, if you like, say why. It leaves the list, the weight chart, the forecasts and the counts, but it is kept, not deleted. Under each list, Show archived brings the archived ones back into view, greyed out with the reason, and Restore puts one back. An archived weight or vaccination no longer blocks entering the correct one for that day. Archive is for admin, management and staff; vets and volunteers don't see it.",
    roles: ["admin", "management", "staff"],
  },
];`);
fs.writeFileSync(p, s);
