// The Events Calendar (Tribe Events) adapter — fromTribeEvents(). Guards the CoDA feed path: recurring
// instances collapse, weekday/time derive from the event's local date, HTML entities decode, and
// online vs in-person is detected from categories. Pure (no network) — safe in the test suite.
//   node --test scripts/lib/*.test.mjs   (or: node scripts/lib/normalize-tec.test.mjs)
import { test } from "node:test";
import assert from "node:assert/strict";
import { fromTribeEvents, dedupe, decodeEntities } from "./normalize.mjs";

// Two instances of the same weekly in-person meeting + one online meeting with encoded title.
const events = [
  { title: "Serenity &amp; Steps Group", url: "https://coda.org/event/serenity/",
    start_date: "2026-08-17 19:30:00", start_date_details: { year: "2026", month: "08", day: "17", hour: "19", minutes: "30" },
    end_date_details: { hour: "20", minutes: "45" },
    venue: { venue: "Dupont Circle Club", address: "1623 Connecticut Ave NW", city: "Washington", stateprovince: "DC", zip: "20009", geo_lat: "38.9128", geo_lng: "-77.0451" },
    categories: [{ name: "Open" }], tags: [] },
  { title: "Serenity &amp; Steps Group", url: "https://coda.org/event/serenity/",
    start_date: "2026-08-24 19:30:00", start_date_details: { year: "2026", month: "08", day: "24", hour: "19", minutes: "30" },
    end_date_details: { hour: "20", minutes: "45" },
    venue: { venue: "Dupont Circle Club", address: "1623 Connecticut Ave NW", city: "Washington", stateprovince: "DC", zip: "20009", geo_lat: "38.9128", geo_lng: "-77.0451" },
    categories: [{ name: "Open" }], tags: [] },
  { title: "Tuesday Newcomers &#8217;Zoom&#8217;", url: "https://coda.org/event/newcomers/", website: "https://us02web.zoom.us/j/123",
    start_date: "2026-08-18 18:00:00", start_date_details: { year: "2026", month: "08", day: "18", hour: "18", minutes: "00" },
    venue: {}, categories: [{ name: "Online" }, { name: "Newcomer" }], tags: [] },
];

const deduped = dedupe(events.map((e, i) => fromTribeEvents(e, i, "CoDA")));

test("decodeEntities handles &amp;, curly quotes, dashes, numeric refs", () => {
  assert.equal(decodeEntities("A &amp; B &#8211; C&#8217;s &#8220;x&#8221;"), 'A & B – C\'s "x"');
});

test("recurring instances collapse to unique weekly meetings", () => {
  assert.equal(deduped.length, 2);
});

test("in-person meeting: weekday/time/venue/coords derived", () => {
  const m = deduped.find((x) => x.name.includes("Serenity"));
  assert.equal(m.name, "Serenity & Steps Group");
  assert.equal(m.day, 1);        // 2026-08-17 is a Monday
  assert.equal(m.time, "19:30");
  assert.equal(m.online, false);
  assert.equal(m.lat, 38.9128);
  assert.ok(m.address.includes("Washington") && m.address.includes("DC 20009"));
});

test("online meeting: detected from category, coords dropped, join link kept", () => {
  const m = deduped.find((x) => x.name.includes("Newcomers"));
  assert.equal(m.day, 2);        // 2026-08-18 is a Tuesday
  assert.equal(m.online, true);
  assert.equal(m.lat, null);
  assert.equal(m.conference_url, "https://us02web.zoom.us/j/123");
  assert.ok(m.name.includes("'Zoom'"));
});
