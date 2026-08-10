import { ImageResponse } from "next/og";

// Generates the 1200×630 social/share card used across the site (og:image + twitter:image).
export const alt = "Fellow — find a meeting, find your people";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "84px",
          background: "linear-gradient(135deg, #0e8c80 0%, #0a655c 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "28px", marginBottom: "44px" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              width: "116px",
              height: "116px",
              borderRadius: "30px",
              background: "rgba(255,255,255,0.16)",
            }}
          >
            {[
              { x: 50, y: 20 }, { x: 71, y: 29 }, { x: 80, y: 50 }, { x: 71, y: 71 },
              { x: 29, y: 71 }, { x: 20, y: 50 }, { x: 29, y: 29 },
            ].map((d, i) => (
              <div key={i} style={{
                position: "absolute", left: `${d.x}%`, top: `${d.y}%`,
                width: "16px", height: "16px", marginLeft: "-8px", marginTop: "-8px",
                borderRadius: "16px", background: "#ffffff",
              }} />
            ))}
            <div style={{
              position: "absolute", left: "50%", top: "80%",
              width: "20px", height: "20px", marginLeft: "-10px", marginTop: "-10px",
              borderRadius: "20px", background: "#f4511e",
            }} />
          </div>
          <div style={{ fontSize: "88px", fontWeight: 800, letterSpacing: "-2px" }}>Fellow</div>
        </div>
        <div style={{ display: "flex", fontSize: "58px", fontWeight: 700, lineHeight: 1.05 }}>
          Find a meeting, find your people
        </div>
        <div style={{ display: "flex", fontSize: "34px", marginTop: "30px", opacity: 0.92 }}>
          AA, NA &amp; other recovery meetings near you — free
        </div>
      </div>
    ),
    { ...size },
  );
}
