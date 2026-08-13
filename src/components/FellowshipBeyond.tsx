import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/Icon";
import { beyondFor } from "@/lib/beyond";

// Fellowship-appropriate "beyond the meetings" section for the non-substance families (food,
// family, money/work, emotional & behavioral). Substance fellowships use SoberActivities instead,
// and Sex & relationships intentionally has no section — so this returns null for both. Reuses the
// sober section's styling (.sober*) for a consistent quiet, colored-chip list.
export async function FellowshipBeyond({ code }: { code: string }) {
  const section = beyondFor(code);
  if (!section) return null;
  const t = await getTranslations("sober");

  return (
    <section className="sober" aria-labelledby="beyond-h">
      <span className="sober-eyebrow">{t("eyebrow")}</span>
      <h2 id="beyond-h" className="sober-h">{section.heading}</h2>
      <p className="sober-lede">{section.lede}</p>

      <div className="sober-grp">{section.groupLabel}<span className="sober-grp-ln" /></div>
      <div className="sober-cards">
        {section.links.map((l) => (
          <a key={l.href} className="sober-card" href={l.href} target="_blank" rel="noopener nofollow" style={{ ["--pc" as any]: l.color }}>
            <span className="lx-cico"><Icon name={l.icon} size={18} /></span>
            <span className="lx-ctext">
              <b>{l.title}</b>
              <small>{l.sub}</small>
            </span>
            <Icon name="external" size={16} className="lx-ext" />
          </a>
        ))}
      </div>

      <p className="sober-note">
        <span className="sn-i"><Icon name="info" size={17} /></span>
        <span>{section.note}</span>
      </p>
    </section>
  );
}
