import "server-only";
import { Document, Font, Image, Page, StyleSheet, Text as PdfText, View, renderToBuffer } from "@react-pdf/renderer";
import type { ComponentProps } from "react";
import { NOTO_SANS_THAI_REGULAR } from "@/lib/archive/fonts/noto-sans-thai-regular";
import { NOTO_SANS_THAI_BOLD } from "@/lib/archive/fonts/noto-sans-thai-bold";
import screenshotSizes from "./screenshot-sizes.json";
import { isForTopic } from "./for-topic";
import type { Permissions } from "@/lib/permissions/can";
import type { Manual, ManualCallout, ManualRole, ManualTopic } from "./types";

/**
 * The manual as a printable PDF, drawn from the same `Manual` data as the
 * /manual page, so an edition (en today, th later) is just another `manual`
 * argument. Same approach as the resident summary PDF
 * (src/lib/archive/resident-summary-pdf.tsx): @react-pdf/renderer, Noto Sans
 * Thai embedded for both scripts, hyphenation off.
 */

Font.register({
  family: "NotoSansThai",
  fonts: [
    { src: NOTO_SANS_THAI_REGULAR, fontWeight: 400 },
    { src: NOTO_SANS_THAI_BOLD, fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

// See the resident summary: no breaks at script changes, lines break at spaces.
const NO_HYPHENATION = 10000;
function Text(props: ComponentProps<typeof PdfText>) {
  return <PdfText hyphenationPenalty={NO_HYPHENATION} {...props} />;
}

const ROLE_ORDER: ManualRole[] = ["admin", "management", "staff", "vet", "volunteer"];
const COLORS = { text: "#1f2933", muted: "#6b7280", rule: "#d8dee5", accent: "#a35f00" };
const CALLOUT: Record<ManualCallout["kind"], { label: string; bg: string; border: string }> = {
  tip: { label: "Tip", bg: "#ecf7ee", border: "#7cc48a" },
  note: { label: "Note", bg: "#eaf3fb", border: "#7ab0dc" },
  warning: { label: "Careful", bg: "#fdeeee", border: "#e09090" },
};
// Line height is set on each Text, never inherited (see the resident summary).
const LH = 1.4;
const CONTENT_WIDTH = 595 - 80;
const MAX_SHOT_HEIGHT = 420;
const MAX_MOBILE_WIDTH = 190;

const styles = StyleSheet.create({
  page: { fontFamily: "NotoSansThai", fontSize: 9.5, color: COLORS.text, paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40 },
  kicker: { fontSize: 8, lineHeight: LH, letterSpacing: 1.1, color: COLORS.accent, fontWeight: 700 },
  title: { fontSize: 26, lineHeight: 1.25, fontWeight: 700, marginTop: 2 },
  subtitle: { fontSize: 10, lineHeight: LH, color: COLORS.muted, marginTop: 6 },
  version: { fontSize: 8.5, lineHeight: LH, color: COLORS.muted, marginTop: 4 },
  h2: { fontSize: 15, lineHeight: 1.3, fontWeight: 700, borderBottomWidth: 1, borderBottomColor: COLORS.rule, paddingBottom: 4, marginBottom: 6 },
  h3: { fontSize: 11.5, lineHeight: 1.3, fontWeight: 700 },
  muted: { fontSize: 8.5, lineHeight: LH, color: COLORS.muted },
  body: { fontSize: 9.5, lineHeight: LH },
  topic: { marginTop: 14 },
  step: { flexDirection: "row", marginTop: 3 },
  stepNo: { width: 16, fontSize: 9.5, lineHeight: LH, fontWeight: 700, color: COLORS.accent },
  stepText: { flex: 1, fontSize: 9.5, lineHeight: LH },
  callout: { marginTop: 6, padding: 6, borderWidth: 1, borderRadius: 3 },
  figure: { marginTop: 8, alignItems: "center" },
  caption: { fontSize: 8, lineHeight: LH, color: COLORS.muted, marginTop: 3, textAlign: "center" },
  roleRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.rule, paddingVertical: 4 },
  roleName: { width: 80, fontSize: 9.5, lineHeight: LH, fontWeight: 700 },
  roleText: { flex: 1, fontSize: 9, lineHeight: LH },
  footer: { position: "absolute", bottom: 22, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: COLORS.muted },
});

/** Bytes of each screenshot, keyed by its `src`; absent = leave the picture out. */
export type ManualImages = Map<string, Uint8Array>;

const SIZES: Record<string, { width: number; height: number } | undefined> = screenshotSizes;

/** Whether a topic is in the copy: everything, or the reader's own. */
export function topicInCopy(topic: ManualTopic, role: ManualRole | null, all: boolean, perms?: Permissions | null) {
  return all || isForTopic(topic, role, perms);
}

/** The `src`s the copy will draw, so the caller can fetch just those. */
export function screenshotSrcs(manual: Manual, role: ManualRole | null, all: boolean, perms?: Permissions | null): string[] {
  return manual.sections.flatMap((s) =>
    s.topics.filter((t) => t.screenshot && topicInCopy(t, role, all, perms)).map((t) => t.screenshot!.src),
  );
}

function Shot({ topic, images }: { topic: ManualTopic; images: ManualImages }) {
  const shot = topic.screenshot;
  const bytes = shot && images.get(shot.src);
  if (!shot || !bytes) return null;
  const size = SIZES[shot.src] ?? { width: 16, height: 10 };
  const maxW = shot.mobile ? MAX_MOBILE_WIDTH : CONTENT_WIDTH;
  const scale = Math.min(maxW / size.width, MAX_SHOT_HEIGHT / size.height);
  return (
    <View style={styles.figure} wrap={false}>
      {/* A PDF primitive, not an <img>: no alt text exists in the format. */}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image
        src={{ data: Buffer.from(bytes), format: "png" }}
        style={{ width: size.width * scale, height: size.height * scale, borderWidth: 0.5, borderColor: COLORS.rule }}
      />
      {shot.caption && <Text style={styles.caption}>{shot.caption}</Text>}
    </View>
  );
}

function ManualDocument({ manual, role, all, images, perms }: { manual: Manual; role: ManualRole | null; all: boolean; images: ManualImages; perms?: Permissions | null }) {
  const roleName = role ? manual.roleNames[role] : null;
  const scope = all || !roleName ? "Full edition" : `${roleName} edition`;
  return (
    <Document title={manual.title} author="Lanna Care for Animals" subject={scope}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>{`LANNA CARE FOR ANIMALS · ${scope.toUpperCase()}`}</Text>
        <Text style={styles.title}>{manual.title}</Text>
        <Text style={styles.subtitle}>{manual.subtitle}</Text>
        <Text style={styles.version}>{manual.version}</Text>

        <View style={{ marginTop: 18 }}>
          <Text style={styles.h2}>Roles at a glance</Text>
          {ROLE_ORDER.map((r) => (
            <View key={r} style={styles.roleRow} wrap={false}>
              <Text style={styles.roleName}>{manual.roleNames[r]}</Text>
              <Text style={styles.roleText}>{manual.roleSummary[r]}</Text>
            </View>
          ))}
        </View>

        {manual.sections.map((section) => {
          const topics = section.topics.filter((t) => topicInCopy(t, role, all, perms));
          if (topics.length === 0) return null;
          return (
            <View key={section.id} break>
              <Text style={styles.h2}>{section.title}</Text>
              <Text style={styles.body}>{section.intro}</Text>
              {topics.map((topic) => (
                <View key={topic.id} style={styles.topic}>
                  <View minPresenceAhead={60}>
                    <Text style={styles.h3}>{topic.title}</Text>
                    {topic.path && <Text style={styles.muted}>{topic.path}</Text>}
                    {topic.roles && (
                      <Text style={styles.muted}>
                        {`Who: ${ROLE_ORDER.filter((r) => topic.roles?.includes(r)).map((r) => manual.roleNames[r]).join(", ")}`}
                      </Text>
                    )}
                  </View>
                  {topic.intro && <Text style={[styles.body, { marginTop: 3 }]}>{topic.intro}</Text>}
                  {topic.steps?.map((step, i) => (
                    <View key={i} style={styles.step} wrap={false}>
                      <Text style={styles.stepNo}>{`${i + 1}.`}</Text>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                  <Shot topic={topic} images={images} />
                  {topic.callouts?.map((c, i) => (
                    <View
                      key={i}
                      style={[styles.callout, { backgroundColor: CALLOUT[c.kind].bg, borderColor: CALLOUT[c.kind].border }]}
                      wrap={false}
                    >
                      <Text style={styles.body}>
                        <Text style={{ fontWeight: 700 }}>{`${CALLOUT[c.kind].label}: `}</Text>
                        {c.text}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text>{`${manual.title} · ${scope} · ${manual.version}`}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Renders the manual to PDF bytes. `role` null = no role known, so everything. */
export async function renderManualPdf(
  manual: Manual,
  options: { role: ManualRole | null; all: boolean; images: ManualImages; perms?: Permissions | null },
): Promise<Uint8Array> {
  const buffer = await renderToBuffer(<ManualDocument manual={manual} {...options} />);
  return new Uint8Array(buffer);
}
