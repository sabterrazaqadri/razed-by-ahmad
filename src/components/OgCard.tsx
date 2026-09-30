// Shared Open Graph card layout (rendered by next/og ImageResponse).

export function OgCard({ title, eyebrow, sub }: { title: string; eyebrow: string; sub: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "radial-gradient(circle at 80% 20%, rgba(198,161,91,.22), #07060A 60%)",
        color: "#EDE7DC",
        padding: "64px 72px",
        fontFamily: "serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 44, letterSpacing: 18, color: "#EDE7DC" }}>RAZED</div>
        <div style={{ fontSize: 14, letterSpacing: 8, color: "#8A6F3C", marginTop: 6 }}>BY AHMAD</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 18, letterSpacing: 7, color: "#C6A15B", textTransform: "uppercase" }}>{eyebrow}</div>
        <div style={{ fontSize: 96, lineHeight: 1, marginTop: 20, color: "#E9D6AC" }}>{title}</div>
        <div style={{ fontSize: 26, color: "#8D8478", marginTop: 26, maxWidth: 900 }}>{sub}</div>
      </div>
      <div style={{ display: "flex", height: 2, background: "rgba(198,161,91,.4)" }} />
    </div>
  );
}
