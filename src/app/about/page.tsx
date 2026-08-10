import type { Metadata } from "next";
import { FELLOWSHIPS } from "@/lib/fellowships";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "About & sources — Fellow",
  description: "How Fellow works, where its meeting data comes from, how it handles privacy and anonymity (including the Ask Fellow chat), and how to report a correction.",
};

const CONTACT = `mailto:${CONTACT_EMAIL}`;

const GROUP_ORDER = ["Alcohol & drugs", "Food & eating", "Sex & relationships", "Money & work", "Emotional & behavioral", "Family & friends"];

export default function AboutPage() {
  const byGroup = GROUP_ORDER.map((g) => ({ g, list: FELLOWSHIPS.filter((f) => f.group === g) })).filter((x) => x.list.length);
  return (
    <main className="app prose">
      <p style={{ margin: "20px 0 8px" }}><a href="/" className="back">← Back to meetings</a></p>
      <h1>About Fellow</h1>

      <p>
        Fellow is a free, independent, non-commercial project that helps people find 12-step
        recovery meetings quickly. It is not affiliated with, endorsed by, or a representative of
        Alcoholics Anonymous or any other fellowship or service body. There are no accounts, no
        ads, and nothing to sign up for.
      </p>
      <p>
        There are two ways to find a meeting. <strong>Search</strong> lets you type a place, ZIP,
        group, or a plain phrase like “Sunday morning AA near me,” and filter by day, time,
        fellowship, and location — including a “Starts soon” view for meetings beginning shortly.
        <strong> Ask Fellow</strong> is a chat assistant you can talk to in your own words (for
        example, “my partner’s drinking is a problem — is there something for me?”). Either way, you
        can open a meeting’s details to get directions, add it to your calendar, or share it.
      </p>

      <h2>Where the meeting data comes from</h2>
      <p>
        Meeting listings are aggregated from public feeds published by local 12-step intergroups
        and service bodies. We read them through two open community data standards:
      </p>
      <ul>
        <li>
          <strong>Meeting Guide / TSML</strong> — the “12 Step Meeting List” standard maintained by{" "}
          <a href="https://code4recovery.org/" target="_blank" rel="noopener">Code for Recovery</a>,
          used by A.A. and many other fellowships.
        </li>
        <li>
          <strong>BMLT</strong> — the{" "}
          <a href="https://bmlt.app/" target="_blank" rel="noopener">Basic Meeting List Toolbox</a>,
          used by Narcotics Anonymous and others.
        </li>
      </ul>
      <p>
        The listings belong to those intergroups and fellowships, who do the real work of keeping
        them current. Fellow simply gathers them into one searchable place. If your intergroup would
        like its feed added, corrected, or removed, please <a href={CONTACT}>get in touch</a>.
      </p>

      <h3>Fellowships included</h3>
      <p>Fellow aims to cover all 12-step fellowships that publish open meeting data, including:</p>
      {byGroup.map(({ g, list }) => (
        <p key={g} style={{ margin: "6px 0" }}>
          <strong>{g}:</strong> {list.map((f) => f.name).join(", ")}.
        </p>
      ))}
      <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>
        Coverage varies by area and grows over time — not every fellowship publishes open data everywhere.
      </p>

      <h2 id="privacy">Privacy &amp; anonymity</h2>
      <p>
        Anonymity is a foundation of 12-step recovery, and Fellow is built to respect it. We don’t
        ask who you are, we don’t create accounts, and we don’t track you across the web or run
        advertising.
      </p>
      <ul>
        <li>
          <strong>Your location.</strong> When you tap “Near me” or enter a ZIP code, your approximate
          location is used to sort meetings by distance. Those coordinates are sent to our search
          service and a mapping provider only to return nearby results — they are not stored by
          Fellow or linked to any identity.
        </li>
        <li>
          <strong>No personal data.</strong> Fellow doesn’t collect names, contact details, or a
          record of which meetings you view.
        </li>
        <li>
          <strong>Ask Fellow (the chat assistant).</strong> To answer you, the messages you type —
          plus your approximate location, if you’ve shared it — are sent to our AI provider
          (<a href="https://www.anthropic.com/" target="_blank" rel="noopener">Anthropic</a>) to
          generate a reply and search for meetings. Fellow doesn’t store your conversations or link
          them to you, and the assistant only shows real meetings from the index — it can’t invent
          one. Please don’t include identifying details; messages are processed under Anthropic’s
          own policies.
        </li>
        <li>
          <strong>Maps &amp; directions.</strong> Opening a map, Street View, or directions hands off
          to Google Maps, which has its own terms and privacy policy.
        </li>
      </ul>

      <h2>Accuracy &amp; corrections</h2>
      <p>
        Meeting details change often, and public feeds can lag. Please treat listings as a helpful
        starting point and confirm with the group before you go — especially for a first visit.
        Spot something wrong, missing, or that should be taken down?{" "}
        <a href={CONTACT}>Let us know</a> and we’ll fix it.
      </p>

      <h2>Disclaimer</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>
        Fellow is provided “as is,” without warranty of any kind. Fellowship names and marks belong
        to their respective organizations and are used here only to identify meetings. Fellow is an
        independent effort and does not speak for any fellowship.
      </p>

      <p style={{ margin: "28px 0" }}><a href="/" className="back">← Back to meetings</a></p>
    </main>
  );
}
