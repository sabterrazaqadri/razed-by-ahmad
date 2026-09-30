"use server";

// Buy Now + gift spin. The authoritative rules (Karachi weekday, free delivery,
// spin eligibility, weighted prize pick, one spin per order) run inside the
// database functions `create_order_intent` and `spin_order` — see
// supabase/migrations/20260930000002_order_functions.sql. Nothing here trusts
// the browser's clock or input beyond two IDs and a quantity.

import { z } from "zod";
import { getSettings } from "@/lib/data";
import { dayName } from "@/lib/schedule";
import { createPublicClient } from "@/lib/supabase/public";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

const orderInput = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  qty: z.number().int().min(1).max(20).default(1),
});

type IntentRow = {
  code: string;
  product_name: string;
  size_ml: number;
  qty: number;
  unit_price: number;
  free_delivery_applied: boolean;
  spin_eligible: boolean;
  whatsapp_number: string;
};

export type OrderIntentResult =
  | {
      ok: true;
      code: string;
      productName: string;
      sizeMl: number;
      unitPrice: number;
      qty: number;
      freeDeliveryApplied: boolean;
      spinEligible: boolean;
      /** Ready-to-open WhatsApp link (without a prize line). */
      whatsappUrl: string;
    }
  | { ok: false; error: string };

const FRIENDLY: Record<string, string> = {
  variant_not_found: "That size is no longer available. Please refresh the page.",
  product_not_found: "This fragrance is no longer available.",
  invalid_qty: "Please choose a quantity between 1 and 20.",
};

export async function createOrderIntent(input: {
  productId: string;
  variantId: string;
  qty?: number;
}): Promise<OrderIntentResult> {
  const parsed = orderInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Something about that order looked wrong. Please refresh and try again." };

  try {
    const [{ data, error }, settings] = await Promise.all([
      createPublicClient().rpc("create_order_intent", {
        p_product_id: parsed.data.productId,
        p_variant_id: parsed.data.variantId,
        p_qty: parsed.data.qty,
      }),
      getSettings(),
    ]);
    if (error) {
      const key = Object.keys(FRIENDLY).find((k) => error.message.includes(k));
      return { ok: false, error: key ? FRIENDLY[key] : "We couldn't start your order. Please try again." };
    }
    const row = data as unknown as IntentRow;
    const s = settings.data;

    const text = buildOrderMessage({
      code: row.code,
      productName: row.product_name,
      sizeMl: row.size_ml,
      unitPrice: Number(row.unit_price),
      qty: row.qty,
      currency: s.currency,
      freeDeliveryApplied: row.free_delivery_applied,
      freeDeliveryDayName: dayName(s.free_delivery_day),
    });

    return {
      ok: true,
      code: row.code,
      productName: row.product_name,
      sizeMl: row.size_ml,
      unitPrice: Number(row.unit_price),
      qty: row.qty,
      freeDeliveryApplied: row.free_delivery_applied,
      spinEligible: row.spin_eligible,
      whatsappUrl: buildWhatsAppUrl(row.whatsapp_number, text),
    };
  } catch {
    return { ok: false, error: "We couldn't reach the shop. Please check your connection and try again." };
  }
}

type SpinRow = { code: string; prize_id: string | null; label: string | null; short_label: string | null; repeat: boolean };
type IntentPublic = {
  code: string;
  product_name: string;
  size_ml: number;
  qty: number;
  unit_price: number;
  free_delivery_applied: boolean;
};

export type SpinResult =
  | {
      ok: true;
      code: string;
      prizeId: string | null;
      label: string;
      shortLabel: string | null;
      repeat: boolean;
      whatsappUrl: string;
    }
  | { ok: false; error: string };

const codeInput = z.string().trim().regex(/^RZ-[A-Z0-9]{4,8}$/i);

export async function spinOrder(code: string): Promise<SpinResult> {
  const parsed = codeInput.safeParse(code);
  if (!parsed.success) return { ok: false, error: "That order code doesn't look right." };

  try {
    const db = createPublicClient();
    const { data, error } = await db.rpc("spin_order", { p_code: parsed.data });
    if (error) {
      if (error.message.includes("not_eligible"))
        return { ok: false, error: "This order wasn't placed on a spin day, so it has no spin." };
      if (error.message.includes("order_not_found")) return { ok: false, error: "We couldn't find that order." };
      return { ok: false, error: "The wheel is stuck — please try again in a moment." };
    }
    const spin = data as unknown as SpinRow;

    const [{ data: intentData }, settings] = await Promise.all([
      db.rpc("get_order_intent", { p_code: spin.code }),
      getSettings(),
    ]);
    const intent = intentData as unknown as IntentPublic;
    const s = settings.data;

    const text = buildOrderMessage({
      code: intent.code,
      productName: intent.product_name,
      sizeMl: intent.size_ml,
      unitPrice: Number(intent.unit_price),
      qty: intent.qty,
      currency: s.currency,
      freeDeliveryApplied: intent.free_delivery_applied,
      freeDeliveryDayName: dayName(s.free_delivery_day),
      spinPrize: spin.label,
      spinnerDayName: dayName(s.spinner_day),
    });

    return {
      ok: true,
      code: spin.code,
      prizeId: spin.prize_id,
      label: spin.label ?? "A little something",
      shortLabel: spin.short_label,
      repeat: spin.repeat,
      whatsappUrl: buildWhatsAppUrl(s.whatsapp_number, text),
    };
  } catch {
    return { ok: false, error: "We couldn't reach the shop. Please check your connection and try again." };
  }
}
