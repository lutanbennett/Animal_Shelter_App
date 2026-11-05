import fs from "node:fs";
const crlf = (f)=>fs.readFileSync(f,"utf8").includes("\r\n");
// checker
let f="scripts/check-test-plan.mjs", s=fs.readFileSync(f,"utf8"); const c=s.includes("\r\n"); s=s.replace(/\r\n/g,"\n");
const old=`  // Template placeholders must be replaced.
  lines.forEach((l, i) => {
    if (inFence[i]) return;
    const ph = l.match(/<(feature|name|yyyy-mm-dd|pass \| [^>]+)>/);
    if (ph) note(file, i + 1, \`unfilled template placeholder \\`<\${ph[1]}>\\`\`);
  });`;
if(!s.includes(old)) throw new Error("old not found");
s=s.replace(old,`  // Template placeholders must be replaced. The template's own guidance prose
  // names them too (\`docs/test-plans/<feature>.md\`), so that prose sits between
  // <!-- guidance:start --> and <!-- guidance:end --> and is not read as a field.
  // Only the placeholder scan skips it: every checkbox, signature and Result line
  // is judged exactly as before, so no unfilled FIELD is tolerated
  // (docs/decisions/2026-11-05-planner-tooling-follow-ups.md).
  let inGuidance = false;
  lines.forEach((l, i) => {
    if (/^\s*<!--\s*guidance:start\s*-->\s*$/.test(l)) inGuidance = true;
    else if (/^\s*<!--\s*guidance:end\s*-->\s*$/.test(l)) inGuidance = false;
    if (inFence[i] || inGuidance) return;
    const ph = l.match(/<(feature|name|yyyy-mm-dd|pass \| [^>]+)>/);
    if (ph)
      note(
        file,
        i + 1,
        \`unfilled template placeholder \\`<\${ph[1]}>\\` — if this line is a field, fill it; if it is the template's own guidance prose (not a field), delete the line\`,
      );
  });`);
fs.writeFileSync(f,c?s.replace(/\n/g,"\r\n"):s);
// template
f="docs/test-plan-template.md"; s=fs.readFileSync(f,"utf8"); const c2=s.includes("\r\n"); s=s.replace(/\r\n/g,"\n");
s=s.replace("# Feature test plan\n\nCopy this","# Feature test plan\n\n<!-- guidance:start -->\nCopy this");
s=s.replace("\n---\n\n## Header","\n<!-- guidance:end -->\n\n---\n\n## Header");
s=s.replace("### Manual verification\n\nThe items","### Manual verification\n\n<!-- guidance:start -->\nThe items");
s=s.replace("empty signature quietly passing.\n","empty signature quietly passing.\n<!-- guidance:end -->\n");
fs.writeFileSync(f,c2?s.replace(/\n/g,"\r\n"):s);
