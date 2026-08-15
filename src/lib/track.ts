// Vendor-neutral conversion events. We push plain events onto `window.dataLayer`; a tag manager
// (GTM) is expected to fan them out to Bing UET / Google Ads / GA4. Firing here — once, in a
// vendor-neutral shape — means the app never imports a specific ad vendor's script, and swapping or
// adding a destination is a GTM change, not a code change.
//
// PRIVACY: these events carry only COARSE, NON-IDENTIFYING meeting attributes (fellowship code,
// online-vs-in-person, day-of-week). Never a user's location, a meeting id/name/address, or anything
// that could build a profile — matching Fellow's zero-PII stance and the health-category ad rules
// (no remarketing audiences). If `dataLayer` doesn't exist yet (no GTM installed), the push is a
// harmless no-op array append.

type Primitive = string | number | boolean;

export function track(event: string, params: Record<string, Primitive | undefined | null> = {}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: Array<Record<string, unknown>> };
  w.dataLayer = w.dataLayer || [];
  const payload: Record<string, unknown> = { event };
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") payload[k] = v;
  }
  w.dataLayer.push(payload);
}

// Coarse descriptor attached to every meeting-related conversion. Deliberately excludes anything
// that identifies the user or pinpoints a single meeting listing.
export function meetingDims(m: { fellowship?: string; online?: boolean; day?: number }): Record<string, Primitive> {
  const dims: Record<string, Primitive> = { format: m?.online ? "online" : "in_person" };
  if (m?.fellowship) dims.fellowship = m.fellowship;
  if (typeof m?.day === "number") dims.day = m.day;
  return dims;
}
