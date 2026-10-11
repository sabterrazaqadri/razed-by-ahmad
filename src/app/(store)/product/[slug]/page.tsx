import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BankDetails } from "@/components/BankDetails";
import { JsonLd } from "@/components/JsonLd";
import { NoteLadder } from "@/components/NoteLadder";
import { ProductCard } from "@/components/ProductCard";
import { Paragraphs } from "@/components/RichText";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { DELIVERY_AND_RETURNS, INGREDIENTS, longevityFor } from "@/content/policies";
import { getActiveProducts, getProductBySlug, getSettings, isCombo, priceRange, relatedProducts } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import { dayName, getSchedule } from "@/lib/schedule";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const { data } = await getActiveProducts();
  return data.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { data: p } = await getProductBySlug(slug);
  if (!p) return { title: "Fragrance not found", robots: { index: false } };
  const description = p.tagline ?? `${p.name} — extrait de parfum by Razed by Ahmad, Pakistan.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      type: "website",
      title: `${p.name} · Razed by Ahmad`,
      description,
      url: `/product/${p.slug}`,
      ...(p.images[0] ? { images: [{ url: p.images[0], alt: p.name }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [{ data: product, error }, { data: settings }, { data: all }] = await Promise.all([
    getProductBySlug(slug),
    getSettings(),
    getActiveProducts(),
  ]);

  if (!product) {
    if (error) {
      return (
        <div className="wrap" style={{ paddingBlock: 80 }}>
          <p className="notice" role="status">
            {error}
          </p>
        </div>
      );
    }
    notFound();
  }

  const schedule = getSchedule(settings);
  const currency = settings.currency;
  const combo = isCombo(product);
  const comboItems = all.filter((p) => !isCombo(p));
  const related = combo ? comboItems.slice(0, 3) : relatedProducts(all, product, 3);
  const range = priceRange(product);
  const familyLabel = product.family ? product.family.charAt(0).toUpperCase() + product.family.slice(1) : "Extrait";

  const shipRow = (
    <div className="ship-row">
      <span className="live">Free delivery every day</span>
      <span>Ships in 24 hrs</span>
      <span>Delivery across Pakistan</span>
    </div>
  );

  return (
    <>
      <div className="wrap">
        <div className="pdp">
          <ProductGallery images={product.images} name={product.name} bottleVariant={product.bottle_variant} />
          <div>
            <nav className="crumb" aria-label="Breadcrumb" style={{ marginBottom: 0 }}>
              <Link href="/">Home</Link> / <Link href="/collection">Collection</Link> / {product.name}
            </nav>
            <span className="eyebrow" style={{ display: "block", marginTop: 18 }}>
              Extrait de parfum · {familyLabel}
            </span>
            <h1>{product.name}</h1>
            {product.tagline && (
              <p className="lede" style={{ maxWidth: "42ch" }}>
                {product.tagline}
              </p>
            )}
            {schedule.freeDeliveryToday && (
              <p className="badge-live" style={{ marginTop: 18 }} data-testid="free-delivery-badge">
                Free delivery today
              </p>
            )}
            {schedule.spinnerToday && (
              <p className="badge-live" style={{ marginTop: 18, marginLeft: schedule.freeDeliveryToday ? 8 : 0 }}>
                {dayName(schedule.spinnerDay)} gift spin with every order
              </p>
            )}

            <ProductPurchase
              productId={product.id}
              productName={product.name}
              variants={product.product_variants}
              currency={currency}
              spinnerHint={schedule.spinnerToday}
              shipRow={shipRow}
            />

            {combo ? (
              <div className="pdp-ladder">
                <span className="eyebrow eyebrow-mute" style={{ display: "block", marginBottom: 20 }}>
                  What&rsquo;s in the box
                </span>
                <ul className="combo-list">
                  {comboItems.map((p) => (
                    <li key={p.id}>
                      <Link href={`/product/${p.slug}`}>{p.name}</Link>
                      <span className="small">50 ml</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="pdp-ladder">
                <span className="eyebrow eyebrow-mute" style={{ display: "block", marginBottom: 20 }}>
                  How it wears
                </span>
                <NoteLadder top={product.notes_top} heart={product.notes_heart} base={product.notes_base} size="product" />
              </div>
            )}

            <div className="acc">
              {product.description && (
                <details>
                  <summary>The story</summary>
                  <div className="body">
                    <Paragraphs text={product.description} />
                  </div>
                </details>
              )}
              <details>
                <summary>Ingredients</summary>
                <div className="body">
                  <Paragraphs text={INGREDIENTS} />
                </div>
              </details>
              <details>
                <summary>Longevity &amp; sillage</summary>
                <div className="body">
                  <p>{longevityFor(product.family)}</p>
                </div>
              </details>
              <details>
                <summary>Delivery &amp; returns</summary>
                <div className="body">
                  <Paragraphs text={DELIVERY_AND_RETURNS} />
                </div>
              </details>
              <details>
                <summary>Pay online</summary>
                <div className="body">
                  <BankDetails />
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section" style={{ borderTop: "1px solid var(--color-line-soft)" }}>
          <div className="wrap">
            <div className="section-head">
              <div>
                <span className="eyebrow">{combo ? "Or one at a time" : "Wears well with"}</span>
                <h2 className="display h3" style={{ marginTop: 12 }}>
                  {combo ? "Buy them separately" : "Layer it"}
                </h2>
              </div>
            </div>
            <div className="grid-3">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  currency={currency}
                  spinnerHint={schedule.spinnerToday}
                  sizes="(max-width: 820px) 100vw, 33vw"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.tagline ?? product.description ?? undefined,
          image: product.images.length
            ? product.images.map((src) => (src.startsWith("/") ? `${SITE_URL}${src}` : src))
            : [`${SITE_URL}/product/${product.slug}/opengraph-image`],
          url: `${SITE_URL}/product/${product.slug}`,
          sku: product.slug,
          category: "Fragrance > Extrait de parfum",
          brand: { "@type": "Brand", name: "Razed by Ahmad" },
          ...(range
            ? {
                offers: {
                  "@type": "AggregateOffer",
                  priceCurrency: currency,
                  lowPrice: range[0],
                  highPrice: range[1],
                  offerCount: product.product_variants.length,
                  availability: product.product_variants.some((v) => v.stock > 0)
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                },
              }
            : {}),
        }}
      />
    </>
  );
}
