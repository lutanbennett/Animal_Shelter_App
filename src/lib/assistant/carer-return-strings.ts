/**
 * The return-from-carer card's words. Kept beside the assistant rather than
 * in the dictionaries while those are being edited by another stream, as
 * immunization-strings.ts is; fold both into `t.assistant` when that settles.
 */
export function carerReturnStrings(locale: string) {
  if (locale === "th") {
    return {
      title: "กลับมาที่ศูนย์",
      summary: (resident: string, place: string, date: string) =>
        `${resident} กลับมาอยู่ที่ ${place} วันที่ ${date}`,
      done: (resident: string, place: string) => `เรียบร้อย — ${resident} กลับมาอยู่ที่ ${place} แล้ว`,
      fromCarer: (carer: string) => `กลับมาจาก ${carer}`,
      unknownCarer: (said: string) =>
        `ไม่มีผู้ดูแลชื่อ "${said}" ในรายชื่อ และจะไม่มีการเพิ่มผู้ดูแลใหม่ที่นี่ การรับกลับจะสิ้นสุดการดูแลของผู้ดูแลคนปัจจุบัน`,
      notWithCarer: "ตอนนี้ไม่ได้อยู่กับผู้ดูแล ใช้ได้เฉพาะสัตว์ที่ฝากเลี้ยงหรือรับเลี้ยงไปแล้ว",
      pickEnclosure: "เลือกคอกที่จะกลับมาอยู่",
    };
  }
  return {
    title: "Back to the shelter",
    summary: (resident: string, place: string, date: string) =>
      `${resident} comes back into ${place} on ${date}`,
    done: (resident: string, place: string) => `Done — ${resident} is back in ${place}.`,
    fromCarer: (carer: string) => `Coming back from ${carer}`,
    unknownCarer: (said: string) =>
      `No carer called "${said}" is on the list, and none is added here. The return ends whoever is caring for them now.`,
    notWithCarer:
      "Not with a carer at the moment. This is only for a resident who is fostered or adopted.",
    pickEnclosure: "Choose the enclosure they come back to.",
  };
}
