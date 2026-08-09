import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Fellow — find a meeting, find your people",
  description: "Find AA, NA, SLAA and other recovery meetings near you.",
  applicationName: "Fellow",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Fellow" },
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
      </body>
    </html>
  );
}
