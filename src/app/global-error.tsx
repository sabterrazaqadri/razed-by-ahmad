"use client";

// Last-resort boundary (root layout failed). Inline styles only — globals.css
// may not have loaded.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#07060A",
          color: "#EDE7DC",
          fontFamily: "Georgia, serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <p style={{ letterSpacing: ".34em", fontSize: 10, color: "#C6A15B", textTransform: "uppercase" }}>
            Razed by Ahmad
          </p>
          <h1 style={{ fontWeight: 400, fontSize: 40, margin: "16px 0" }}>Something slipped.</h1>
          <p style={{ color: "#8D8478" }}>Please try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              background: "#C6A15B",
              color: "#120E06",
              border: 0,
              padding: "16px 28px",
              letterSpacing: ".22em",
              textTransform: "uppercase",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
