// TEST FIXTURE, not application code. Which jobs the three configured roles were given on 2026-10-25, copied from role_cards so the
// live-database checks have something to compare role_permissions with. The app no longer carries this list (JOBS_OF_ROLE was
// removed from src/lib/permissions/jobs.ts: which cards a role holds is data in role_cards, never a table in code).
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { bundleOfJobs } = await import(pathToFileURL(join(process.cwd(), "src/lib/permissions/jobs.ts")).href);

export const TEST_ROLE_JOBS = {
  head_of_medical: ["administer_medication", "record_weight", "add_medical_photos", "feed_special_diets"],
  head_of_maintenance: ["do_maintenance"],
  second_in_command: ["do_stocktaking", "do_purchasing", "record_delivery", "do_maintenance"],
};

export const bundleOfRole = (role) => bundleOfJobs(TEST_ROLE_JOBS[role] ?? []);
