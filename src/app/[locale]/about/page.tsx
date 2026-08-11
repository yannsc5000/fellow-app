import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { FELLOWSHIPS } from "@/lib/fellowships";
import { CONTACT_EMAIL } from "@/lib/config";
import { SiteFooter } from "@/components/SiteFooter";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "About & sources | Fellow",
  description: "How Fellow works, where its meeting data comes from, how it handles privacy and anonymity (including the Ask Fellow chat), and how to report a correction.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About & sources | Fellow",
    description: "How Fellow works, where its meeting data comes from, and how it handles privacy and anonymity.",
    url: "/about",
    type: "website",
  },
};

const CONTACT = `mailto:${CONTACT_EMAIL}`;

// Fellowship group keys map to lib group names; labels come from the `about` namespace.
const GROUPS: { key: string; group: string }[] = [
  { key: "groupAlcoholDrugs", group: "Alcohol & drugs" },
  { key: "groupFood", group: "Food & eating" },
  { key: "groupSex", group: "Sex & relationships" },
  { key: "groupMoney", group: "Money & work" },
  { key: "groupEmotional", group: "Emotional & behavioral" },
  { key: "groupFamily", group: "Family & friends" },
];

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const byGroup = GROUPS.map((g) => ({ ...g, list: FELLOWSHIPS.filter((f) => f.group === g.group) })).filter((x) => x.list.length);
  return (
    <main className="app prose" id="main-content">
      <p style={{ margin: "20px 0 8px" }}><a href="/" className="back">{t("back")}</a></p>
      <h1>{t("h1")}</h1>

      <p>{t("p1")}</p>
      <p>{t.rich("p2", { b: (ch) => <strong>{ch}</strong> })}</p>

      <h2>{t("hSources")}</h2>
      <p>{t("sourcesLead")}</p>
      <ul>
        <li>
          <strong>{t("tsmlName")}</strong> {t("tsmlDesc")}{" "}
          <a href="https://code4recovery.org/" target="_blank" rel="noopener">{t("tsmlOrg")} <Icon name="external" size={13} className="link-ext" /></a>{t("tsmlDesc2")}
        </li>
        <li>
          <strong>{t("bmltName")}</strong> {t("bmltDesc")}{" "}
          <a href="https://bmlt.app/" target="_blank" rel="noopener">{t("bmltOrg")} <Icon name="external" size={13} className="link-ext" /></a>{t("bmltDesc2")}
        </li>
      </ul>
      <p>{t.rich("sourcesOutro", { a: (ch) => <a href={CONTACT}>{ch}</a> })}</p>

      <h3>{t("hIncluded")}</h3>
      <p>{t("includedLead")}</p>
      {byGroup.map(({ key, group, list }) => (
        <p key={group} style={{ margin: "6px 0" }}>
          <strong>{t(key)}:</strong> {list.map((f) => f.name).join(", ")}.
        </p>
      ))}
      <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>{t("includedNote")}</p>

      <h2 id="privacy">{t("hPrivacy")}</h2>
      <p>{t("privacyLead")}</p>
      <ul>
        <li><strong>{t("privLocationB")}</strong> {t("privLocation")}</li>
        <li><strong>{t("privNoDataB")}</strong> {t("privNoData")}</li>
        <li>
          <strong>{t("privChatB")}</strong> {t("privChat1")}
          <a href="https://www.anthropic.com/" target="_blank" rel="noopener">Anthropic <Icon name="external" size={13} className="link-ext" /></a>
          {t("privChat2")}
        </li>
        <li><strong>{t("privMapsB")}</strong> {t("privMaps")}</li>
      </ul>

      <h2>{t("hAccuracy")}</h2>
      <p>{t.rich("accuracy", { a: (ch) => <a href={CONTACT}>{ch}</a> })}</p>

      <h2>{t("hDisclaimer")}</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>{t("disclaimer")}</p>

      <p style={{ margin: "28px 0" }}><a href="/" className="back">{t("back")}</a></p>
      <SiteFooter />
    </main>
  );
}
