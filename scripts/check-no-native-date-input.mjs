#!/usr/bin/env node
/**
 * Fails on a native date box. A browser draws <input type="date"> and
 * type="datetime-local" in ITS OWN language, so a Chrome set to English (US)
 * shows mm/dd/yyyy on a shelter record. Use DateInput / DateTimeInput /
 * OptionalDateInput from src/components, which show DD/MM/YYYY everywhere and
 * still submit ISO. Only DateInput.tsx may hold the native one (its calendar picker).
 *
 *   node scripts/check-no-native-date-input.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ALLOWED = new Set([join("src", "components", "DateInput.tsx")]);
const bad = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx|jsx)$/.test(name) && !ALLOWED.has(p)) {
      readFileSync(p, "utf8").split("\n").forEach((line, i) => {
        if (/type=["'{]+\s*["']?(date|datetime-local)["']/.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line)) bad.push(`${p}:${i + 1}`);
      });
    }
  }
}
walk("src");
if (bad.length) {
  console.error("check-no-native-date-input: native date box found — use DateInput / DateTimeInput (src/components/DateInput.tsx):\n  " + bad.join("\n  "));
  process.exit(1);
}
console.log("check-no-native-date-input: ok");
