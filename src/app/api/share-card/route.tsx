import { ImageResponse } from "next/og";
import { fellowshipColor, fellowshipName } from "@/lib/fellowships";

// Dynamic 1200×630 share card for a single meeting — the image messaging apps unfurl when a
// Fellow meeting link is shared. Mirrors the MeetingSheet: a fellowship-color header band with
// the meeting name + fellowship, then When / Where below. Built from URL params (no data store).
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function to12(t: string) {
  const [h, m] = String(t).split(":").map(Number);
  if (!Number.isFinite(h)) return "";
  const ap = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${ap}`;
}
const DOTS = [
  { x: 50, y: 20 }, { x: 71, y: 29 }, { x: 80, y: 50 }, { x: 71, y: 71 },
  { x: 29, y: 71 }, { x: 20, y: 50 }, { x: 29, y: 29 },
];

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const name = (p.get("n") || "Recovery meeting").slice(0, 90);
  const code = p.get("f") || "";
  const fc = fellowshipColor(code);
  const fname = code ? fellowshipName(code) : "";
  const day = Number(p.get("d"));
  const time = p.get("t") || "";
  const online = p.get("o") === "1";
  const when = Number.isInteger(day) && day >= 0 && day <= 6
    ? `${DAYS[day]}${time ? `  ·  ${to12(time)}` : ""}` : "";
  const rawWhere = online ? "Online meeting" : (p.get("p") || p.get("a") || "");
  const where = rawWhere.length > 52 ? rawWhere.slice(0, 50) + "…" : rawWhere;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: "sans-serif", background: "#ffffff" }}>
        {/* fellowship-color header band */}
        <div style={{ display: "flex", flexDirection: "column", background: fc, color: "#ffffff", padding: "44px 64px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "28px" }}>
            <div style={{ position: "relative", display: "flex", width: "62px", height: "62px", borderRadius: "17px", background: "rgba(255,255,255,0.18)" }}>
              {DOTS.map((d, i) => (
                <div key={i} style={{ position: "absolute", left: `${d.x}%`, top: `${d.y}%`, width: "10px", height: "10px", marginLeft: "-5px", marginTop: "-5px", borderRadius: "10px", background: "#ffffff" }} />
              ))}
              <div style={{ position: "absolute", left: "50%", top: "80%", width: "13px", height: "13px", marginLeft: "-6.5px", marginTop: "-6.5px", borderRadius: "13px", background: "#f5b301" }} />
            </div>
            <div style={{ display: "flex", fontSize: "38px", fontWeight: 800, letterSpacing: "-1px" }}>Fellow</div>
          </div>
          <div style={{ display: "flex", fontSize: "66px", fontWeight: 800, lineHeight: 1.04, letterSpacing: "-2px" }}>{name}</div>
          {fname ? <div style={{ display: "flex", fontSize: "33px", fontWeight: 700, marginTop: "14px", opacity: 0.9 }}>{fname}</div> : null}
        </div>
        {/* When / Where */}
        <div style={{ display: "flex", flexDirection: "column", padding: "32px 64px", gap: "22px", flex: 1, justifyContent: "flex-start" }}>
          {when ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: "21px", fontWeight: 800, letterSpacing: "3px", color: fc }}>WHEN</div>
              <div style={{ display: "flex", fontSize: "42px", fontWeight: 700, color: "#17161a", marginTop: "5px" }}>{when}</div>
            </div>
          ) : null}
          {where ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: "21px", fontWeight: 800, letterSpacing: "3px", color: fc }}>WHERE</div>
              <div style={{ display: "flex", fontSize: "38px", fontWeight: 700, color: "#17161a", marginTop: "5px" }}>{where}</div>
            </div>
          ) : null}
        </div>
        {/* footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "26px 64px", borderTop: "2px solid #eef4f0" }}>
          <div style={{ display: "flex", fontSize: "30px", fontWeight: 800, color: "#0a655c" }}>fellow.space</div>
          <div style={{ display: "flex", fontSize: "27px", color: "#6b6660" }}>find a meeting, find your people</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
