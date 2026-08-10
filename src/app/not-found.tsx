import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Mark } from "@/components/Mark";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Page not found — Fellow" };

export default function NotFound() {
  return (
    <main className="app" id="main-content">
      <header className="brand">
        <Link href="/" className="brand-link" aria-label="Fellow — back to home">
          <div className="mark" aria-hidden><Mark size={50} /></div>
          <div>
            <h1>Fellow</h1>
            <div className="tagline">Find your people</div>
          </div>
        </Link>
      </header>

      <section className="nf">
        <div className="nf-code" aria-hidden>404</div>
        <h2>This page took a wrong turn</h2>
        <p>We couldn’t find that one — but every meeting is just a search away.</p>
        <div className="nf-actions">
          <Link href="/" className="btn btn-fc nf-cta" style={{ ["--fc" as string]: "var(--brand)" } as React.CSSProperties}>
            <Icon name="search" size={20} /> Start a new search
          </Link>
          <Link href="/meetings" className="btn btn-soft nf-cta">
            <Icon name="pin" size={18} /> Browse meetings by city
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
