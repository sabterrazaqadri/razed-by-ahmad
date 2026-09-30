export default function Loading() {
  return (
    <div className="wrap" style={{ minHeight: "60dvh", display: "grid", placeItems: "center" }} aria-busy="true">
      <div style={{ textAlign: "center" }}>
        <div className="mini-ladder" style={{ margin: "0 auto 16px", height: 28, gap: 6 }} aria-hidden="true">
          <i style={{ height: 10 }} />
          <i style={{ height: 18 }} />
          <i style={{ height: 28 }} />
        </div>
        <span className="eyebrow eyebrow-mute" role="status">
          Loading
        </span>
      </div>
    </div>
  );
}
