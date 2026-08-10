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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
