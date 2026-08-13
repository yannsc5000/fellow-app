"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// Shared site footer — on every page, so links are locale-aware (keep the current /es prefix) and
// the labels come from the message catalog. A client component so pages that aren't otherwise
// translated yet stay statically rendered (translations come from the provider in the layout).
export function SiteFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <p className="foot-links">
        <Link href="/">{t("findMeeting")}</Link> · <Link href="/support-groups">{t("supportGroups")}</Link> ·{" "}
        <Link href="/meetings">{t("meetingsByCity")}</Link> · <Link href="/fellowships">{t("fellowships")}</Link> ·{" "}
        <Link href="/coverage">{t("coverageMap")}</Link> · <Link href="/about">{t("about")}</Link> ·{" "}
        <Link href="/about#privacy">{t("privacy")}</Link>
      </p>
      <p className="foot-blurb">{t("blurb", { year })}</p>
    </footer>
  );
}
