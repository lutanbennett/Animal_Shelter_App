// Refuse a command-line argument a script does not know, before the script does any work.
//
// A mistyped guard is indistinguishable from no guard: `--dryrun` for `--dry-run`, or `--aply`, is silently
// ignored by a script that reads flags with `args.includes(...)`, and a script that can write then writes
// (#sflag, docs/decisions/2026-11-20-script-exit-population.md).
//
//   const bad = unknownArgs(process.argv.slice(2), { flags: ["--apply"], valued: ["--env"] });
//   if (bad.length) { console.error(unknownArgsMessage("populate-shelter-settings", bad)); return 2; }
//
// `flags` take no value; `valued` take the next token as their value (that token is never judged). A bare
// token that is nobody's value is unknown too, so a forgotten `--` is caught. `--help` is not special here.
export function unknownArgs(args, { flags = [], valued = [] } = {}) {
  const known = new Set(flags);
  const takes = new Set(valued);
  const bad = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (takes.has(a)) { i++; continue; }
    if (!known.has(a)) bad.push(a);
  }
  return bad;
}

export function unknownArgsMessage(script, bad) {
  return `${script}: unknown argument${bad.length > 1 ? "s" : ""} ${bad.join(" ")}; nothing was done. See the usage at the top of scripts/${script}.mjs.`;
}
