import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n/get-t";
import { loadAdopterScope } from "@/lib/adopter/scope";
import { SignOutButton } from "../login/SignOutButton";
import { AdopterUpdateForm } from "./AdopterUpdateForm";

export const metadata: Metadata = { robots: { index: false } };

type OwnRow = { id: string; resident_id: string; received_on: string; note: string | null; text_approval: string | null };

/**
 * /adopter-update: where a signed-in adopter sends news about the animal they adopted. Not a staff page and not a public
 * one: the proxy lets a login with no staff card reach it only when its verified email is a live contact, and this page
 * asks again. An adopter sees their OWN rows (sender_contact_id is theirs), never public_adoption_updates.
 */
export default async function AdopterUpdatePage() {
  const supabase = await createClient();
  const [{ t }, scope] = await Promise.all([getT(), loadAdopterScope(supabase)]);
  if (!scope) redirect("/login?error=no_role");
  const a = t.adopterUpdate;

  const admin = createAdminClient();
  const contactIds = [...new Set(scope.residents.map((r) => r.contactId))];
  const { data: rows } = contactIds.length
    ? await admin
        .from("adoption_updates")
        .select("id, resident_id, received_on, note, text_approval")
        .in("sender_contact_id", contactIds)
        .eq("channel", "app")
        .order("created_at", { ascending: false })
        .returns<OwnRow[]>()
    : { data: [] as OwnRow[] };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{a.pageTitle}</h1>
          <p className="mt-1 text-sm text-muted">{a.intro}</p>
        </div>
        <SignOutButton className="whitespace-nowrap rounded py-1 text-sm font-medium text-foreground hover:text-primary" />
      </header>
      {scope.residents.length === 0 && <p className="text-base text-foreground">{a.noAnimals}</p>}
      {scope.residents.map((r) => {
        const own = (rows ?? []).filter((x) => x.resident_id === r.residentId);
        return (
          <section key={r.residentId} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
            <h2 className="text-lg font-semibold text-foreground">{r.name}{r.code ? ` (${r.code})` : ""}</h2>
            <AdopterUpdateForm residentId={r.residentId} />
            {own.length > 0 && (
              <ul className="flex flex-col gap-2">
                {own.map((u) => (
                  <li key={u.id} className="rounded border border-border p-3 text-sm">
                    <p className="text-muted">
                      {u.received_on} · {u.text_approval === "public_ok" ? a.statusApproved : u.text_approval === "private_only" ? a.statusPrivate : a.statusWaiting}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-foreground">{u.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}
