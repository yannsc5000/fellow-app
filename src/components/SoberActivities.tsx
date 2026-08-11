import { Icon } from "@/components/Icon";
import { soberLinks } from "@/lib/sober";
import { BY_CODE } from "@/lib/fellowships";

// The "Beyond the meetings" section — a quiet block that points people toward sober meetups,
// alcohol-free nightlife and sober-community events. This content is specific to the
// substance-recovery family (alcohol & drugs), so on a fellowship page it renders ONLY for that
// group — never on ACA, OA, GA, etc., which need their own fellowship-appropriate adjacent
// content. On cross-fellowship city/state pages (no `fellowship` given) it always renders, since
// those places have AA/NA meetings. Fellow lists none of these events directly (see lib/sober.ts).
export function SoberActivities({ city, state, stateName, fellowship }:
  { city?: string; state?: string; stateName?: string; fellowship?: string }) {
  // Gate: on a fellowship page, only the alcohol & drugs family gets the sober section.
  if (fellowship && BY_CODE[fellowship]?.group !== "Alcohol & drugs") return null;
  const { place, directories, platforms } = soberLinks({ city, state, stateName });
  const hasPlatforms = platforms.length > 0;

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
      <span className="sober-eyebrow">Beyond the meetings</span>
      <h2 id="sober-h" className="sober-h">Sober activities{place ? ` in ${place}` : ""}</h2>
      <p className="sober-lede">
        Recovery is bigger than the meeting room. These communities and searches surface sober
        social events{place ? ` in ${place}` : ""}, alcohol-free nightlife and sober meetups —
        across every fellowship, not just 12-step.
      </p>

      <div className="sober-grp">Sober communities &amp; guides</div>
      <div className="sober-cards">{directories.map(Card)}</div>

      {hasPlatforms && (
        <>
          <div className="sober-grp">Search the big platforms</div>
          <div className="sober-cards">{platforms.map(Card)}</div>
        </>
      )}

      <p className="sober-note">
        <span className="sn-i"><Icon name="info" size={17} /></span>
        <span>
          {hasPlatforms ? (
            <>These are independent listings — <b>Fellow doesn’t vet them.</b> The big-platform
            searches can surface the occasional drinking event, so please confirm something is
            alcohol-free before you go.</>
          ) : (
            <>These are independent, sober-focused communities — <b>Fellow doesn’t vet them,</b> so
            confirm details before you go. Each one has its own tools for finding events near you.</>
          )}
        </span>
      </p>
    </section>
  );
}
