"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="wrap" style={{ minHeight: "70dvh", display: "grid", placeItems: "center", paddingBlock: 64 }}>
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <span className="eyebrow">Something slipped</span>
        <h1 className="display h2" style={{ margin: "16px 0 16px" }}>
          The page didn&rsquo;t <em>settle</em>
        </h1>
        <p className="lede" style={{ margin: "0 auto" }}>
          We couldn&rsquo;t load this just now. Try again in a moment — or message us on WhatsApp and we&rsquo;ll take
          your order directly.
        </p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <button type="button" className="btn btn-solid" onClick={reset}>
            Try again
          </button>
          <Link className="btn btn-ghost" href="/">
            Home
          </Link>
        </div>
        {error.digest && (
          <p className="small" style={{ marginTop: 22 }}>
            Reference: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
