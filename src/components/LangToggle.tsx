"use client";
import { useEffect, useState } from "react";

// A small, discrete English | Español toggle pinned to the top-right of every page. It stores the
// choice in a `fellow_lang` cookie and reloads so the choice takes effect. Today that language
// preference drives Ask Fellow (Phase 0); it's also the same control that will switch the whole
// site once locale routing (/es) lands in Phase 1 — no URL change here, so nothing 404s.
type Lang = "en" | "es";

function currentLang(): Lang {
  if (typeof document !== "undefined") {
    const m = document.cookie.match(/(?:^|;\s*)fellow_lang=(en|es)/);
    if (m) return m[1] as Lang;
    if (typeof navigator !== "undefined" && /^es/i.test(navigator.language || "")) return "es";
  }
  return "en";
}

export default function LangToggle() {
  // Render nothing until mounted so the server HTML and first client paint match (the choice lives
  // in a cookie/navigator that the server can't see) — avoids a hydration mismatch.
  const [lang, setLang] = useState<Lang | null>(null);
  useEffect(() => { setLang(currentLang()); }, []);
  if (lang === null) return null;

  const choose = (l: Lang) => {
    if (l === lang) return;
    document.cookie = `fellow_lang=${l};path=/;max-age=31536000;samesite=lax`;
    location.reload();
  };

  return (
    <div className="lang-toggle" role="group" aria-label={lang === "es" ? "Idioma" : "Language"}>
      <button type="button" className={lang === "en" ? "on" : ""} aria-pressed={lang === "en"} onClick={() => choose("en")}>English</button>
      <span aria-hidden>|</span>
      <button type="button" className={lang === "es" ? "on" : ""} aria-pressed={lang === "es"} onClick={() => choose("es")} lang="es">Español</button>
    </div>
  );
}
