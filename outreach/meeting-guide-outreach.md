# Outreach note — Meeting Guide / Code for Recovery

**Status:** draft for Yann to review and send. Nothing has been sent.

**Who to send to (pick based on the ask):**
- Code for Recovery (maintainers of the TSML plugin + Meeting Guide API spec) — most likely to have, or point to, a machine-readable entity list. Contact via their site (code4recovery.org) or GitHub (github.com/code4recovery).
- AA Meeting Guide team at AA World Services (aa.org/meeting-guide-app) — owns the canonical list of the 400+ service entities the app syncs with.

Suggested to start with Code for Recovery (developer-to-developer, open-source, cooperative) and only approach AAWS if they point you there.

---

## Suggested subject
Data-sharing question from Fellow — a free, privacy-first meeting finder

## Draft

Hi there,

I'm reaching out from Fellow (fellow.space), a free, non-commercial tool that helps people find in-person and online recovery meetings near them. We aggregate publicly available meeting feeds — a lot of them the same 12 Step Meeting List / Meeting Guide JSON feeds your ecosystem has done so much to standardize — and present them in one place, with no ads, no account required, and no tracking of the people searching. Privacy for the person looking for a meeting is the whole point of the project.

We've been onboarding intergroup and central-office feeds one at a time, and we're now trying to do it comprehensively and responsibly rather than piecemeal. Since the Meeting Guide app already syncs with 400+ service entities, I wanted to ask the people closest to that data before we build anything on our own:

1. Is there a machine-readable list of the participating service entities and/or their feed URLs that you're able to share, or point us to? Even just the list of entities and their websites would save everyone a lot of redundant crawling.
2. If there isn't a shareable list, is there a preferred, low-impact way for a downstream aggregator like us to enumerate and pull these feeds — anything you'd want us to respect in terms of rate limits, caching, user-agent, or attribution?
3. Is there anything about how we're using this data that would concern you or the fellowships? We want to stay well within the spirit of the Traditions — we're an independent tool, we don't imply endorsement or affiliation with AA or any fellowship, and we're glad to make that explicit wherever it matters.

We're happy to attribute Meeting Guide / Code for Recovery, link back, share corrections upstream when we spot stale or broken data, and generally be good citizens of this ecosystem rather than just consumers of it. If it's useful, I'm also glad to hop on a call.

Thanks for building the infrastructure that makes this kind of thing possible — it genuinely helps people find their way to a meeting.

Best,
Yann
Fellow — fellow.space
yannsc@gmail.com

---

### Notes for Yann (delete before sending)
- Tone is deliberately humble and cooperative — this ecosystem runs on goodwill and the AA Traditions (non-affiliation, non-endorsement, anonymity), so leading with "we're independent and we don't imply endorsement" heads off the main concern.
- The three questions are ordered so a one-line "here's the list" answer is the easiest reply for them to give.
- If you'd rather approach AAWS first, swap the greeting and drop the "developer-to-developer" framing — with AAWS, lean on the public-service angle (helping people find meetings) over the technical angle.
- Worst case is a no, and we lose nothing — the crawler runs regardless.
