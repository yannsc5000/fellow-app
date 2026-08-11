import type { Metadata, Viewport } from "next";
// Nunito Sans — warm, rounded geometric-humanist. Self-hosted via Fontsource (font files ship
// in our bundle), so there's no request to Google Fonts from the user's browser.
import "@fontsource-variable/nunito-sans";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import LangToggle from "@/components/LangToggle";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  metadataBase: new URL("https://fellow.space"),
  title: "Fellow — find a meeting, find your people",
  description: "Find AA, NA, and other recovery meetings near you — 12-step fellowships and related peer-support programs, all in one place.",
  applicationName: "Fellow",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Fellow" },
  verification: {
    google: "AZ7CKel0W969wLS0rlYvlEpXarmSczeJYWTcUmUPJ7Y",
    other: { "msvalidate.01": "7E6561D41455669D0245550B6A8F5444" }, // Bing
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  category: "health",
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  colorScheme: "light dark",
};

const JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://fellow.space/#org",
      name: "Fellow",
      url: "https://fellow.space",
      logo: "https://fellow.space/icon-512.png",
      description: "A free, independent, non-commercial finder for 12-step and related peer-support recovery meetings across the US.",
      areaServed: "US",
      nonprofitStatus: "Nonprofit",
      knowsAbout: [
        "Alcoholics Anonymous", "Narcotics Anonymous", "Al-Anon", "recovery meetings",
        "12-step programs", "addiction recovery", "peer support",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://fellow.space/#website",
      url: "https://fellow.space",
      name: "Fellow",
      description: "Find AA, NA, and other recovery meetings near you.",
      publisher: { "@id": "https://fellow.space/#org" },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://fellow.space/?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

const TS_HOST = process.env.NEXT_PUBLIC_TYPESENSE_HOST;
const TS_ORIGIN = TS_HOST && TS_HOST !== "localhost" ? `https://${TS_HOST}` : null;

// English is pre-rendered statically (as before). Spanish long-tail pages render on demand (see the
// per-route generateStaticParams). This layout is generated for both locales.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        {TS_ORIGIN && <link rel="preconnect" href={TS_ORIGIN} crossOrigin="anonymous" />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />
        <a href="#main-content" className="skip-link">Skip to content</a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LangToggle />
          {children}
        </NextIntlClientProvider>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
