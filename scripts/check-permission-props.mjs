#!/usr/bin/env node
/**
 * A permission prop is never written as JSX shorthand.
 *
 * In JSX a bare attribute is `true`, so `<TranslationPanel canManage />`
 * passes an unconditional yes into the prop that exists precisely to be able
 * to say no. That is how #1126's hole was written: Settings → Website drew
 * Edit and Remove translation buttons for a login holding the Website card
 * but not Translations, because the call site said
 *
 *     // Admin is a superset of management, so always.
 *     canManageTranslations
 *
 * and the comment was wrong. The server refused every press, so nothing was
 * granted — but a control that is offered and then refused is the fault
 * CLAUDE.md's "a button is shown only if the login's cards let it do that
 * action" exists to stop.
 *
 * So the rule is a shape, not a judgement: any prop whose name starts `can`
 * followed by a capital must be written with a value — `canManage={...}` —
 * even where that value is a literal. There is nothing to baseline and no
 * list to keep in step: a passing tree has none, and the fix is always to
 * write down what the prop actually depends on. Whether that expression is
 * the RIGHT activity is still a person's judgement; this only makes sure
 * there is an expression to read.
 *
 *   node scripts/check-permission-props.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exitWith } from "./lib/exit.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "src");

function tsxFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full));
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const NAME = /^can[A-Z]\w*/;

/**
 * Every shorthand attribute named `can…` in the file, with its line number.
 * Walks the source once, tracking which JSX opening tag (if any) we are
 * inside, so a bare `canSeeGifts` that is the first line of a ternary —
 * `canSeeGifts ? loadRaised(...) : null` in an argument list — is not a prop
 * and is not reported. Nested `{...}` expressions are skipped, because an
 * identifier inside one is a value rather than an attribute name.
 */
function shorthandProps(src) {
  const found = [];
  let i = 0;
  let line = 1;
  const len = src.length;

  while (i < len) {
    const ch = src[i];
    if (ch === "\n") {
      line++;
      i++;
      continue;
    }
    // A JSX opening tag starts `<Component` or `<div` — not `</`, `<=` or `<<`.
    if (ch === "<" && /[A-Za-z]/.test(src[i + 1] ?? "")) {
      i++;
      let depth = 0;
      while (i < len) {
        const c = src[i];
        if (c === "\n") line++;
        else if (c === "{") depth++;
        else if (c === "}") depth--;
        else if (c === '"' || c === "'" || c === "`") {
          // Skip the string, so `className="can...">` cannot end the tag early.
          const quote = c;
          i++;
          while (i < len && src[i] !== quote) {
            if (src[i] === "\n") line++;
            if (src[i] === "\\") i++;
            i++;
          }
        } else if (depth === 0 && c === ">") {
          i++;
          break;
        } else if (depth === 0 && /[A-Za-z]/.test(c)) {
          const rest = src.slice(i);
          const word = rest.match(/^[A-Za-z]\w*/)?.[0] ?? "";
          if (NAME.test(word)) {
            // A value follows an `=`; anything else (another prop, `/>`, `>`)
            // means the attribute was written bare.
            const after = rest.slice(word.length).match(/^\s*(.)/)?.[1];
            if (after !== "=") found.push({ line, name: word });
          }
          i += word.length;
          continue;
        }
        i++;
      }
      continue;
    }
    i++;
  }
  return found;
}

const files = tsxFiles(root);
let failed = 0;
for (const file of files) {
  const rel = path.relative(path.resolve(here, ".."), file).replaceAll("\\", "/");
  for (const { line, name } of shorthandProps(readFileSync(file, "utf8"))) {
    failed++;
    console.log(`FAIL ${rel}:${line} ${name} — write it as ${name}={…}, the activity the action asks`);
  }
}

console.log(
  failed
    ? `\n${failed} permission ${failed === 1 ? "prop is" : "props are"} written as shorthand, which means always true`
    : `\nno permission prop written as shorthand (${files.length} .tsx files)`,
);
await exitWith(failed ? 1 : 0);
