import Link from "next/link";
import { BuyButton } from "@/components/BuyButton";
import { MiniLadder } from "@/components/NoteLadder";
import { ProductMedia } from "@/components/ProductMedia";
import { defaultVariant, leadNotes, type ProductWithVariants, type Variant } from "@/lib/data";
import { formatPrice } from "@/lib/format";

type Props = {
  product: ProductWithVariants;
  currency: string;
  spinnerHint: boolean;
  /** Show this size instead of the default (e.g. when filtering by size). */
  variant?: Variant;
  priority?: boolean;
  sizes?: string;
};

export function ProductCard({
  product,
  currency,
  spinnerHint,
  variant,
  priority,
  sizes = "(max-width: 820px) 50vw, 33vw",
}: Props) {
  const v = variant ?? defaultVariant(product);
  const href = `/product/${product.slug}`;
  const soldOut = v ? v.stock <= 0 : true;

  return (
    <article className="card" data-testid="product-card">
      <Link className="card-stage" href={href} tabIndex={-1} aria-hidden="true">
        {product.badge && <span className="card-tag">{product.badge}</span>}
        <ProductMedia
          src={product.images[0]}
          alt={`${product.name} — extrait de parfum`}
          bottleVariant={product.bottle_variant}
          sizes={sizes}
          priority={priority}
        />
      </Link>
      <div className="card-top">
        <div>
          <h3>
            <Link href={href}>{product.name}</Link>
          </h3>
          <p className="notes">{leadNotes(product)}</p>
        </div>
        <MiniLadder />
      </div>
      <div className="card-foot">
        {v ? (
          <div>
            <span className="price">{formatPrice(Number(v.price), currency)}</span>{" "}
            <span className="small">· {v.size_ml} ml</span>
            {v.compare_at_price && Number(v.compare_at_price) > Number(v.price) && (
              <span className="compare">{formatPrice(Number(v.compare_at_price), currency)}</span>
            )}
          </div>
        ) : (
          <span className="small">Coming soon</span>
        )}
        {soldOut ? (
          <Link className="btn btn-ghost" href={href}>
            Sold out
          </Link>
        ) : (
          <BuyButton productId={product.id} variantId={v?.id} spinnerHint={spinnerHint} />
        )}
      </div>
    </article>
  );
}
