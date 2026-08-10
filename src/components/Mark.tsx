// Fellow's brand mark — the "classic ring": seven people gathered in a circle with one
// warm accent (the newcomer). Ring dots inherit the current text color (so it's white on
// the teal brand tile, brand-colored on light), and the accent dot uses --accent. Reused in
// the header, 404, and anywhere the logo appears. Purely decorative by default (aria-hidden);
// pass a `title` to expose it as a labelled image.
export function Mark({ size = 32, className, title }:
  { size?: number; className?: string; title?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100" className={className}
      role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      focusable={false} style={{ display: "block" }}
    >
      <g fill="currentColor">
        <circle cx="50" cy="20" r="7" />
        <circle cx="71" cy="29" r="7" />
        <circle cx="80" cy="50" r="7" />
        <circle cx="71" cy="71" r="7" />
        <circle cx="29" cy="71" r="7" />
        <circle cx="20" cy="50" r="7" />
        <circle cx="29" cy="29" r="7" />
      </g>
      {/* Amber accent seat — brighter than the app's orange so it keeps strong brightness
          contrast against the teal tile and stays visible for red-green color blindness
          (orange-on-teal is near-equiluminant and "vibrates"/fades). */}
      <circle cx="50" cy="80" r="9" fill="#f5b301" />
    </svg>
  );
}
