import { ImageResponse } from "next/og";
import { OgCard } from "@/components/OgCard";
import { defaultVariant, getProductBySlug, getSettings, leadNotes } from "@/lib/data";
import { formatPrice } from "@/lib/format";

export const alt = "Razed by Ahmad fragrance";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ data: p }, { data: s }] = await Promise.all([getProductBySlug(slug), getSettings()]);
  const v = p ? defaultVariant(p) : undefined;
  return new ImageResponse(
    <OgCard
      eyebrow={p ? `Extrait de parfum · ${p.family ?? "Karachi"}` : "Extrait de parfum"}
      title={p?.name ?? "Razed by Ahmad"}
      sub={
        p
          ? `${leadNotes(p)}${v ? ` — ${formatPrice(Number(v.price), s.currency)} · ${v.size_ml} ml` : ""}`
          : "Order on WhatsApp — cash on delivery nationwide."
      }
    />,
    size,
  );
}
