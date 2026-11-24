// Shared by the waiting-state check, the reader and the page generator (#bkwai).
// The tag sits at the very end of an open item's line:
//   <!--waiting:<state> [by:<who>] since:YYYY-MM-DD [date:YYYY-MM-DD]-->
export const STATES = ["buildable", "stream", "lutan", "director", "decision", "purchasing", "person", "event", "parked"];
export const DECIDERS = ["lutan", "director"];
export const TAG_RE = /\s*<!--waiting:([^>]*?)-->\s*$/;

export function parseTag(line) {
  const m = line.match(TAG_RE);
  if (!m) return null;
  const body = m[1].trim();
  const parts = body.split(/\s+/);
  const tag = { raw: m[0].trim(), state: parts[0], by: null, since: null, date: null, bad: [] };
  for (const p of parts.slice(1)) {
    const kv = p.match(/^(by|since|date):(.+)$/);
    if (!kv) tag.bad.push(p);
    else tag[kv[1]] = kv[2];
  }
  return tag;
}

export function validDate(s) {
  if (!/^\d{4}-\d\d-\d\d$/.test(s || "")) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function stripTag(line) {
  return line.replace(TAG_RE, "");
}

// Open items: "- [ ] <!--#id--> ..." lines. Returns [{lineNo, id, line}].
export function openItems(text) {
  const out = [];
  text.split("\n").forEach((line, i) => {
    if (!/^- \[ \]/.test(line)) return;
    const id = (line.match(/<!--#(\w+)-->/) || [])[1] || null;
    out.push({ lineNo: i + 1, id, line });
  });
  return out;
}

// docs/backlog-names.json, validated. A file that is PRESENT but corrupt is a finding, not a
// crash: the names are what every open item is checked against, so a check that cannot read them
// has verified nothing, and the pre-commit hook lets a crash through on purpose. Throws an Error
// whose message names what is wrong with the file.
export function parseNames(raw) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch (err) {
    throw new Error(`it is not valid JSON — ${err.message}`);
  }
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error(`it is ${Array.isArray(value) ? "an array" : value === null ? "null" : typeof value}, not a flat object of item id to name`);
  for (const [id, name] of Object.entries(value)) {
    if (typeof name !== "string") throw new Error(`"${id}" is ${Array.isArray(name) ? "an array" : name === null ? "null" : typeof name}, not a name`);
  }
  return value;
}

// The shelter's calendar day (Thailand, UTC+7) for an instant. A `since:` is a day AT THE SHELTER, so it
// is compared against this, never against the UTC date: from 00:00 to 07:00 local the UTC date is still
// yesterday and a correctly dated tag read as being in the future (#utcds). `now` is injectable so a test
// can pin the instant instead of depending on the wall clock.
export const SHELTER_TIME_ZONE = "Asia/Bangkok";
export function shelterToday(now = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: SHELTER_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(now).map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}

// A tag's `since:` is in the future only against the shelter's day. ISO dates compare as strings.
export function sinceInFuture(since, now = new Date()) {
  return since > shelterToday(now);
}

// ---- Proof lines (#prvln) -------------------------------------------------------------------------
// An item waiting on Lutan says how to PROVE the step done, so a session can run it before naming him.
// It lives in the item's own prose as `**Proof:** <one line>` (backticks around a command are fine),
// not in the tag: a shell command inside an HTML comment needs escaping and makes the tag brittle.
// `decision` items are out of scope on purpose: a decision only he can make is not provable by a command.
export const PROOF_RE = /\*\*Proof:\*\*\s*\S/;
export const PROOF_STATES = ["lutan"];
export function needsProof(tag) {
  return !!tag && PROOF_STATES.includes(tag.state);
}
export function hasProof(line) {
  return PROOF_RE.test(line);
}

// ---- Which kind of proof is it? (#prvln, second half) -------------------------------------------
// A proof line is either something a session can RUN OR LOOK AT (a command, a screen, a query), or a
// physical/human wait that no command settles. The class is read from the line's own words, not from
// a new tag: a line that cannot be run says so in terms, in its first sentences ("Not a command",
// "Not provable by command", "Not runnable from here", "no command proves"). Unmatched = runnable,
// which is the safe default: the planner is asked to run it or say why it cannot be.
export const NOT_A_COMMAND_RE = /\bnot (?:a command|provable by command|runnable from here)\b|\bno command (?:proves|settles)\b/i;
export function proofText(line) {
  const i = line.search(PROOF_RE);
  return i < 0 ? "" : stripTag(line.slice(i)).replace(/^\*\*Proof:\*\*\s*/, "").trim();
}
export function proofClass(line) {
  const t = proofText(line);
  if (!t) return "none";
  // only the opening of the line decides: a later "not a command" about a SECOND half must not demote a runnable first half
  return NOT_A_COMMAND_RE.test(t.slice(0, 220)) ? "read" : "run";
}

// ---- WHO can run it? (#o5glo) -------------------------------------------------------------------
// `proofClass` says whether a line is a command or a human wait; it does not say whether THE READER can
// run it. Three groups, and only the first is something any session can do from a worktree:
//   worktree - a script, a query or a repo read that works from any checkout
//   reach    - needs somewhere only some sessions reach: production, the Pi, a hosted dashboard, wrangler
//   person   - a device or place no session reaches: his phone, the shelter, a screen only he is signed in to
// DECLARED, not only inferred: a proof line may open with `[who: worktree|reach|person]` right after the
// marker, and the strict check refuses an unknown value, so a typo cannot silently place a line.
// INFERRED when there is no marker, from the line's own words. A line the inference cannot place falls
// into `person`, the most cautious group: the printer then says "could not tell", never "run it".
export const WHO_GROUPS = ["worktree", "reach", "person"];
const WHO_DECL_RE = /^\[who:\s*([a-z-]+)\s*\]\s*/i;
const PERSON_RE = /\b(?:on a phone|from a phone|his phone|his own (?:hands|network|eyes)|in front of the machine|signed in as|search console|the director'?s|at the shelter|mains pulled)\b/i;
const REACH_STRONG_RE = /\bssh\b|\bwrangler\b|\bthe pi\b|\bpi'?s\b|--env production/i;
const WORKTREE_CMD_RE = /`\s*(?:node scripts\/|npm |npx |grep |git |gh |ls |cat )/;
const REACH_WEAK_RE = /\bdashboard\b|\bproduction\b|\/api\//i;
export function proofCount(line) {
  return (line.match(/\*\*Proof:\*\*\s*\S/g) || []).length;
}
export function declaredWho(line) {
  const m = WHO_DECL_RE.exec(proofText(line));
  return m ? m[1].toLowerCase() : null;
}
// returns { who, how } where how is "declared" | "inferred" | "unplaced"
export function proofWho(line) {
  const d = declaredWho(line);
  if (d && WHO_GROUPS.includes(d)) return { who: d, how: "declared" };
  const t = proofText(line).replace(WHO_DECL_RE, "");
  const head = t.slice(0, 220);
  if (PERSON_RE.test(head)) return { who: "person", how: "inferred" };
  if (REACH_STRONG_RE.test(head)) return { who: "reach", how: "inferred" };
  if (WORKTREE_CMD_RE.test(head)) return { who: "worktree", how: "inferred" };
  if (REACH_WEAK_RE.test(head)) return { who: "reach", how: "inferred" };
  return { who: "person", how: "unplaced" };
}
