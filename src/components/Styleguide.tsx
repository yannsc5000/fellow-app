"use client";
import { useEffect, useState } from "react";
import { FELLOWSHIPS, FELLOWSHIP_COLORS } from "@/lib/fellowships";
import { Icon } from "@/components/Icon";

// Living styleguide — reads the REAL CSS custom properties from :root at runtime, so any change
// to a design token (a color, a line, the accent) shows up here automatically. Component samples
// below use the same global classes the app uses, so their styling is live too. New tokens or
// new components are added to the arrays/markup here by hand as they're introduced.
const TOKENS: [string, string][] = [
  ["--bg", "App background"],
  ["--surface", "Surface · cards"],
  ["--surface-2", "Surface 2 · hover"],
  ["--panel-glow", "Panel glow"],
  ["--panel-line", "Panel border"],
  ["--line", "Hairline"],
  ["--ink", "Ink · text"],
  ["--ink-soft", "Ink soft · secondary text"],
  ["--brand", "Brand · identity & links"],
  ["--brand-ink", "Brand ink · deeper teal"],
  ["--brand-tint", "Brand tint"],
  ["--action", "Action · PRIMARY buttons (burnt orange)"],
  ["--accent", "Accent · alerts & 2nd action"],
  ["--focus", "Focus ring"],
];

