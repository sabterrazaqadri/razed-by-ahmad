import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { SortSelect } from "@/components/SortSelect";
import { FAMILIES, getActiveProducts, getSettings, type ProductWithVariants, type Variant } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { getSchedule } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "The collection",
  description:
    "Every Razed extrait — oud, amber, floral, musk and smoke — in 30, 50 and 100 ml. Order on WhatsApp, cash on delivery nationwide.",
  alternates: { canonical: "/collection" },
  openGraph: { title: "The collection · Razed by Ahmad", url: "/collection" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PRICE_BUCKETS = [
  { key: "under-8000", min: 0, max: 7999.99 },
  { key: "8000-11000", min: 8000, max: 11000 },
  { key: "over-11000", min: 11000.01, max: Number.POSITIVE_INFINITY },
] as const;

const SORTS = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest first" },
  { key: "price-asc", label: "Price, low to high" },
  { key: "price-desc", label: "Price, high to low" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}
function list(v: string | string[] | undefined) {
  return (one(v) ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

type State = { family: string[]; size: string[]; price: string | null; sort: SortKey };

function toQuery(s: State) {
  const q = new URLSearchParams();
  if (s.family.length) q.set("family", s.family.join(","));
  if (s.size.length) q.set("size", s.size.join(","));
  if (s.price) q.set("price", s.price);
  if (s.sort !== "featured") q.set("sort", s.sort);
  const str = q.toString();
  return str ? `/collection?${str}` : "/collection";
}

function toggle(arr: string[], v: string) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function pickVariant(p: ProductWithVariants, state: State): Variant | undefined {
  let candidates = p.product_variants;
  if (state.size.length) candidates = candidates.filter((v) => state.size.includes(String(v.size_ml)));
  if (state.price) {
    const b = PRICE_BUCKETS.find((x) => x.key === state.price);
    if (b) candidates = candidates.filter((v) => Number(v.price) >= b.min && Number(v.price) <= b.max);
  }
  if (!candidates.length) return undefined;
  return candidates.find((v) => v.is_default) ?? candidates[0];
}

export default async function CollectionPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const [{ data: settings }, { data: products }] = await Promise.all([getSettings(), getActiveProducts()]);
  const schedule = getSchedule(settings);
  const currency = settings.currency;

  const sortRaw = one(sp.sort);
  const state: State = {
    family: list(sp.family).filter((f) => (FAMILIES as readonly string[]).includes(f)),
    size: list(sp.size).filter((s) => /^\d+$/.test(s)),
    price: PRICE_BUCKETS.some((b) => b.key === one(sp.price)) ? (one(sp.price) as string) : null,
    sort: SORTS.some((s) => s.key === sortRaw) ? (sortRaw as SortKey) : "featured",
  };

  const sizes = Array.from(new Set(products.flatMap((p) => p.product_variants.map((v) => v.size_ml)))).sort((a, b) => a - b);

  let rows = products
    .filter((p) => !state.family.length || (p.family && state.family.includes(p.family)))
    .map((p) => ({ p, v: pickVariant(p, state) }))
    .filter((r): r is { p: ProductWithVariants; v: Variant } => Boolean(r.v));

  if (state.sort === "newest") rows = [...rows].sort((a, b) => b.p.created_at.localeCompare(a.p.created_at));
  if (state.sort === "price-asc") rows = [...rows].sort((a, b) => Number(a.v.price) - Number(b.v.price));
  if (state.sort === "price-desc") rows = [...rows].sort((a, b) => Number(b.v.price) - Number(a.v.price));

  const anyFilter = state.family.length > 0 || state.size.length > 0 || state.price !== null;
  const priceLabel = (key: string) =>
    key === "under-8000"
      ? `Under ${formatPrice(8000, currency)}`
      : key === "8000-11000"
        ? `${formatPrice(8000, currency)}–${formatPrice(11000, currency).replace(/^Rs /, "")}`
        : `Above ${formatPrice(11000, currency)}`;

  const groups = [
    {
      title: "Family",
      opts: FAMILIES.map((f) => ({
        label: f.charAt(0).toUpperCase() + f.slice(1),
        on: state.family.includes(f),
        href: toQuery({ ...state, family: toggle(state.family, f) }),
      })),
    },
    {
      title: "Size",
      opts: sizes.map((s) => ({
        label: `${s} ml`,
        on: state.size.includes(String(s)),
        href: toQuery({ ...state, size: toggle(state.size, String(s)) }),
      })),
    },
    {
      title: "Price",
      opts: PRICE_BUCKETS.map((b) => ({
        label: priceLabel(b.key),
        on: state.price === b.key,
        href: toQuery({ ...state, price: state.price === b.key ? null : b.key }),
      })),
    },
  ];

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link> / Collection
          </nav>
          <h1 className="display h2">The collection</h1>
          <p className="lede" style={{ marginTop: 14 }}>
            {products.length ? `${products.length} extraits. ` : ""}Each one is blended to sit on skin for a working day,
            not a photograph.
          </p>
        </div>
      </div>
      <div className="wrap">
        <div className="shop-layout">
          <aside className="filters" aria-label="Filters">
            {groups.map((g) => (
              <div className="group" key={g.title}>
                <h2>{g.title}</h2>
                {g.opts.map((o) => (
                  <Link
                    key={o.label}
                    href={o.href}
                    className={`opt${o.on ? " on" : ""}`}
                    aria-pressed={o.on}
                    scroll={false}
                    rel="nofollow"
                  >
                    <i aria-hidden="true" />
                    {o.label}
                  </Link>
                ))}
              </div>
            ))}
            {anyFilter && (
              <div className="group" style={{ borderBottom: 0 }}>
                <Link className="clear" href={toQuery({ family: [], size: [], price: null, sort: state.sort })} scroll={false}>
                  Clear filters
                </Link>
              </div>
            )}
            <div className="chips">
              {groups.map((g) => (
                <div className="chiprow" key={g.title} role="group" aria-label={g.title}>
                  {g.opts.map((o) => (
                    <Link
                      key={o.label}
                      href={o.href}
                      className={`chip${o.on ? " on" : ""}`}
                      aria-pressed={o.on}
                      scroll={false}
                      rel="nofollow"
                    >
                      {o.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </aside>
          <div>
            <div className="shop-bar">
              <span aria-live="polite">
                {rows.length} {rows.length === 1 ? "fragrance" : "fragrances"}
              </span>
              <SortSelect value={state.sort} options={SORTS.map((s) => ({ value: s.key, label: s.label }))} />
            </div>
            {rows.length ? (
              <div className="grid-3-gap">
                {rows.map(({ p, v }, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    variant={v}
                    currency={currency}
                    spinnerHint={schedule.spinnerToday}
                    priority={i < 2}
                  />
                ))}
              </div>
            ) : (
              <div className="empty">
                <p>Nothing matches those filters.</p>
                <p style={{ marginTop: 14 }}>
                  <Link className="clear" href="/collection" style={{ color: "var(--color-gold)" }}>
                    Show everything
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
