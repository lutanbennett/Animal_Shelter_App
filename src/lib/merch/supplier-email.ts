import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppEnv } from "@/lib/app-env";

/**
 * The daily supplier email (docs/merch-shop.md, "The daily supplier email"). Run once a day by the Worker's cron
 * through POST /api/merch/supplier-emails. Service role (recorded in docs/hard-coded-security-registry.json): no
 * login is behind a cron, and the activity it stands for is merch.manage.
 *
 * WHICH PARTS: fulfilment 'supplier', status 'new', sent_to_supplier_at null, the order paid, oldest first.
 *
 * THE ORDERING, which is the correctness argument. supabase-js cannot hold one database transaction across calls and
 * a transaction function needs a migration this stream may not carry, so the "mark and send commit together" shape
 * is built from a CLAIM and an UNDO:
 *   1. insert the merch_supplier_emails row (the exact body);
 *   2. CLAIM the parts: update ... where id in (...) and status = 'new' and sent_to_supplier_at is null. The
 *      conditional update is the guard: two runs at once cannot both claim a part, so NOTHING REPEATS;
 *   3. only now ask the mail provider to send;
 *   4. if it refuses, UNDO: put every claimed part back to new/null and delete the log row, so the next run lists
 *      the same parts: NOTHING MISSED on a failed send.
 * The one window left is a crash between 3 and 4, which leaves parts marked and the log row present: the log then
 * says what was meant to go, and staff read it (re-sending is deliberately not a feature). Recorded in the decision
 * file as the departure from a true single transaction.
 */

type MailBinding = {
  send(message: { from: { email: string; name: string }; to: string; subject: string; text: string; html: string }): Promise<unknown>;
};
type MailEnv = { STATUS_ALERT_MAIL?: MailBinding; STATUS_ALERT_FROM?: string };

function workerEnv(): MailEnv | null {
  try {
    return getCloudflareContext().env as MailEnv;
  } catch {
    return null;
  }
}

export type UnsentPart = {
  id: string;
  order_no: string;
  created_at: string;
  buyer_name: string;
  ship_address: string;
  ship_country: string;
  items: { product_name: string; size: string | null; colour: string | null; quantity: number }[];
};

type Row = {
  id: string;
  supplier_id: string;
  created_at: string;
  order: { order_no: string; buyer_name: string; ship_address: string; ship_country: string; payment_state: string } | null;
  items: { product_name: string; size: string | null; colour: string | null; quantity: number }[];
};

