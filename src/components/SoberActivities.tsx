import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/Icon";
import { soberLinks } from "@/lib/sober";
import { BY_CODE } from "@/lib/fellowships";

// The "Beyond the meetings" section — a quiet block that points people toward sober meetups,
// alcohol-free nightlife and sober-community events. This content is specific to the
// substance-recovery family (alcohol & drugs), so on a fellowship page it renders ONLY for that
// group — never on ACA, OA, GA, etc., which need their own fellowship-appropriate adjacent
// content. On cross-fellowship city/state pages (no `fellowship` given) it always renders, since
// those places have AA/NA meetings. Fellow lists none of these events directly (see lib/sober.ts).
export async function SoberActivities({ city, state, stateName, fellowship }:
  { city?: string; state?: string; stateName?: string; fellowship?: string }) {
  // Gate: on a fellowship page, only the alcohol & drugs family gets the sober section.
  if (fellowship && BY_CODE[fellowship]?.group !== "Alcohol & drugs") return null;
  const { place, directories, platforms } = soberLinks({ city, state, stateName });
  const hasPlatforms = platforms.length > 0;
  const t = await getTranslations("sober");

  const Card = (l: { mark: string; color: string; title: string; sub: string; href: string }) => (
    <a key={l.href} className="sober-card" href={l.href} target="_blank" rel="noopener nofollow" style={{ ["--pc" as any]: l.color }}>
      <span className="lx-cico" aria-hidden>{l.mark}</span>
      <span className="lx-ctext">
        <b>{l.title}</b>
        <small>{l.sub}</small>
      </span>
      <Icon name="external" size={16} className="lx-ext" />
    </a>
  );

  return (
    <section className="sober" aria-labelledby="sober-h">
      <span className="sober-eyebrow">{t("eyebrow")}</span>
      <h2 id="sober-h" className="sober-h">{place ? t("hWithPlace", { place }) : t("h")}</h2>
      <p className="sober-lede">
        {place ? t("ledeWithPlace", { place }) : t("lede")}
      </p>

      <div className="sober-grp">{t("grpCommunities")}</div>
      <div className="sober-cards">{directories.map(Card)}</div>

      {hasPlatforms && (
        <>
          <div className="sober-grp">{t("grpPlatforms")}</div>
          <div className="sober-cards">{platforms.map(Card)}</div>
        </>
      )}

      <p className="sober-note">
        <span className="sn-i"><Icon name="info" size={17} /></span>
        <span>
          {hasPlatforms
            ? t.rich("notePlatforms", { b: (ch) => <b>{ch}</b> })
            : t.rich("noteNoPlatforms", { b: (ch) => <b>{ch}</b> })}
        </span>
      </p>
    </section>
  );
}
