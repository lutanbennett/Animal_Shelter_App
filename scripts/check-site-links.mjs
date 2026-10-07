// Pure check of src/lib/site/links.ts: what becomes a link and what is refused.
//   node scripts/check-site-links.mjs     (from the repo root; no database)
import { pathToFileURL } from "node:url";
import { join } from "node:path";

// Node strips the types itself; links.ts has no imports.
const { parseLinks, safeHref, sameLinks } = await import(
  pathToFileURL(join(process.cwd(), "src/lib/site/links.ts")).href
);

let failed = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`}`);
};
const links = (t) => parseLinks(t).filter((p) => p.type === "link").map((p) => [p.label, p.href]);
const plain = (t) => parseLinks(t).map((p) => (p.type === "text" ? p.text : "")).join("");

eq("bare https", links("Give at https://donorbox.org/lanna today"), [["https://donorbox.org/lanna", "https://donorbox.org/lanna"]]);
eq("full stop not in link", links("See donorbox.org: https://donorbox.org/lanna."), [["https://donorbox.org/lanna", "https://donorbox.org/lanna"]]);
eq("www form", links("Visit www.lannacare.org!"), [["www.lannacare.org", "https://www.lannacare.org/"]]);
eq("worded link", links("[Give monthly on DonorBox](https://donorbox.org/x)"), [["Give monthly on DonorBox", "https://donorbox.org/x"]]);
eq("email worded", links("[Email us](mailto:hi@lannacare.org)"), [["Email us", "mailto:hi@lannacare.org"]]);
eq("email bare", links("write to hi@lannacare.org."), [["hi@lannacare.org", "mailto:hi@lannacare.org"]]);
eq("phone", links("[Call](tel:+66812345678)"), [["Call", "tel:+66812345678"]]);
eq("site path", links("[Adopt](/adopt) or [join](/friends/join)"), [["Adopt", "/adopt"], ["join", "/friends/join"]]);
eq("javascript refused", links("[x](javascript:alert(1))"), []);
eq("javascript kept as text", plain("[x](javascript:alert(1))"), "[x](javascript:alert(1))");
eq("data refused", links("[x](data:text/html;base64,AAA)"), []);
eq("protocol-relative refused", safeHref("//evil.example"), null);
eq("backslash path refused", safeHref("/\\evil.example"), null);
eq("ftp refused", links("[x](ftp://a.b/c)"), []);
eq("thai text then link", links("บริจาคได้ที่ https://donorbox.org/lanna ขอบคุณ"), [["https://donorbox.org/lanna", "https://donorbox.org/lanna"]]);
eq("thai runs straight on", links("https://donorbox.org/lannaขอบคุณ"), [["https://donorbox.org/lanna", "https://donorbox.org/lanna"]]);
eq("thai worded link", links("[บริจาครายเดือน](https://donorbox.org/x)"), [["บริจาครายเดือน", "https://donorbox.org/x"]]);
eq("balanced paren kept", links("https://en.wikipedia.org/wiki/Dog_(film)"), [["https://en.wikipedia.org/wiki/Dog_(film)", "https://en.wikipedia.org/wiki/Dog_(film)"]]);
eq("closing paren dropped", links("(see https://donorbox.org/x)"), [["https://donorbox.org/x", "https://donorbox.org/x"]]);
eq("no scheme-less word", links("donorbox.org alone is text"), []);
eq("same links", sameLinks("[a](https://x.org/a) b@c.org", "[ก](https://x.org/a) b@c.org"), true);
eq("changed address", sameLinks("[a](https://x.org/a)", "[ก](https://x.org/b)"), false);
eq("dropped link", sameLinks("[a](https://x.org/a)", "ก"), false);

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("all ok");
