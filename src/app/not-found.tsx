import Link from "next/link";

export const metadata = { title: "Page not found — Fellow" };

// ROOT 404 (rendered by Next as /_not-found) for paths that don't match the [locale] segment.
// It sits OUTSIDE [locale], so there is NO NextIntlClientProvider and no request locale here — it
// must be fully self-contained and use ZERO next-intl APIs (getTranslations / useTranslations) or
// any i18n-dependent component (e.g. SiteFooter), otherwise prerendering /_not-found throws.
// Because the app has no root layout, this file renders its own <html>/<body>. Inline styles keep
// it independent of globals.css so it can never fail to render. (The localized 404 for in-locale
// paths lives in app/[locale]/not-found.tsx and keeps its translations.)
export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "#f5f2ea",
          color: "#1a1a1a",
        }}
      >
        <main style={{ maxWidth: 520, padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 68, fontWeight: 800, color: "#0f766e", letterSpacing: "-2px", lineHeight: 1 }}>404</div>
          <h1 style={{ fontSize: 24, margin: "14px 0 8px" }}>This page took a wrong turn</h1>
          <p style={{ color: "#555", fontSize: 16, margin: "0 0 26px", lineHeight: 1.5 }}>
            We couldn&rsquo;t find that one &mdash; but every meeting is just a search away.
          </p>
          <p style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", margin: 0 }}>
            <Link
              href="/"
              style={{ display: "inline-block", background: "#0f766e", color: "#fff", padding: "12px 22px", borderRadius: 10, textDecoration: "none", fontWeight: 600 }}
            >
              Start a new search
            </Link>
            <Link
              href="/meetings"
              style={{ display: "inline-block", background: "#fff", color: "#0f766e", padding: "12px 22px", borderRadius: 10, textDecoration: "none", fontWeight: 600, border: "1px solid #cfe0dc" }}
            >
              Browse meetings by city
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
