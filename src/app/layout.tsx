import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  metadataBase: new URL("https://fellow.space"),
  title: "Fellow — find a meeting, find your people",
  description: "Find AA, NA, and other recovery meetings near you — 12-step fellowships and related peer-support programs, all in one place.",
  applicationName: "Fellow",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Fellow" },
  alternates: { canonical: "/" },
  verification: { google: "AZ7CKel0W969wLS0rlYvlEpXarmSczeJYWTcUmUPJ7Y" },
  openGraph: {
    title: "Fellow — find a meeting, find your people",
    description: "Find AA, NA, and other recovery meetings near you — 12-step and related peer-support programs, all in one place.",
    url: "/",
    siteName: "Fellow",
    type: "website",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Fellow" }],
  },
  twitter: {
    card: "summary",
    title: "Fellow — find a meeting, find your people",
    description: "Find AA, NA, and other recovery meetings near you.",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  colorScheme: "light dark",
};

// Structured data: tells search engines what Fellow is (Organization) and enables the
// sitelinks search box (WebSite + SearchAction → /?q=…). Keep in sync with the ?q= handling
// in page.tsx / Finder.tsx.
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />
        <a href="#main-content" className="skip-link">Skip to content</a>
        {children}
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
