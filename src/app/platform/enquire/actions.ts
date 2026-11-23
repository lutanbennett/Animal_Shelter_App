"use server";

import { headers } from "next/headers";
import { answerForInsert, cleanEnquiry, ENQUIRY_THANKS, makeThrottle, type EnquiryFields, type EnquiryProblem } from "@/lib/platform/enquiry";
import { appUrl, platformUrl } from "@/lib/site-hosts";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * The shelter enquiry (#shsup, docs/decisions/2026-11-20-shelter-enquiry-form.md). A stranger's form: it RECORDS who
 * asked and mails Lutan; it creates no shelter, role, login or invitation. Service role is used because a stranger holds
 * no table access (0427 grants none): this is the one call site, recorded under serviceRoleSites. It reads nothing back
 * and never says whether an address or shelter is already known: success, a duplicate, a throttled or honeypotted send
 * and a database failure all return the same answer. Only the visitor's own bad field may say what to fix.
 */

export type EnquiryState = { ok: true } | { ok: false; problem: EnquiryProblem } | null;

// 5 tries per address per 10 minutes. In memory: one server on the Pi.
const allow = makeThrottle(5, 10 * 60 * 1000);

async function callerKey(): Promise<string> {
  const h = await headers();
  return (h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim().slice(0, 64);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Best effort, after the insert. Never throws and never waits past 5 s. */
async function mailOwner(row: EnquiryFields) {
  try {
    const to = process.env.SHELTER_ENQUIRY_MAIL_TO?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = platformUrl("/api/releases/mail") ?? appUrl("/api/releases/mail") // test and UAT have no platform host; only there may the staff address stand in;
    if (!to || !key || !url) return;
    const lines = [
      `Shelter: ${row.shelterName}`,
      `Name: ${row.contactName}`,
      `Email: ${row.email}`,
      `Phone: ${row.phone || "-"}`,
      `Where: ${row.location || "-"}`,
      "",
      row.message || "(no message)",
    ];
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      // The visitor's words are the BODY only: the subject is fixed and the address is ours.
      body: JSON.stringify({
        subject: "New shelter enquiry",
        text: lines.join("\n"),
        html: `<pre style="font-family:inherit;white-space:pre-wrap">${esc(lines.join("\n"))}</pre>`,
        to: [to],
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error("shelter enquiry: mail did not go", err instanceof Error ? err.message : err);
  }
}

export async function submitEnquiry(_prev: EnquiryState, form: FormData): Promise<EnquiryState> {
  // Honeypot: a person never sees this field. A bot gets the ordinary answer and nothing is stored.
  if (String(form.get("website") ?? "") !== "") return ENQUIRY_THANKS;
  if (!allow(await callerKey())) return ENQUIRY_THANKS;

  const checked = cleanEnquiry({
    shelterName: form.get("shelterName"),
    contactName: form.get("contactName"),
    email: form.get("email"),
    phone: form.get("phone"),
    location: form.get("location"),
    message: form.get("message"),
  });
  if (!checked.ok) return { ok: false, problem: checked.problem };
  const r = checked.row;

  const { error } = await createAdminClient().from("shelter_enquiries").insert({
    shelter_name: r.shelterName,
    contact_name: r.contactName,
    email: r.email,
    phone: r.phone || null,
    location: r.location || null,
    message: r.message || null,
  });
  if (error) {
    // 23505 (one open enquiry per address) is answered exactly as a success; 23514 means this file drifted from 0427.
    const { answer, log } = answerForInsert(error.code);
    if (log === "drift") console.error("shelter enquiry: check violation, validation drifted from 0427", error.message);
    else if (log === "failure") console.error("shelter enquiry: insert failed", error.code, error.message);
    return answer;
  }
  await mailOwner(r);
  return ENQUIRY_THANKS;
}