export function Styleguide() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [scheme, setScheme] = useState("light");
  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      const out: Record<string, string> = {};
      for (const [t] of TOKENS) out[t] = cs.getPropertyValue(t).trim();
      setVals(out);
      setScheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    };
    read();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);

  return (
    <main className="app prose sg" id="main-content">
      <p style={{ margin: "20px 0 8px" }}><a href="/" className="back">← Fellow home</a></p>
      <h1>Living styleguide</h1>
      <p style={{ color: "var(--ink-soft)" }}>
        This page reads Fellow’s real design tokens and components at runtime — currently rendering the{" "}
        <strong>{scheme}</strong> theme. Change a token in <code>globals.css</code> and it updates here on the
        next load; there’s no snapshot to regenerate. New tokens and components are added below as they’re built.
      </p>

      <h2>Color tokens</h2>
      <div className="sg-swatches">
        {TOKENS.map(([t, label]) => (
          <div key={t} className="sg-swatch">
            <div className="sg-chip" style={{ background: `var(${t})` }} />
            <div className="sg-meta">
              <b>{label}</b>
              <small><code>{t}</code> · {vals[t] || "…"}</small>
            </div>
          </div>
        ))}
      </div>

      <h2>Actions</h2>
      <p style={{ color: "var(--ink-soft)", margin: "0 0 12px" }}>
        <strong>Primary</strong> = burnt orange (<code>--action</code>, #c2410c) — one action color across both Find
        and Ask Fellow; white text passes AA (5.2:1). <strong>Teal</strong> is identity: the logo, links, and calm
        surfaces. The soft teal pills are tertiary; the accent is reserved for alerts (safety notes, errors).
      </p>
      <div className="sg-row">
        <button className="btn btn-fc" style={{ ["--fc" as any]: "var(--action)" }}><Icon name="search" size={18} /> Primary action</button>
        <a className="btn-secondary" href="#"><Icon name="add" size={16} /> Secondary action</a>
        <a className="city-chip city-chip-all" href="#">Soft pill →</a>
        <button className="chip" aria-pressed={false}>Chip</button>
        <button className="chip" aria-pressed={true}>Chip · selected</button>
      </div>

      <h2>Filter chips</h2>
      <div className="filter-row" role="group" aria-label="Sample filters">
        <button className="chip chip-soon" aria-pressed={false}><span className="livedot" aria-hidden /> Starts soon</button>
        <button className="chip" aria-pressed={false}>Today</button>
        <button className="chip" aria-pressed={false}>Tomorrow</button>
        <button className="chip" aria-pressed={true}>In person</button>
        <button className="chip" aria-pressed={false}>Online</button>
        <button className="chip" aria-pressed={false}>Open</button>
        <button className="chip" aria-pressed={false}>Closed</button>
        <button className="chip" aria-pressed={false}>Accessible</button>
      </div>

      <h2>Fellowship colors</h2>
      <div className="sg-fchips">
        {FELLOWSHIPS.map((f) => (
          <span key={f.code} className="sg-fchip">
            <span className="fh-dot" style={{ background: FELLOWSHIP_COLORS[f.code] || "#57534E", display: "inline-block", width: 12, height: 12, borderRadius: "50%", verticalAlign: "middle" }} aria-hidden />
            {f.code}
          </span>
        ))}
      </div>

      <h2>Meeting cards</h2>
      <p className="sg-note">The two surfaces that show a meeting — Search (left) and Ask Fellow (right). They
        share one design language: same surface, 2px border, soft shadow, hover lift, and the
        fellowship-colored leading chip. Ask Fellow&apos;s card is a more compact sibling.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, maxWidth: 720 }}>
        <button className="card" style={{ ["--fc" as any]: FELLOWSHIP_COLORS.AA }}>
          <div className="timechip"><span className="hh">7:00</span><span className="ap">AM</span></div>
          <div className="cardbody">
            <h3>Early Bird Group</h3>
            <div className="meta">Mon · <b>Dupont Circle</b></div>
            <div className="tags"><span className="tag fellow">AA</span><span className="tag">Open</span></div>
            <div className="rt"><span className="line" style={{ background: FELLOWSHIP_COLORS.AA }} />Red Line · 0.2 mi<span className="dist">1.2 mi</span><Icon name="chevron" size={18} className="rt-chev" /></div>
          </div>
        </button>
        <button className="chat-card" style={{ ["--fc" as any]: FELLOWSHIP_COLORS.AA, alignSelf: "start" }}>
          <span className="cc-badge">AA</span>
          <span className="cc-body"><span className="cc-name">Early Bird Group</span><span className="cc-meta">Mon · 7:00 AM · Dupont Circle</span></span>
          <Icon name="chevron" size={18} className="cc-chev" />
        </button>
      </div>

      <h2>Outbound resource card</h2>
      <div className="sober-cards" style={{ maxWidth: 560 }}>
        <a className="sober-card" href="#" style={{ ["--pc" as any]: "#2597B7" }}>
          <span className="lx-cico"><Icon name="globe" size={18} /></span>
          <span className="lx-ctext"><b>In The Rooms</b><small>Online recovery community — live events &amp; socials</small></span>
          <Icon name="external" size={16} className="lx-ext" />
        </a>
      </div>

      <h2>FAQ accordion</h2>
      <div className="faq-accordion" style={{ maxWidth: 640 }}>
        <details className="faq-item" open>
          <summary className="faq-q"><span>Are meetings free and anonymous?</span><Icon name="chevron" size={20} className="faq-caret" /></summary>
          <div className="faq-a">Yes — meetings are free to attend, and anonymity is a core principle.</div>
        </details>
        <details className="faq-item">
          <summary className="faq-q"><span>Can I attend online?</span><Icon name="chevron" size={20} className="faq-caret" /></summary>
          <div className="faq-a">Many groups meet online as well as in person.</div>
        </details>
      </div>

      <h2>Safety note (alert use of accent)</h2>
      <p className="safety-note" style={{ maxWidth: 640 }}>
        <span className="sn-i"><Icon name="info" size={17} /></span>
        <span>A meeting is peer support, not medical care. If you feel unwell or unsafe, contact a doctor or your local emergency number.</span>
      </p>

      <h2>Type scale</h2>
      <div className="sg-type">
        <p style={{ fontSize: 30, fontWeight: 850, letterSpacing: "-.02em", margin: "6px 0" }}>Heading 1 · Nunito Sans 850</p>
        <p style={{ fontSize: 21, fontWeight: 800, margin: "6px 0" }}>Heading 2 · 800</p>
        <p style={{ fontSize: 17, fontWeight: 800, margin: "6px 0" }}>Heading 3 · 800</p>
        <p style={{ fontSize: 16, margin: "6px 0" }}>Body · 400 — the quick brown fox jumps over the lazy dog.</p>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "6px 0" }}>Small · secondary text.</p>
      </div>

      <p style={{ margin: "40px 0 20px" }}><a href="/" className="back">← Back to Fellow</a></p>
    </main>
  );
}
