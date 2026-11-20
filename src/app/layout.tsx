import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppHeader } from "./AppHeader";
import { NavPane } from "./NavPane";
import { MobileNavProvider } from "./MobileNavContext";
import { PublicPathGate } from "./PublicPathGate";
import { getLocale } from "@/lib/i18n/get-locale";
import { getAppEnv } from "@/lib/app-env";
import { getCurrentUser } from "@/lib/auth/current-user";
import { THEME_METADATA_KEY, parseTheme, themeAttribute } from "@/lib/theme/themes";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import { OfflineBanner } from "@/components/OfflineBanner";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { HydrationMark } from "./HydrationMark";
import { loadUnitList } from "@/lib/unit-list-server";
import { EARLY_SUBMIT_GUARD } from "@/lib/early-submit-guard";
import { shelterNames } from "@/lib/shelter-settings";
import "./globals.css";

const geistSans = localFont({
  src: "../../public/fonts/geist-latin-wght-normal.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

const geistMono = localFont({
  src: "../../public/fonts/geist-mono-latin-wght-normal.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

// Thai subset only: every font stack in globals.css puts a Latin family first,
// so this face is only ever asked for Thai characters.
const notoSansThai = localFont({
  src: "../../public/fonts/noto-sans-thai-thai-wght-normal.woff2",
  variable: "--font-noto-thai",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

// The public site's type (globals.css, "Public site"): Fraunces headings
// over Source Sans 3. Declared here because the tokens sit on :root, but
// not preloaded — the app's pages never use them, and a browser only
// downloads a face once text on the page asks for it.
const fraunces = localFont({
  src: "../../public/fonts/fraunces-latin-opsz-normal.woff2",
  variable: "--font-fraunces",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: false,
});

const sourceSans = localFont({
  src: "../../public/fonts/source-sans-3-latin-wght-normal.woff2",
  variable: "--font-source-sans",
  weight: "200 900",
  style: "normal",
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await shelterNames()).displayName,
    description: "Resident and shelter management",
    // THE PRODUCT'S mark, not the shelter's. CooperJaidee is the product; a shelter
    // keeps its own logo in the header and on its public site. Until 2026-11-20 this
    // was /lca-logo.jpg — the FIRST shelter's own photograph — so every tab, bookmark
    // and phone home screen wore that one shelter's logo, whichever shelter was being
    // served. It predates multi-tenancy and nothing flagged it when tenancy arrived.
    //
    // The svg is what a modern browser takes; the pngs are for the ones that do not,
    // and for a phone adding the app to a home screen. public/cooper-jaidee-icon.svg is
    // the source the pngs were rendered from, so they cannot drift apart.
    icons: {
      icon: [
        { url: "/cooper-jaidee-icon.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const units = await loadUnitList();
  const names = await shelterNames();
  // The person's colour theme, from their own user_metadata, rendered into
  // the HTML so the first paint is already theirs (src/lib/theme/themes.ts).
  // Signed out — the login page, the public site — is always the default.
  const user = await getCurrentUser();
  const theme = themeAttribute(parseTheme(user?.user_metadata?.[THEME_METADATA_KEY]));

  return (
    <html
      lang={locale}
      data-env={getAppEnv()}
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansThai.variable} ${fraunces.variable} ${sourceSans.variable} h-full antialiased [--app-header-h:4.25rem] md:scroll-pt-[var(--app-header-h)]`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: EARLY_SUBMIT_GUARD }} />
        <HydrationMark />
        <I18nProvider locale={locale} units={units} shelterNames={names}>
          <ConfirmProvider>
          <OfflineBanner />
          <MobileNavProvider>
            <PublicPathGate>
              <AppHeader />
            </PublicPathGate>
            {/* Each page's <main> is a flex item here, and a flex item's
                minimum width defaults to its content's — so a wide table
                (residents, on a phone) widened the whole document instead
                of scrolling inside its overflow-x-auto wrapper. min-w-0 on
                the main lets it shrink to the viewport; a few pages carry
                their own copy from before this was here. */}
            <div className="flex flex-1 [&>main]:min-w-0">
              <PublicPathGate>
                <NavPane />
              </PublicPathGate>
              {children}
            </div>
          </MobileNavProvider>
          </ConfirmProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
