import { ImageResponse } from "next/og";
import { OgCard } from "@/components/OgCard";

export const alt = "Razed by Ahmad — Extrait de parfum, Pakistan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <OgCard
      eyebrow="Extrait de parfum · Pakistan"
      title="What stays after the fire"
      sub="Extraits of smoke, resin and oud. Order on WhatsApp — cash on delivery nationwide."
    />,
    size,
  );
}
