import type { Metadata } from "next";
import Link from "next/link";
import { fellowshipColor, fellowshipName } from "@/lib/fellowships";
import { Icon } from "@/components/Icon";
import { Mark } from "@/components/Mark";
import { SiteFooter } from "@/components/SiteFooter";

// Landing page for a shared meeting link (fellow.space/m?…). It carries the rich Open Graph
// card (see generateMetadata → /api/share-card) so the link unfurls in Messages/Slack, and
// gives anyone who taps through a MeetingSheet-style card plus a way into Fellow to find it.
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function to12(t: string) {
  const [h, m] = String(t).split(":").map(Number);
  if (!Number.isFinite(h)) return "";
  const ap = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${ap}`;
}
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

function cardData(sp: SP) {
  const name = one(sp.n) || "Recovery meeting";
  const code = one(sp.f);
  const day = Number(one(sp.d));
  const time = one(sp.t);
  const online = one(sp.o) === "1";
  const when = Number.isInteger(day) && day >= 0 && day <= 6 ? `${DAYS[day]}${time ? `, ${to12(time)}` : ""}` : "";
  const where = online ? "Online meeting" : [one(sp.p), one(sp.a)].filter(Boolean).join(" · ");
  return { name, code, when, where, online };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const { name, code, when, where } = cardData(sp);
  const qs = new URLSearchParams();
  for (const k of ["n", "f", "d", "t", "p", "a", "o"]) { const v = one(sp[k]); if (v) qs.set(k, v); }
  const img = `/api/share-card?${qs.toString()}`;
  const title = `${name}${code ? ` — ${fellowshipName(code)}` : ""} | Fellow`;
  const description = [when, where].filter(Boolean).join(" · ") || "A recovery meeting on Fellow.";
  return {
    title, description,
    openGraph: { title, description, images: [{ url: img, width: 1200, height: 630 }], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [img] },
    robots: { index: false, follow: true }, // share links aren't meant to be indexed
  };
}

export default async function SharedMeeting({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { name, code, when, where, online } = cardData(sp);
  const fc = code ? fellowshipColor(code) : "var(--brand)";
  return (
    <main className="app" id="main-content" tabIndex={-1}>
      <header className="brand">
        <Link href="/" className="brand-link" aria-label="Fellow — home">
          <div className="mark" aria-hidden><Mark size={50} /></div>
          <div><h1>Fellow</h1><div className="tagline">Find your people</div></div>
        </Link>
      </header>

      <div className="share-card" style={{ ["--fc" as any]: fc }}>
        <div className="sheet-hero">
          <h2 className="sheet-title">{name}</h2>
          {code ? <p className="sheet-fellowship">{fellowshipName(code)}</p> : null}
        </div>
        <div className="sheet-body">
          <div className="sheet-facts">
            {when ? (
              <div className="fact">
                <span className="fact-ico"><Icon name="calmonth" size={18} /></span>
                <span className="fact-body"><span className="fact-main">{when}</span></span>
              </div>
            ) : null}
            <div className="fact">
              <span className="fact-ico"><Icon name={online ? "video" : "pin"} size={18} /></span>
              <span className="fact-body"><span className="fact-main">{where || "See details on Fellow"}</span></span>
            </div>
          </div>
          <div className="sheet-actions">
            <Link className="btn btn-fc" href={`/?q=${encodeURIComponent(name)}`} style={{ ["--fc" as any]: fc }}>
              <Icon name="search" size={18} /> Find this meeting on Fellow
            </Link>
          </div>
          <p className="share-note">Fellow is independent and not affiliated with any fellowship. Please confirm details with the group — meetings can change.</p>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
