import { Icon } from "@/components/Icon";
import { soberLinks } from "@/lib/sober";

// The "Beyond the meetings" section — a quiet block at the foot of city / state / fellowship
// pages that points people toward sober meetups, alcohol-free nightlife and sober-community
// events. Fellow lists none of these directly (see lib/sober.ts for the safety rationale); it
// hands off to trusted directories and, on city pages, pre-filled platform searches.
export function SoberActivities({ city, state, stateName }: { city?: string; state?: string; stateName?: string }) {
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
        meetups, alcohol-free nightlife and sober-community events{place ? ` near ${place}` : ""} —
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
