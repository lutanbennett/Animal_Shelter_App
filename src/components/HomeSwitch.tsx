import Link from "next/link";
import type { HomeRole } from "@/lib/home/roles";
import { getT } from "@/lib/i18n/get-t";

/**
 * Admin's switch between home screens: Settings, then every role that has one (§8). It is how
 * the Director sees exactly what the 2IC sees when the 2IC rings to say something is wrong, so
 * it names the roles as they are, and lists whichever exist. Plain links, no script, wrapping
 * onto a second line at phone width.
 *
 * It is drawn only for Admin, and that is cosmetic: /home/[role] refuses everyone else itself.
 * `current` is "settings" or a role key.
 */
export async function HomeSwitch({ roles, current }: { roles: HomeRole[]; current: string }) {
  const { t, locale } = await getT();
  const items = [
    { key: "settings", href: "/admin", label: t.appHome.settings },
    ...roles.map((r) => ({ key: r.key, href: `/home/${r.key}`, label: (locale === "th" && r.nameTh) || r.name })),
  ];
  return (
    <nav aria-label={t.appHome.switchLabel} className="flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{t.appHome.switchLabel}</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.key} className="min-w-0">
            <Link
              href={item.href}
              aria-current={item.key === current ? "page" : undefined}
              className={`block min-h-11 rounded-full border px-4 py-2.5 text-sm font-medium [overflow-wrap:anywhere] ${
                item.key === current
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground hover:bg-surface-hover"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
