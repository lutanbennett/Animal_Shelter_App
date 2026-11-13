import Link from "next/link";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { unsentParts } from "@/lib/merch/supplier-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveProduct, saveVariant, setProductState } from "./actions";

/**
 * The merchandise shop, staff side (docs/merch-shop.md). Gated on merch.manage, the activity its card (run_merch_shop)
 * carries. Three tabs in one page: orders, catalogue, supplier email. Every control is drawn only when the login holds
 * merch.manage at edit, which is what each action in ./actions.ts asks.
 */

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_thb: number;
  postage_thailand_thb: number;
  postage_overseas_thb: number;
  supplier_id: string | null;
  photo_drive_file_id: string | null;
  shown: boolean;
  archived_at: string | null;
  variants: { id: string; size: string | null; colour: string | null; shelter_stock: number; shown: boolean }[];
};

const inputClass = "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";
const buttonClass = "rounded border border-border bg-surface px-3 py-1 text-sm font-medium text-foreground hover:border-primary";
const primaryClass = "rounded bg-primary px-3 py-1 text-sm font-medium text-white";

export default async function MerchShopPage(props: PageProps<"/management/merch-shop">) {
  const { supabase, perms } = await requirePermission("merch.manage", "read");
  const { t } = await getT();
  const m = t.merchStaff;
  const sp = await props.searchParams;
  const tab = sp.tab === "catalogue" ? "catalogue" : sp.tab === "email" ? "email" : "orders";
  const canEdit = can(perms, "merch.manage", "edit");
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const ok = str(sp.ok);
  const err = str(sp.err);

  const tabs: [string, string][] = [
    ["orders", m.tabOrders],
    ["catalogue", m.tabCatalogue],
    ["email", m.tabEmail],
  ];

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.nav.merchShop}</h1>
        <p className="text-sm text-muted">{m.subtitle}</p>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label={m.title}>
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={`/management/merch-shop?tab=${key}`}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${tab === key ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted hover:text-foreground"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {ok && (
        <p role="status" className="text-sm text-success">
          {m.ok[ok as keyof typeof m.ok] ?? m.ok.saved}
        </p>
      )}
      {err && (
        <p role="alert" className="text-sm text-danger">
          {m.err[err as keyof typeof m.err] ?? m.err.failed}
        </p>
      )}
      {tab === "orders" && <Orders supabase={supabase} q={str(sp.q)} state={str(sp.state)} />}
      {tab === "catalogue" && <Catalogue supabase={supabase} canEdit={canEdit} />}
      {tab === "email" && <EmailTab supabase={supabase} />}
    </main>
  );
}

type Db = Awaited<ReturnType<typeof requirePermission>>["supabase"];

