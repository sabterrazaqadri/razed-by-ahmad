"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/prizes", label: "Prizes" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const isCurrent = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const links = LINKS.map((l) => (
    <Link key={l.href} href={l.href} aria-current={isCurrent(l.href) ? "page" : undefined}>
      {l.label}
    </Link>
  ));
  if (mobile) return <>{links}</>;
  return <nav aria-label="Admin">{links}</nav>;
}
