"use client";

import { useState, type ReactNode } from "react";
import { createOrderIntent } from "@/app/actions/order";
import { useSpin } from "@/components/spin/SpinProvider";
import { WaIcon } from "@/components/WaIcon";

type Props = {
  productId: string;
  variantId: string | undefined;
  qty?: number;
  className?: string;
  children?: ReactNode;
  /**
   * Server-rendered hint that today is spin day. Only used to decide whether
   * to pre-open a tab (to dodge popup blockers); the server action decides.
   */
  spinnerHint?: boolean;
  testId?: string;
};

export function BuyButton({
  productId,
  variantId,
  qty = 1,
  className = "btn btn-wa",
  children = "Buy now",
  spinnerHint = false,
  testId = "buy-now",
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { openSpin } = useSpin();

  async function onClick() {
    if (pending || !variantId) return;
    setPending(true);
    setError(null);

    // Open the tab inside the click so popup blockers allow it; fill it in once
    // the server has created the order. Skipped when a spin is expected.
    let pre: Window | null = null;
    if (!spinnerHint) {
      try {
        pre = window.open("about:blank", "_blank");
      } catch {
        pre = null;
      }
    }

    try {
      const res = await createOrderIntent({ productId, variantId, qty });
      if (!res.ok) {
        pre?.close();
        setError(res.error);
        return;
      }
      if (res.spinEligible) {
        pre?.close();
        openSpin({ code: res.code, productName: res.productName, sizeMl: res.sizeMl, whatsappUrl: res.whatsappUrl });
        return;
      }
      if (pre && !pre.closed) {
        pre.opener = null;
        pre.location.href = res.whatsappUrl;
      } else {
        window.location.href = res.whatsappUrl;
      }
    } catch {
      pre?.close();
      setError("We couldn't reach the shop. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={pending || !variantId}
        aria-busy={pending}
        data-testid={testId}
      >
        <WaIcon /> {pending ? "Opening…" : children}
      </button>
      {error && (
        <span className="err" role="alert" style={{ display: "block", marginTop: 8 }}>
          {error}
        </span>
      )}
    </>
  );
}
