// Shop policy copy shown in the product accordions and on /delivery.
// ── FOR AHMAD ─────────────────────────────────────────────────────────────
// This is placeholder wording. Replace it with your real delivery / returns
// (RTO) policy. Keep each paragraph short. Blank line = new paragraph.

export const DELIVERY_AND_RETURNS = `Orders confirmed on WhatsApp ship within 24 hours. Delivery is free every day, and orders across Pakistan usually arrive within 2–4 working days.

Pay cash on delivery, or pay online by bank transfer to Bank Al Habib — Ahmed Raza, account 5045-0044-000937-01-4 — and send the screenshot on WhatsApp. Delivery is free every day.

If a bottle arrives damaged or leaking, send a photo on WhatsApp within 48 hours and we replace it. Because perfume is a personal-care product, opened bottles can't be returned — ask for a sample vial first if you're unsure.`;

export const INGREDIENTS = `Alcohol denat., parfum (fragrance), aqua. Extrait concentration — around 28% perfume oil — so a little goes a long way.

Blended with natural materials alongside modern aroma molecules. May contain naturally occurring limonene, linalool, citral, geraniol, eugenol and coumarin. Patch-test if your skin is sensitive. Keep away from flame and out of direct sunlight.`;

const LONGEVITY: Record<string, string> = {
  oud: "Eight to twelve hours on skin, longer on fabric. Sillage is big for the first two hours — two sprays is plenty.",
  amber: "Seven to ten hours. Projects softly for the first hour, then settles into a warm skin scent that people notice up close.",
  floral: "Six to nine hours. Moderate sillage — present across a table, not across a room.",
  musk: "Six to eight hours, sitting close to the skin. Made to be discovered rather than announced.",
  smoke: "Eight to ten hours. Dry, diffusive opening; the base holds on clothes for days.",
};

export function longevityFor(family: string | null | undefined) {
  return (family && LONGEVITY[family]) || "Eight hours or more on skin. Extrait strength, so start with one or two sprays.";
}
