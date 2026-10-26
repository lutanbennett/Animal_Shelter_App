import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refuseFor } from "@/lib/auth/require-role";
import { loadPermissions } from "@/lib/permissions/load";
import { CARDS, CARD_KEYS } from "@/lib/permissions/cards";
import { TWO_STEP_PATH, hasTwoStep } from "@/lib/auth/two-step";
import { WHO_DOES_WHAT_PATH, opensWhoDoesWhat } from "@/lib/permissions/who-does-what";
import { getT } from "@/lib/i18n/get-t";
import { FeaturesPanel } from "../FeaturesPanel";

/**
 * Settings → Who does what → Features: the areas the Available cards are sectioned by, moved off the cards page onto
 * its own page, one tap away like Details (docs/decisions/2026-10-26-who-does-what-features-page.md). The panel is
 * unchanged and so is who may use it: Admin edits behind the authenticator-app step, a role holding the Who does what
 * card sees it read-only (actions.ts holds the rules on the server). Nothing here changes what any role can do.
 */
export default async function WhoDoesWhatFeaturesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const perms = await loadPermissions();
  if (!opensWhoDoesWhat(perms)) refuseFor(perms);

  const { t } = await getT();
  const w = t.admin.whoDoesWhat;
  const c = w.cardsView;
  const isAdmin = !!perms?.isAdmin;
  const canEdit = isAdmin && (await hasTwoStep());

  const admin = createAdminClient();
  const [{ data: featureRows, error: featuresError }, { data: cardFeatureRows, error: cardFeaturesError }] = await Promise.all([
    admin.from("features").select("id, name, name_th, position").order("position").order("name"),
    admin.from("card_features").select("card, feature_id"),
  ]);
  const loadError = featuresError ?? cardFeaturesError;
  if (loadError) throw new Error(`Who does what: ${loadError.message}`);
  const features = (featureRows ?? []).map((x) => ({ id: x.id as string, name: x.name as string, nameTh: (x.name_th as string | null) ?? "" }));
  const featureIds = new Set(features.map((x) => x.id));
  const featureOf = new Map((cardFeatureRows ?? []).map((r) => [r.card as string, r.feature_id && featureIds.has(r.feature_id as string) ? (r.feature_id as string) : null]));

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="min-w-0">
        <Link href={WHO_DOES_WHAT_PATH} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
          {c.backToCards}
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{w.features.panelHeading}</h1>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        {!isAdmin && <p className="text-muted">{c.readOnly}</p>}
        {isAdmin && !canEdit && (
          <p className="text-foreground">
            {c.verifyPrompt}{" "}
            <Link href={TWO_STEP_PATH} className="font-medium text-primary underline">
              {c.verifyLink}
            </Link>
          </p>
        )}
      </div>

      <FeaturesPanel
        features={features}
        cards={CARD_KEYS.map((k) => ({ key: k, label: CARDS[k].label(t), feature: featureOf.get(k) ?? null }))}
        canEdit={canEdit}
        locked={isAdmin && !canEdit}
      />
    </main>
  );
}
