import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpinStage } from "@/components/spin/SpinStage";
import { SpinCleanup } from "@/components/spin/SpinCleanup";
import { getActivePrizes, getOrderIntent, getSettings } from "@/lib/data";
import { dayName } from "@/lib/schedule";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your gift spin",
  robots: { index: false, follow: false },
};

type Params = Promise<{ code: string }>;

export default async function SpinPage({ params }: { params: Params }) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).toUpperCase();
  if (!/^RZ-[A-Z0-9]{4,8}$/.test(code)) notFound();

  const [{ data: intent, error }, { data: settings }, { data: prizes }] = await Promise.all([
    getOrderIntent(code),
    getSettings(),
    getActivePrizes(),
  ]);

  if (!intent) {
    if (error) {
      return (
        <div className="wrap spin-page">
          <p className="notice" role="status">
            {error}
          </p>
        </div>
      );
    }
    notFound();
  }

  const spinDay = dayName(settings.spinner_day);
  const base = {
    code: intent.code,
    productName: intent.product_name,
    sizeMl: intent.size_ml,
    unitPrice: Number(intent.unit_price),
    qty: intent.qty,
    currency: settings.currency,
    freeDeliveryApplied: intent.free_delivery_applied,
    freeDeliveryDayName: dayName(settings.free_delivery_day),
    spinnerDayName: spinDay,
  };
  const plainUrl = buildWhatsAppUrl(settings.whatsapp_number, buildOrderMessage(base));

  if (!intent.spin_eligible) {
    return (
      <div className="wrap spin-page">
        <SpinCleanup />
        <span className="eyebrow">Order {intent.code}</span>
        <h1 className="display h2" style={{ margin: "16px 0 14px" }}>
          No spin on this <em>one</em>
        </h1>
        <p>
          The wheel opens for orders placed on a {spinDay}. Your order is still waiting in WhatsApp — just confirm your
          address there.
        </p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <a className="btn btn-solid" href={plainUrl} target="_blank" rel="noopener noreferrer">
            Continue on WhatsApp
          </a>
          <Link className="btn btn-ghost" href="/collection">
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  const initial =
    intent.spin_used && intent.prize_label
      ? {
          prizeId: intent.prize_id,
          label: intent.prize_label,
          whatsappUrl: buildWhatsAppUrl(
            settings.whatsapp_number,
            buildOrderMessage({ ...base, spinPrize: intent.prize_label }),
          ),
        }
      : null;

  return (
    <div className="wrap spin-page">
      {initial && <SpinCleanup />}
      <SpinStage
        order={{ code: intent.code, productName: intent.product_name, sizeMl: intent.size_ml, whatsappUrl: plainUrl }}
        prizes={prizes.map((p) => ({ id: p.id, short_label: p.short_label }))}
        spinnerDayName={spinDay}
        initial={initial}
        headingId="spin-title"
        as="h1"
      />
    </div>
  );
}
