"use client";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

// A small, discrete English | Español toggle pinned to the top-right of every page. It switches the
// locale via routing (keeping you on the same page, e.g. /about → /es/about) and also drops a
// fellow_lang cookie so the Ask Fellow client island stays in the same language.
type Lang = "en" | "es";

export default function LangToggle() {
  const locale = useLocale() as Lang;
  const pathname = usePathname();
  const router = useRouter();

  const choose = (l: Lang) => {
    if (l === locale) return;
    document.cookie = `fellow_lang=${l};path=/;max-age=31536000;samesite=lax`;
    router.replace(pathname, { locale: l });
  };

  return (
    <div className="lang-toggle" role="group" aria-label={locale === "es" ? "Idioma" : "Language"}>
      <button type="button" className={locale === "en" ? "on" : ""} aria-pressed={locale === "en"} onClick={() => choose("en")}>English</button>
      <span aria-hidden>|</span>
      <button type="button" className={locale === "es" ? "on" : ""} aria-pressed={locale === "es"} onClick={() => choose("es")} lang="es">Español</button>
    </div>
  );
}
