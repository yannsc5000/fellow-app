// Fellow's loading spinner, built from the brand mark: a faint ring of "people" with one
// warm accent dot whipping around it — accelerating, decelerating, then accelerating again
// each lap (a cubic-bezier ease-in-out on an endless rotation). Respects reduced-motion
// globally (the CSS animation is neutralised in globals.css), leaving a calm static ring.
export function Loader({ size = 40, className, label = "Loading" }:
  { size?: number; className?: string; label?: string }) {
  return (
    <span className={"fellow-loader" + (className ? " " + className : "")} role="status" aria-label={label}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden focusable={false}>
        {/* the seated circle — a faint track of people */}
        <g className="fl-track">
          <circle cx="50" cy="20" r="7" />
          <circle cx="71" cy="29" r="7" />
          <circle cx="80" cy="50" r="7" />
          <circle cx="71" cy="71" r="7" />
          <circle cx="50" cy="80" r="7" />
          <circle cx="29" cy="71" r="7" />
          <circle cx="20" cy="50" r="7" />
          <circle cx="29" cy="29" r="7" />
        </g>
        {/* the accent that whips around the ring */}
        <g className="fl-orbit">
          <circle cx="50" cy="20" r="9" fill="var(--accent)" />
        </g>
      </svg>
    </span>
  );
}
