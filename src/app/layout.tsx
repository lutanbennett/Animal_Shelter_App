import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Thai } from "next/font/google";
import { AppHeader } from "./AppHeader";
import { NavPane } from "./NavPane";
import { MobileNavProvider } from "./MobileNavContext";
import { PublicPathGate } from "./PublicPathGate";
import { getLocale } from "@/lib/i18n/get-locale";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "Lanna Care for Animals",
  description: "Resident and shelter management",
  icons: {
    icon: "/lca-logo.jpg",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale}>
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
        </I18nProvider>
      </body>
    </html>
  );
}
