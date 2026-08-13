import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/Icon";
import { Mark } from "@/components/Mark";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Page not found — Fellow" };

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const tc = await getTranslations("common");
  return (
    <main className="app" id="main-content">
      <header className="brand">
        <Link href="/" className="brand-link" aria-label={t("backAria")}>
          <div className="mark" aria-hidden><Mark size={52} logo /></div>
          <div>
            <h1>Fellow</h1>
            <div className="tagline">{tc("tagline")}</div>
          </div>
        </Link>
      </header>

      <section className="nf">
        <div className="nf-code" aria-hidden>404</div>
        <h2>{t("h2")}</h2>
        <p>{t("body")}</p>
        <div className="nf-actions">
          <Link href="/" className="btn btn-fc nf-cta" style={{ ["--fc" as string]: "var(--brand)" } as React.CSSProperties}>
            <Icon name="search" size={20} /> {t("startSearch")}
          </Link>
          <Link href="/meetings" className="btn btn-soft nf-cta">
            <Icon name="pin" size={18} /> {t("browseByCity")}
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
