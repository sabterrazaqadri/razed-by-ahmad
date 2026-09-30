import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/data";
import { SITE_URL } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await getActiveProducts();
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/collection`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/delivery`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
