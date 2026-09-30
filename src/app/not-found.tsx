import Link from "next/link";
import { BottleArt } from "@/components/BottleArt";

export default function NotFound() {
  return (
    <main className="wrap" style={{ minHeight: "80dvh", display: "grid", placeItems: "center", paddingBlock: 64 }}>
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <div style={{ width: 120, margin: "0 auto 28px", opacity: 0.8 }}>
          <BottleArt variant="c" />
        </div>
        <span className="eyebrow">404 · Evaporated</span>
        <h1 className="display h2" style={{ margin: "16px 0 16px" }}>
          This page has <em>worn off</em>
        </h1>
        <p className="lede" style={{ margin: "0 auto" }}>
          Whatever was here has gone — like a top note after forty minutes. The collection is still where you left it.
        </p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link className="btn btn-solid" href="/collection">
            See the collection
          </Link>
          <Link className="btn btn-ghost" href="/">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