/** Every part waiting for a supplier, grouped by supplier, oldest first. Takes any client: staff screen (RLS) or cron. */
export async function unsentParts(db: SupabaseClient) {
  const { data, error } = await db
    .from("merch_order_parts")
    .select("id, supplier_id, created_at, order:merch_orders!inner(order_no, buyer_name, ship_address, ship_country, payment_state), items:merch_order_items(product_name, size, colour, quantity)")
    .eq("fulfilment", "supplier")
    .eq("status", "new")
    .is("sent_to_supplier_at", null)
    .eq("order.payment_state", "paid")
    .order("created_at", { ascending: true })
    .returns<Row[]>();
  if (error) throw new Error(error.message);
  const bySupplier = new Map<string, UnsentPart[]>();
  for (const r of data ?? []) {
    if (!r.order) continue;
    const list = bySupplier.get(r.supplier_id) ?? [];
    list.push({ id: r.id, created_at: r.created_at, order_no: r.order.order_no, buyer_name: r.order.buyer_name, ship_address: r.order.ship_address, ship_country: r.order.ship_country, items: r.items });
    bySupplier.set(r.supplier_id, list);
  }
  return bySupplier;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The exact text and html of one supplier's email. No prices, no payment details, no buyer email or phone. */
export function buildEmail(date: string, parts: UnsentPart[]) {
  const itemCount = parts.reduce((n, p) => n + p.items.reduce((m, i) => m + i.quantity, 0), 0);
  const text: string[] = [`Orders for ${date}`, ""];
  const rows: string[] = [];
  for (const p of parts) {
    const where = `${p.buyer_name}, ${p.ship_address}, ${p.ship_country}`;
    for (const i of p.items) {
      const line = [i.product_name, i.size, i.colour].filter(Boolean).join(" / ");
      text.push(`${p.order_no} | ${i.quantity} x ${line} | ship to: ${where}`);
      rows.push(`<tr><td>${esc(p.order_no)}</td><td>${i.quantity}</td><td>${esc(i.product_name)}</td><td>${esc(i.size ?? "")}</td><td>${esc(i.colour ?? "")}</td><td>${esc(where)}</td></tr>`);
    }
  }
  const total = `${parts.length} order part${parts.length === 1 ? "" : "s"}, ${itemCount} item${itemCount === 1 ? "" : "s"}.`;
  text.push("", total);
  const html = `<p>Orders for ${esc(date)}</p><table border="1" cellpadding="4" cellspacing="0"><tr><th>Order</th><th>Qty</th><th>Product</th><th>Size</th><th>Colour</th><th>Ship direct to</th></tr>${rows.join("")}</table><p>${total}</p>`;
  return { subject: `Orders for ${date}`, text: text.join("\n"), html };
}

export type SupplierRun = { supplier: string; outcome: "sent" | "no_address" | "send_failed" | "mail_off"; parts: number; note?: string };

async function deliver(to: string, mail: ReturnType<typeof buildEmail>): Promise<{ ok: true } | { ok: false; reason: "mail_off" | "send_failed"; note: string }> {
  const env = workerEnv();
  if (env?.STATUS_ALERT_MAIL && env.STATUS_ALERT_FROM) {
    try {
      await env.STATUS_ALERT_MAIL.send({ from: { email: env.STATUS_ALERT_FROM, name: "Lanna Care" }, to, subject: mail.subject, text: mail.text, html: mail.html });
      return { ok: true };
    } catch (err) {
      const e = err as { code?: string; message?: string };
      return { ok: false, reason: "send_failed", note: String(e?.code ?? e?.message ?? err).slice(0, 200) };
    }
  }
  if (!env && getAppEnv() === "dev") {
    console.log(`merch-supplier-emails: [logged, not mailed] to ${to}\nSubject: ${mail.subject}\n\n${mail.text}`);
    return { ok: true };
  }
  return { ok: false, reason: "mail_off", note: "no mail binding here (not running on the Worker)" };
}

/** One daily run. Never throws for one supplier's failure: each is reported, and the others still go. */
export async function runSupplierEmails(now = new Date()): Promise<SupplierRun[]> {
  const db = createAdminClient();
  const date = now.toISOString().slice(0, 10);
  const grouped = await unsentParts(db);
  const results: SupplierRun[] = [];
  for (const [supplierId, parts] of grouped) {
    const { data: sup } = await db.from("suppliers").select("name, email, delivery_method").eq("id", supplierId).single();
    const name = sup?.name ?? supplierId;
    if (!sup || sup.delivery_method !== "daily_email") continue;
    if (!sup.email) {
      results.push({ supplier: name, outcome: "no_address", parts: parts.length });
      continue;
    }
    const mail = buildEmail(date, parts);
    const ids = parts.map((p) => p.id);
    const { data: log, error: le } = await db
      .from("merch_supplier_emails")
      .insert({ supplier_id: supplierId, sent_to: sup.email, part_count: parts.length, body: mail.text })
      .select("id")
      .single();
    if (le || !log) {
      results.push({ supplier: name, outcome: "send_failed", parts: parts.length, note: "could not write the log row" });
      continue;
    }
    // Claim: the conditions are the guard against a part going out twice.
    const sentAt = new Date().toISOString();
    const { data: claimed, error: ce } = await db
      .from("merch_order_parts")
      .update({ status: "sent_to_supplier", sent_to_supplier_at: sentAt, supplier_email_id: log.id })
      .in("id", ids)
      .eq("status", "new")
      .is("sent_to_supplier_at", null)
      .select("id");
    const claimedIds = (claimed ?? []).map((c) => c.id as string);
    const undo = async () => {
      if (claimedIds.length) await db.from("merch_order_parts").update({ status: "new", sent_to_supplier_at: null, supplier_email_id: null }).in("id", claimedIds);
      await db.from("merch_supplier_emails").delete().eq("id", log.id);
    };
    if (ce || claimedIds.length !== ids.length) {
      // Someone else (a second run) took some of them: send nothing, release what we hold.
      await undo();
      results.push({ supplier: name, outcome: "send_failed", parts: parts.length, note: "parts changed during the run; nothing sent" });
      continue;
    }
    const sent = await deliver(sup.email, mail);
    if (!sent.ok) {
      await undo();
      results.push({ supplier: name, outcome: sent.reason, parts: parts.length, note: sent.note });
      continue;
    }
    results.push({ supplier: name, outcome: "sent", parts: parts.length });
  }
  return results;
}