async function Orders({ supabase, q, state }: { supabase: Db; q: string; state: string }) {
  const { t } = await getT();
  const m = t.merchStaff;
  let query = supabase
    .from("merch_orders")
    .select("id, order_no, buyer_name, total_thb, total_charged, currency, payment_state, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (state === "awaiting" || state === "paid" || state === "cancelled") query = query.eq("payment_state", state);
  // Search by number or name; the characters PostgREST's filter syntax uses are removed rather than escaped.
  const term = q.replace(/[,()*%\\]/g, " ").trim();
  if (term) query = query.or(`order_no.ilike.%${term}%,buyer_name.ilike.%${term}%`);
  const { data, error } = await query;
  const states: [string, string][] = [
    ["", m.all],
    ["awaiting", m.state.awaiting],
    ["paid", m.state.paid],
    ["cancelled", m.state.cancelled],
  ];
  return (
    <section className="flex flex-col gap-3">
      <form method="get" className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="tab" value="orders" />
        <label className="flex flex-col text-xs text-muted">
          {m.search}
          <input name="q" defaultValue={q} placeholder={m.searchPlaceholder} className={inputClass} />
        </label>
        <label className="flex flex-col text-xs text-muted">
          {m.colState}
          <select name="state" defaultValue={state} className={inputClass}>
            {states.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={buttonClass}>
          {m.searchButton}
        </button>
      </form>
      {error && <p className="text-sm text-danger">{m.err.failed}</p>}
      {!error && !data?.length && <p className="text-sm text-muted">{m.noOrders}</p>}
      {!!data?.length && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 pr-3">{m.colOrder}</th>
                <th className="py-1 pr-3">{m.colBuyer}</th>
                <th className="py-1 pr-3">{m.colTotal}</th>
                <th className="py-1 pr-3">{m.colState}</th>
                <th className="py-1 pr-3">{m.colPlaced}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="py-1 pr-3">
                    <Link href={`/management/merch-shop/order/${o.id}`} className="font-medium text-primary underline">
                      {o.order_no}
                    </Link>
                  </td>
                  <td className="py-1 pr-3">{o.buyer_name}</td>
                  <td className="py-1 pr-3">
                    {Number(o.total_thb).toLocaleString()} THB{o.currency !== "THB" ? ` (${o.total_charged} ${o.currency})` : ""}
                  </td>
                  <td className="py-1 pr-3">{m.state[o.payment_state as keyof typeof m.state] ?? o.payment_state}</td>
                  <td className="py-1 pr-3">{new Date(o.created_at).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

async function Catalogue({ supabase, canEdit }: { supabase: Db; canEdit: boolean }) {
  const { t } = await getT();
  const m = t.merchStaff;
  const [products, suppliers] = await Promise.all([
    supabase
      .from("merch_products")
      .select("id, name, description, price_thb, postage_thailand_thb, postage_overseas_thb, supplier_id, photo_drive_file_id, shown, archived_at, variants:merch_variants(id, size, colour, shelter_stock, shown)")
      .order("sort_order")
      .order("created_at")
      .returns<Product[]>(),
    supabase.from("suppliers").select("id, name").is("archived_at", null).order("name").returns<{ id: string; name: string }[]>(),
  ]);
  const list = products.data ?? [];
  const supplierOptions = suppliers.data ?? [];
  const productForm = (p?: Product) => (
    <form action={saveProduct} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {p && <input type="hidden" name="id" value={p.id} />}
      <label className="flex flex-col text-xs text-muted">
        {m.name}
        <input name="name" required defaultValue={p?.name ?? ""} className={inputClass} />
      </label>
      <label className="flex flex-col text-xs text-muted">
        {m.supplier}
        <select name="supplierId" defaultValue={p?.supplier_id ?? ""} className={inputClass}>
          <option value="">{m.noSupplier}</option>
          {supplierOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs text-muted sm:col-span-2">
        {m.description}
        <textarea name="description" rows={2} defaultValue={p?.description ?? ""} className={inputClass} />
      </label>
      <label className="flex flex-col text-xs text-muted">
        {m.price}
        <input name="price" type="number" min="0" step="0.01" required defaultValue={p?.price_thb ?? ""} className={inputClass} />
      </label>
      <label className="flex flex-col text-xs text-muted">
        {m.photo}
        <input name="photo" defaultValue={p?.photo_drive_file_id ?? ""} className={inputClass} />
      </label>
      <label className="flex flex-col text-xs text-muted">
        {m.postageThailand}
        <input name="postageThailand" type="number" min="0" step="0.01" required defaultValue={p?.postage_thailand_thb ?? ""} className={inputClass} />
      </label>
      <label className="flex flex-col text-xs text-muted">
        {m.postageOverseas}
        <input name="postageOverseas" type="number" min="0" step="0.01" required defaultValue={p?.postage_overseas_thb ?? ""} className={inputClass} />
      </label>
      <div className="sm:col-span-2">
        <button type="submit" className={primaryClass}>
          {p ? m.save : m.addProduct}
        </button>
      </div>
    </form>
  );

  return (
    <section className="flex flex-col gap-4">
      {products.error && <p className="text-sm text-danger">{m.err.failed}</p>}
      {canEdit && (
        <details className="rounded border border-border bg-surface p-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground">{m.addProduct}</summary>
          <div className="mt-3">{productForm()}</div>
        </details>
      )}
      {!list.length && <p className="text-sm text-muted">{m.noProducts}</p>}
      {list.map((p) => (
        <article key={p.id} className="flex flex-col gap-3 rounded border border-border bg-surface p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-foreground">
              {p.name}{" "}
              <span className="text-xs font-normal text-muted">
                {p.archived_at ? m.archived : p.shown ? m.shownLabel : m.hiddenLabel} · {Number(p.price_thb).toLocaleString()} THB
              </span>
            </h2>
            {canEdit && (
              <div className="flex gap-2">
                {!p.archived_at && (
                  <form action={setProductState}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="what" value={p.shown ? "hide" : "show"} />
                    <button type="submit" className={buttonClass}>
                      {p.shown ? m.hide : m.show}
                    </button>
                  </form>
                )}
                <form action={setProductState}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="what" value={p.archived_at ? "restore" : "archive"} />
                  <button type="submit" className={buttonClass}>
                    {p.archived_at ? m.restore : m.archive}
                  </button>
                </form>
              </div>
            )}
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 pr-3">{m.size}</th>
                <th className="py-1 pr-3">{m.colour}</th>
                <th className="py-1 pr-3">{m.stock}</th>
                <th className="py-1 pr-3">{m.shownLabel}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {p.variants.map((v) => (
                <tr key={v.id} className="border-t border-border">
                  <td className="py-1 pr-3">{v.size ?? "-"}</td>
                  <td className="py-1 pr-3">{v.colour ?? "-"}</td>
                  {canEdit ? (
                    <>
                      <td colSpan={3} className="py-1">
                        <form action={saveVariant} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={v.id} />
                          <input name="stock" type="number" min="0" step="1" defaultValue={v.shelter_stock} aria-label={m.stock} className={`${inputClass} w-24`} />
                          <label className="flex items-center gap-1 text-xs text-muted">
                            <input type="checkbox" name="shown" defaultChecked={v.shown} /> {m.shownLabel}
                          </label>
                          <button type="submit" className={buttonClass}>
                            {m.save}
                          </button>
                        </form>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-1 pr-3">{v.shelter_stock}</td>
                      <td className="py-1 pr-3">{v.shown ? m.yes : m.no}</td>
                      <td />
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {canEdit && (
            <details>
              <summary className="cursor-pointer text-sm text-primary">{m.addVariant}</summary>
              <form action={saveVariant} className="mt-2 flex flex-wrap items-end gap-2">
                <input type="hidden" name="productId" value={p.id} />
                <label className="flex flex-col text-xs text-muted">
                  {m.size}
                  <input name="size" className={inputClass} />
                </label>
                <label className="flex flex-col text-xs text-muted">
                  {m.colour}
                  <input name="colour" className={inputClass} />
                </label>
                <label className="flex flex-col text-xs text-muted">
                  {m.stock}
                  <input name="stock" type="number" min="0" step="1" defaultValue={0} className={inputClass} />
                </label>
                <label className="flex items-center gap-1 text-xs text-muted">
                  <input type="checkbox" name="shown" defaultChecked /> {m.shownLabel}
                </label>
                <button type="submit" className={buttonClass}>
                  {m.addVariant}
                </button>
              </form>
            </details>
          )}
          {canEdit && (
            <details>
              <summary className="cursor-pointer text-sm text-primary">{m.editProduct}</summary>
              <div className="mt-2">{productForm(p)}</div>
            </details>
          )}
        </article>
      ))}
    </section>
  );
}

async function EmailTab({ supabase }: { supabase: Db }) {
  const { t } = await getT();
  const m = t.merchStaff;
  // The list reads as the signed-in login (RLS: merch.manage read); the cron reads the same shape with the service role.
  const unsent = await unsentParts(supabase as unknown as ReturnType<typeof createAdminClient>).catch(() => null);
  const ids = unsent ? [...unsent.keys()] : [];
  const [sup, log] = await Promise.all([
    ids.length ? supabase.from("suppliers").select("id, name, email, delivery_method").in("id", ids).returns<{ id: string; name: string; email: string | null; delivery_method: string }[]>() : Promise.resolve({ data: [] as { id: string; name: string; email: string | null; delivery_method: string }[] }),
    supabase.from("merch_supplier_emails").select("id, sent_to, part_count, body, sent_at, supplier:suppliers(name)").order("sent_at", { ascending: false }).limit(50).returns<{ id: string; sent_to: string; part_count: number; body: string; sent_at: string; supplier: { name: string } | null }[]>(),
  ]);
  const byId = new Map((sup.data ?? []).map((s) => [s.id, s]));
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{m.unsentTitle}</h2>
        <p className="text-sm text-muted">{m.unsentHelp}</p>
        {unsent === null && <p className="text-sm text-danger">{m.err.failed}</p>}
        {unsent && unsent.size === 0 && <p className="text-sm text-muted">{m.unsentNone}</p>}
        {unsent &&
          [...unsent].map(([supplierId, parts]) => {
            const s = byId.get(supplierId);
            return (
              <div key={supplierId} className="rounded border border-border bg-surface p-3 text-sm">
                <p className="font-medium text-foreground">
                  {s?.name ?? supplierId} · {m.partsCount(parts.length)}
                </p>
                {!s?.email && (
                  <p role="alert" className="text-danger">
                    {m.noEmailAddress}
                  </p>
                )}
                <ul className="list-disc pl-5 text-muted">
                  {parts.map((p) => (
                    <li key={p.id}>
                      {p.order_no}: {p.items.map((i) => `${i.quantity} × ${[i.product_name, i.size, i.colour].filter(Boolean).join(" / ")}`).join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{m.logTitle}</h2>
        {!log.data?.length && <p className="text-sm text-muted">{m.logNone}</p>}
        {log.data?.map((e) => (
          <details key={e.id} className="rounded border border-border bg-surface p-3 text-sm">
            <summary className="cursor-pointer text-foreground">
              {new Date(e.sent_at).toLocaleString("en-GB")} · {e.supplier?.name ?? ""} · {e.sent_to} · {m.partsCount(e.part_count)}
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-muted">{e.body}</pre>
          </details>
        ))}
      </div>
    </section>
  );
}
