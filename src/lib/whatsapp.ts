// Pure builders for the pre-filled WhatsApp order message. No I/O here —
// everything is passed in so it can be unit-tested and reused client-side.

import { BANK_ACCOUNT } from "@/content/payment";
import { formatPrice } from "./format";

export type OrderMessageInput = {
  code: string;
  productName: string;
  sizeMl: number;
  unitPrice: number;
  qty?: number;
  currency?: string;
  freeDeliveryApplied?: boolean;
  /** Human label of the free-delivery day, e.g. "Monday". */
  freeDeliveryDayName?: string;
  /** Prize label if a gift spin was won. */
  spinPrize?: string | null;
  /** Human label of the spinner day, e.g. "Saturday". */
  spinnerDayName?: string;
};

export function buildOrderMessage(input: OrderMessageInput): string {
  const qty = input.qty ?? 1;
  const currency = input.currency ?? "PKR";
  const total = input.unitPrice * qty;

  const lines: string[] = [
    "Assalam o Alaikum — Razed by Ahmad",
    "",
    `Order: ${input.code}`,
    `Item: ${input.productName} — ${input.sizeMl} ml`,
  ];
  if (qty > 1) lines.push(`Quantity: ${qty}`);
  lines.push(`Price: ${formatPrice(total, currency)}`);
  if (input.freeDeliveryApplied) {
    lines.push("Free delivery: applied");
  }
  if (input.spinPrize) {
    lines.push(`${input.spinnerDayName ?? "Saturday"} gift spin: ${input.spinPrize}`);
  }
  lines.push("", "Name:", "Address:", "City:");
  lines.push(
    "",
    "Paying online? (optional)",
    `${BANK_ACCOUNT.bank} — ${BANK_ACCOUNT.name}`,
    `A/C: ${BANK_ACCOUNT.number}`,
  );
  return lines.join("\n");
}

/** Digits only — wa.me rejects "+", spaces and dashes. */
export function normaliseWhatsAppNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function buildWhatsAppUrl(number: string, text?: string): string {
  const base = `https://wa.me/${normaliseWhatsAppNumber(number)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** The one-liner shown under every buy button. */
export function buyNoteSummary(productName: string, sizeMl: number, price: number, currency = "PKR") {
  return `${productName} · ${sizeMl} ml · ${formatPrice(price, currency)}`;
}
