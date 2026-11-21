import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/get-t";
import { isPlatformHostname, platformHost, requestHost } from "@/lib/site-hosts";

/**
 * The product page (#apxld): what a stranger at cooperjaidee.org lands on. Static words only. It reads no table and
 * lists no shelter or account, so it cannot be used to find out which exist. Unlike the rest of /platform it is
 * indexable, because it is the product's home page. Every link is a plain link; none is an action that needs a card.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const a = t.admin.productAdmin.about;
  return { title: t.admin.productAdmin.platformName, description: a.metaDescription, robots: { index: true, follow: true } };
}

const link = "inline-block rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:text-primary";

export default async function AboutPage() {
  const h = await headers();
  if (platformHost() && !isPlatformHostname(requestHost((n) => h.get(n)) ?? "")) notFound();
  const { t } = await getT();
  const a = t.admin.productAdmin.about;
  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <div className="max-w-prose">
        <h1 className="text-3xl font-semibold text-foreground">{a.heading}</h1>
        <p className="mt-2 text-foreground">{a.lead}</p>
      </div>
      <section className="max-w-prose">
        <h2 className="text-xl font-semibold text-foreground">{a.whatTitle}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">
          {a.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>
      <section className="max-w-prose">
        <h2 className="text-xl font-semibold text-foreground">{a.whoTitle}</h2>
        <p className="mt-2 text-foreground">{a.who}</p>
      </section>
      <section className="max-w-prose">
        <h2 className="text-xl font-semibold text-foreground">{a.joinTitle}</h2>
        <p className="mt-2 text-foreground">{a.joinText}</p>
        <a href="/platform/enquire" className={`${link} mt-3 bg-primary !text-white`}>
          {a.enquire}
        </a>
      </section>
      <section className="max-w-prose">
        <h2 className="text-xl font-semibold text-foreground">{a.signInTitle}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href="/login" className={link}>
            {a.signInShelter}
          </a>
          <a href="/login?next=%2Fplatform%2Fshelters" className={link}>
            {a.signInChooser}
          </a>
          <a href="/login?next=%2Fplatform" className={link}>
            {a.signInAdmin}
          </a>
        </div>
      </section>
    </main>
  );
}
