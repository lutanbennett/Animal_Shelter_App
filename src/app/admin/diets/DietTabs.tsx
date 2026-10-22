import Link from "next/link";
import { getT } from "@/lib/i18n/get-t";

/** The two halves of Settings → Diets: the recipes, and the ingredients they are made of. */
export async function DietTabs({ active }: { active: "diets" | "ingredients" }) {
  const { t } = await getT();
  const s = t.admin.diets.tabs;
  const tab = (key: "diets" | "ingredients", href: string) => (
    <Link
      key={key}
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={`inline-flex min-h-11 flex-1 items-center justify-center rounded px-4 py-2 text-sm font-medium md:flex-none md:min-h-0 ${
        active === key ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-surface-hover"
      }`}
    >
      {s[key]}
    </Link>
  );
  return (
    <nav aria-label={s.label} className="flex gap-2">
      {tab("diets", "/admin/diets")}
      {tab("ingredients", "/admin/diets/ingredients")}
    </nav>
  );
}
