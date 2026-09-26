import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { loadSiteContent } from "@/lib/site/content";
import { PublicHeader } from "../adopt/PublicHeader";
import { PublicFooter } from "../adopt/PublicFooter";

/**
 * The privacy notice. Google requires a public privacy-policy URL before
 * the production sign-in app can leave "Testing" (docs/decisions.md), and
 * a shelter that keeps adopters' phone numbers should have one anyway.
 * The text lives in the dictionaries, not in site_pages: it is linked
 * from Google's consent screen, so it must not be blank-able from Admin.
 * The contact email is the one from site_content, so it stays right when
 * the shelter changes it.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [{ t, locale }, origin] = await Promise.all([getT(), getSiteOrigin()]);
  const title = `${t.privacy.title} · ${t.header.appName}`;
  return {
    title,
    description: t.privacy.intro,
    ...(origin ? { metadataBase: origin } : {}),
    openGraph: {
      type: "website",
      title,
      description: t.privacy.intro,
      url: "/privacy",
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
    },
  };
}

export default async function Page() {
  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const content = await loadSiteContent(supabase);
  const p = t.privacy;

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader />

      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 sm:px-12">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold text-foreground">{p.title}</h1>
          <p className="text-sm text-muted">{p.updated}</p>
        </header>
        <p className="text-lg text-foreground">{p.intro}</p>

        {p.sections.map((section, i) => (
          <section key={section.heading} data-reveal className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
            {section.paragraphs.map((text) => (
              <p key={text} className="text-foreground">
                {text}
              </p>
            ))}
            {/* "Your choices" ends with a colon; the contact goes right after it. */}
            {i === p.sections.length - 2 && (
              <p className="text-foreground">
                {content?.contact_email ? (
                  <a
                    href={`mailto:${content.contact_email}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {content.contact_email}
                  </a>
                ) : (
                  p.contactFallback
                )}
              </p>
            )}
          </section>
        ))}
      </article>

      <PublicFooter content={content} />
    </main>
  );
}
