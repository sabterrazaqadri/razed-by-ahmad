"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/collection", label: "Collection" },
  { href: "/#notes", label: "Notes" },
  { href: "/#gifting", label: "Gifting" },
  { href: "/#about", label: "About" },
];

export function SiteHeader({ whatsappUrl }: { whatsappUrl: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const current = (href: string) =>
    href === "/collection" && (pathname === "/collection" || pathname.startsWith("/product/")) ? "page" : undefined;

  return (
    <nav className="nav" aria-label="Main">
      <div className="wrap">
        <div className="nav-links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={current(l.href)}>
              {l.label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          className="burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <i />
          <i />
          <i />
        </button>
        <Link href="/" className="wordmark" aria-label="Razed by Ahmad — home">
          RAZED<span className="wordmark-sub">by Ahmad</span>
        </Link>
        <div className="nav-tools">
          <a className="hide-m" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          <Link href="/collection">Shop</Link>
        </div>
      </div>
      {open && (
        <div className="mnav" id="mobile-nav">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={current(l.href)} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            WhatsApp us
          </a>
        </div>
      )}
    </nav>
  );
}
