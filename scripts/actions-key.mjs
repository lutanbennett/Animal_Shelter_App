#!/usr/bin/env node
// The Server Actions encryption key (scripts/lib/actions-key.mjs says why there
// is one). Three uses:
//
//   node scripts/actions-key.mjs --generate
//       prints a new key, to paste as NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<key>
//       into the environment's values file on the dev machine AND on the Pi.
//   node scripts/actions-key.mjs --env production
//       prints the fingerprint of the configured key. Run it on both machines
//       and compare: equal fingerprints are equal keys. The key is never printed.
//   node scripts/actions-key.mjs --env production --built
//       also checks that the build in .next was made with that key (exit 1 if
//       not). deploy.mjs and deploy-pi.sh run this after every build.
import { loadEnv, parseEnvArg } from "./lib/env.mjs";
import {
  ACTIONS_KEY_VAR,
  actionsKeyProblem,
  builtKeyProblem,
  generateActionsKey,
  keyFingerprint,
} from "./lib/actions-key.mjs";

const { name, rest } = parseEnvArg(process.argv.slice(2));

if (rest.includes("--generate")) {
  console.log(generateActionsKey());
  process.exit(0);
}

const key = loadEnv(name)[ACTIONS_KEY_VAR];
const problem = actionsKeyProblem(key);
if (problem) {
  console.error(`actions-key (${name}): ${problem}`);
  process.exit(2);
}
console.log(`actions-key (${name}): configured key fingerprint ${keyFingerprint(key)}`);

if (rest.includes("--built")) {
  const built = builtKeyProblem(key);
  if (built) {
    console.error(`actions-key (${name}): ${built}`);
    process.exit(1);
  }
  console.log(`actions-key (${name}): the build in .next carries that key`);
}
