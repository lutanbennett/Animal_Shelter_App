import "server-only";
import { Document, Font, Image, Page, StyleSheet, Text as PdfText, View, renderToBuffer } from "@react-pdf/renderer";
import type { ComponentProps } from "react";
import { NOTO_SANS_THAI_REGULAR } from "@/lib/archive/fonts/noto-sans-thai-regular";
import { NOTO_SANS_THAI_BOLD } from "@/lib/archive/fonts/noto-sans-thai-bold";
import { thaiPdfText } from "@/lib/archive/fonts/thai-pdf-text";
import { BEBAS_NEUE } from "./assets/bebas-neue";
import { YELLOWTAIL } from "./assets/yellowtail";
import { LCA_SEAL_PNG } from "./assets/seal";
import { RECEIPT_LABELS_EN, formatBaht, formatReceiptDate, type ReceiptDocument, type ReceiptLabels } from "./receipt";

/**
 * A donation receipt as an A4 PDF, laid out from the receipt the Director
 * issued before the app (101-Global-Tiger.pdf, kept out of git: it names a real
 * donor). Same tooling as the manual and the resident summary
 * (src/lib/manual/manual-pdf.tsx): @react-pdf/renderer, fonts as data URIs.
 *
 * ONE LAYOUT FOR BOTH COUNTRIES. What differs between a Thai and a US receipt
 * comes in as data (the issuer snapshot, its registration and statement lines)
 * or from formatReceiptDate(); nothing here branches on the country.
 *
 * Anything a person typed (donor name, descriptions) is set in Noto Sans Thai,
 * because donor names are often Thai and Bebas Neue and Yellowtail have no Thai
 * glyphs: without it a Thai name prints as blank boxes on a document that has
 * already been sent. Bebas and Yellowtail carry fixed English labels only.
 */

Font.register({
  family: "NotoSansThai",
  fonts: [
    { src: NOTO_SANS_THAI_REGULAR, fontWeight: 400 },
    { src: NOTO_SANS_THAI_BOLD, fontWeight: 700 },
  ],
});
Font.register({ family: "BebasNeue", src: BEBAS_NEUE });
Font.register({ family: "Yellowtail", src: YELLOWTAIL });
Font.registerHyphenationCallback((word) => [word]);

// See the resident summary: no breaks at script changes, lines break at spaces.
// Every string goes through thaiPdfText(), or a Thai name containing ำ loses
// its last characters (src/lib/archive/fonts/thai-pdf-text.ts).
const NO_HYPHENATION = 10000;
function Text({ children, ...props }: ComponentProps<typeof PdfText>) {
  return (
    <PdfText hyphenationPenalty={NO_HYPHENATION} {...props}>
      {typeof children === "string" ? thaiPdfText(children) : children}
    </PdfText>
  );
}

const NAVY = "#123c6b";
const RED = "#d6453d";
const INK = "#1a1a1a";
const LH = 1.4;

const styles = StyleSheet.create({
  page: { fontFamily: "NotoSansThai", fontSize: 10, color: INK, paddingTop: 34, paddingBottom: 40, paddingLeft: 57, paddingRight: 53 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontFamily: "BebasNeue", fontSize: 62, lineHeight: 1, color: NAVY, textTransform: "uppercase" },
  seal: { width: 74, height: 68, marginTop: 10 },
  issuerName: { fontSize: 9.5, lineHeight: LH, fontWeight: 700, marginTop: 14 },
  issuerLine: { fontSize: 9.5, lineHeight: LH },
  label: { fontFamily: "BebasNeue", fontSize: 15, lineHeight: 1.2, color: NAVY, textTransform: "uppercase" },
  meta: { flexDirection: "row", marginTop: 26 },
  billTo: { flex: 1, paddingRight: 16 },
  metaRight: { width: 186 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 },
  metaValue: { fontSize: 9.5, lineHeight: LH },
  table: { marginTop: 26 },
  rule: { borderTopWidth: 1.3, borderTopColor: RED },
  headRow: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 6 },
  row: { flexDirection: "row", paddingTop: 7, paddingHorizontal: 6 },
  desc: { flex: 1, paddingRight: 24, fontSize: 9.5, lineHeight: LH },
  amount: { width: 110, textAlign: "right", fontSize: 9.5, lineHeight: LH },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12, paddingHorizontal: 6 },
  totalLabel: { fontFamily: "BebasNeue", fontSize: 20, lineHeight: 1.2, color: NAVY, width: 76 },
  totalValue: { fontFamily: "NotoSansThai", fontWeight: 700, fontSize: 15, lineHeight: 1.45, color: NAVY, width: 104, textAlign: "right" },
  statement: { fontSize: 8.5, lineHeight: LH, marginTop: 16 },
  footer: { position: "absolute", left: 97, bottom: 34, flexDirection: "row", alignItems: "flex-end" },
  thankYou: { fontFamily: "Yellowtail", fontSize: 40, lineHeight: 1.2, color: NAVY, marginRight: 6 },
  footerRule: { borderLeftWidth: 1, borderLeftColor: NAVY, height: 54, marginRight: 8 },
  terms: { fontFamily: "BebasNeue", fontSize: 14, lineHeight: 1.2, color: RED, textTransform: "uppercase" },
  termsBody: { fontSize: 9, lineHeight: LH, marginTop: 14 },
  voidMark: { position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", fontFamily: "BebasNeue", fontSize: 150, color: RED, opacity: 0.22, transform: "rotate(-24deg)" },
  voidNote: { fontSize: 9, lineHeight: LH, color: RED, fontWeight: 700, marginTop: 10 },
});

