import React from "react";
import { Document, Page, Text, Font, renderToBuffer } from "@react-pdf/renderer";
import { NOTO_SANS_THAI_REGULAR } from "../src/lib/archive/fonts/noto-sans-thai-regular.ts";
import { NOTO_SANS_THAI_BOLD } from "../src/lib/archive/fonts/noto-sans-thai-bold.ts";
Font.register({ family: "NotoSansThai", fonts: [{ src: NOTO_SANS_THAI_REGULAR, fontWeight: 400 }, { src: NOTO_SANS_THAI_BOLD, fontWeight: 700 }] });
Font.registerHyphenationCallback((w) => [w]);
const h = React.createElement;
const doc = h(Document, null, h(Page, { size: "A4", style: { fontFamily: "NotoSansThai", fontSize: 10 } }, h(Text, null, "Hello ด่าง 1"), h(Text, { style: { fontWeight: 700 } }, "Bold")));
try { const buf = await renderToBuffer(doc); console.log("ok", buf.length, "bytes"); }
catch (e) { console.error("FAILED:", e.stack); }
