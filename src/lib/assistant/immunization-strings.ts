/**
 * The immunization card's words. Kept beside the assistant rather than in
 * the dictionaries while those are being edited by another stream; fold
 * them into `t.assistant` when that settles.
 */
export function immunizationStrings(locale: string) {
  if (locale === "th") {
    return {
      title: "บันทึกวัคซีน",
      summary: (resident: string, types: string, date: string) =>
        `บันทึกวัคซีน ${types} ให้ ${resident} วันที่ ${date}`,
      done: (resident: string, types: string, date: string) => `บันทึกวัคซีน ${types} ให้ ${resident} วันที่ ${date} แล้ว`,
      typesLabel: "วัคซีน",
      typeMissing: "เลือกวัคซีนอย่างน้อยหนึ่งชนิด",
    };
  }
  return {
    title: "Record vaccination",
    summary: (resident: string, types: string, date: string) =>
      `Record ${types} for ${resident} on ${date}`,
    done: (resident: string, types: string, date: string) => `Recorded ${types} for ${resident} on ${date}.`,
    typesLabel: "Vaccines",
    typeMissing: "Tick at least one vaccine.",
  };
}