function ReceiptPage({ doc, labels }: { doc: ReceiptDocument; labels: ReceiptLabels }) {
  const { issuer, content } = doc;
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{labels.title}</Text>
        {/* A PDF primitive, not an <img>: no alt text exists in the format. */}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={LCA_SEAL_PNG} style={styles.seal} />
      </View>

      <Text style={styles.issuerName}>{issuer.name}</Text>
      {issuer.addressLines.map((line, i) => (
        <Text key={`a${i}`} style={styles.issuerLine}>{line}</Text>
      ))}
      {issuer.registrationLines.map((line, i) => (
        <Text key={`r${i}`} style={styles.issuerLine}>{line}</Text>
      ))}

      <View style={styles.meta}>
        <View style={styles.billTo}>
          <Text style={styles.label}>{labels.billTo}</Text>
          <Text style={[styles.metaValue, { marginTop: 2 }]}>{content.donorName}</Text>
        </View>
        <View style={styles.metaRight}>
          <View style={styles.metaRow}>
            <Text style={styles.label}>{labels.receiptNumber}</Text>
            <Text style={styles.metaValue}>{doc.number}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.label}>{labels.receiptDate}</Text>
            <Text style={styles.metaValue}>{formatReceiptDate(doc.issuedOn, doc.country)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.rule} />
        <View style={styles.headRow}>
          <Text style={[styles.label, { flex: 1 }]}>{labels.description}</Text>
          <Text style={[styles.label, { width: 110, textAlign: "right" }]}>{labels.amount}</Text>
        </View>
        <View style={styles.rule} />
        {content.lines.map((line, i) => (
          <View key={i} style={styles.row} wrap={false}>
            <Text style={styles.desc}>{line.description}</Text>
            <Text style={styles.amount}>{line.amount == null ? labels.inKind : formatBaht(line.amount)}</Text>
          </View>
        ))}
        <View style={styles.totalRow} wrap={false}>
          <Text style={styles.totalLabel}>{labels.total}</Text>
          {/* A gift wholly in kind has no money total; "฿ 0.00" would read as a receipt for nothing. */}
          <Text style={styles.totalValue}>
            {content.lines.every((l) => l.amount == null) ? labels.inKind : `฿ ${formatBaht(content.total)}`}
          </Text>
        </View>
      </View>

      {issuer.statementLines.map((line, i) => (
        <Text key={`s${i}`} style={styles.statement}>{line}</Text>
      ))}
      {doc.voided && (
        <Text style={styles.voidNote}>
          {labels.voidedOn(formatReceiptDate(doc.voided.on, doc.country), doc.voided.reason)}
        </Text>
      )}

      <View style={styles.footer} fixed>
        <Text style={styles.thankYou}>{labels.thankYou}</Text>
        <View style={styles.footerRule} />
        <View>
          <Text style={styles.terms}>{labels.terms}</Text>
          <Text style={styles.termsBody}>{labels.termsBody}</Text>
        </View>
      </View>

      {doc.voided && <Text style={styles.voidMark} fixed>{labels.void}</Text>}
    </Page>
  );
}

/** Renders one receipt to PDF bytes. */
export async function renderReceiptPdf(doc: ReceiptDocument, labels: ReceiptLabels = RECEIPT_LABELS_EN): Promise<Uint8Array> {
  const buffer = await renderToBuffer(
    <Document title={`${labels.title} ${doc.number}`} author={doc.issuer.name} subject={doc.content.donorName}>
      <ReceiptPage doc={doc} labels={labels} />
    </Document>,
  );
  return new Uint8Array(buffer);
}
