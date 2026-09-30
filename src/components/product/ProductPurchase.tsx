"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { BuyButton } from "@/components/BuyButton";
import { WaIcon } from "@/components/WaIcon";
import type { Variant } from "@/lib/data";
import { formatPrice } from "@/lib/format";

type Props = {
  productId: string;
  productName: string;
  variants: Variant[];
  currency: string;
  spinnerHint: boolean;
  /** Server-rendered delivery row (so the free-delivery wording is never client-computed). */
  shipRow: ReactNode;
};

function stockLabel(v: Variant) {
  if (v.stock <= 0) return "sold out";
  if (v.stock <= 5) return `only ${v.stock} left`;
  return "in stock";
}

export function ProductPurchase({ productId, productName, variants, currency, spinnerHint, shipRow }: Props) {
  const initial = Math.max(0, variants.findIndex((v) => v.is_default));
  const [idx, setIdx] = useState(initial);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const v = variants[idx];

  if (!v) {
    return (
      <div className="buybox">
        <p className="small">This fragrance is being re-bottled. Message us on WhatsApp to reserve one.</p>
      </div>
    );
  }

  const price = Number(v.price);
  const compare = v.compare_at_price ? Number(v.compare_at_price) : null;
  const soldOut = v.stock <= 0;

  // Roving arrow-key focus for the size radiogroup.
  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const next = (idx + dir + variants.length) % variants.length;
    setIdx(next);
    refs.current[next]?.focus();
  }

  return (
    <>
      <div className="sizes" role="radiogroup" aria-label="Size" onKeyDown={onKey}>
        {variants.map((x, i) => (
          <button
            key={x.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            className="size"
            aria-checked={i === idx}
            aria-disabled={x.stock <= 0}
            tabIndex={i === idx ? 0 : -1}
            onClick={() => setIdx(i)}
            data-testid={`size-${x.size_ml}`}
          >
            <b>{x.size_ml} ml</b>
            <span>{formatPrice(Number(x.price), currency)}</span>
          </button>
        ))}
      </div>

      <div className="buybox">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18, gap: 12 }}>
          <span>
            <span className="pdp-price" data-testid="pdp-price">
              {formatPrice(price, currency)}
            </span>
            {compare && compare > price && <span className="compare">{formatPrice(compare, currency)}</span>}
          </span>
          <span className="small">
            {v.size_ml} ml · {stockLabel(v)}
          </span>
        </div>
        {soldOut ? (
          <button type="button" className="btn btn-ghost btn-lg btn-block" disabled>
            Sold out in {v.size_ml} ml
          </button>
        ) : (
          <BuyButton
            productId={productId}
            variantId={v.id}
            className="btn btn-solid btn-lg btn-block"
            spinnerHint={spinnerHint}
            testId="pdp-buy"
          >
            Buy now on WhatsApp
          </BuyButton>
        )}
        <div className="buy-note">
          <WaIcon />
          <span>
            Opens WhatsApp with{" "}
            <b>
              {productName} · {v.size_ml} ml · {formatPrice(price, currency)}
            </b>{" "}
            already written. Confirm your address in the chat and pay cash on delivery or by transfer.
          </span>
        </div>
        {shipRow}
      </div>

      {!soldOut && (
        <div className="mobar">
          <div className="p">
            <b>{formatPrice(price, currency)}</b>
            <span>
              {productName} · {v.size_ml} ml
            </span>
          </div>
          <BuyButton
            productId={productId}
            variantId={v.id}
            className="btn btn-solid"
            spinnerHint={spinnerHint}
            testId="mobar-buy"
          >
            Buy on WhatsApp
          </BuyButton>
        </div>
      )}
    </>
  );
}
