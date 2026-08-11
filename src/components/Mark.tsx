// Fellow's brand mark — the "classic ring": seven people gathered in a circle with one warm
// accent (the newcomer). Ring dots inherit the current text color; the accent uses amber.
// Default: solid ring (used for the chat avatar). `logo`: the header treatment — the ring
// spread wider and top-lit (lower dots a deeper teal, via the .mk-deep class) so it reads as a
// crafted, dimensional mark standing on its own, no tile. Pass a `title` to label it.
const BASE: [number, number][] = [
  [50, 20], [71, 29], [80, 50], [71, 71], [29, 71], [20, 50], [29, 29],
];
const DEEP = new Set([3, 4]); // the two lower dots — deeper teal for a lit-from-above feel

export function Mark({ size = 32, className, title, logo = false }:
  { size?: number; className?: string; title?: string; logo?: boolean }) {
  const spread = logo ? 1.15 : 1;
  const at = (x: number, y: number): [number, number] => [50 + (x - 50) * spread, 50 + (y - 50) * spread];
  const [ax, ay] = at(50, 80);
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100" className={className}
      role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      focusable={false} style={{ display: "block" }}
    >
      <g fill="currentColor">
        {BASE.map(([x, y], i) => {
          const [cx, cy] = at(x, y);
          return <circle key={i} cx={cx} cy={cy} r={7} className={logo && DEEP.has(i) ? "mk-deep" : undefined} />;
        })}
      </g>
      {/* Amber accent seat — the newcomer; brighter than the app's orange so it holds contrast. */}
      <circle cx={ax} cy={ay} r={9} fill="#f5b301" />
    </svg>
  );
}
