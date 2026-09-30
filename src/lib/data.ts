// Storefront reads. Every function degrades gracefully: if Supabase is
// unreachable the page still renders, with `error` set for a friendly notice.

import { cache } from "react";
import type { Tables } from "@/lib/database.types";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";

export type Product = Tables<"products">;
export type Variant = Tables<"product_variants">;
export type ProductWithVariants = Product & { product_variants: Variant[] };
export type Settings = Tables<"site_settings">;
export type Prize = Tables<"spin_prizes">;

export type Result<T> = { data: T; error: string | null };

export const FAMILIES = ["oud", "amber", "floral", "musk", "smoke"] as const;
export type Family = (typeof FAMILIES)[number];

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  whatsapp_number: "923323426801",
  free_delivery_day: 1,
  spinner_day: 6,
  spinner_enabled: true,
  announcement_text: null,
  hero_headline: "What stays\nafter the *fire*",
  hero_sub:
    "Six extraits built from smoke, resin and oud — the notes that keep working long after the top has burned off. Blended in batches of fifty, bottled by hand.",
  currency: "PKR",
  about_text: null,
  updated_at: new Date(0).toISOString(),
};

const OFFLINE = "We couldn't reach the shop right now. Please refresh in a moment — or order directly on WhatsApp.";

const PRODUCT_SELECT = "*, product_variants(*)" as const;

function sortVariants<T extends { product_variants: Variant[] }>(p: T): T {
  return { ...p, product_variants: [...p.product_variants].sort((a, b) => a.size_ml - b.size_ml) };
}

export function defaultVariant(p: ProductWithVariants): Variant | undefined {
  return p.product_variants.find((v) => v.is_default) ?? p.product_variants[0];
}

export function priceRange(p: ProductWithVariants): [number, number] | null {
  if (!p.product_variants.length) return null;
  const prices = p.product_variants.map((v) => Number(v.price));
  return [Math.min(...prices), Math.max(...prices)];
}

/** "Saffron · Taif rose · Laotian oud" — the lead note of each tier. */
export function leadNotes(p: Pick<Product, "notes_top" | "notes_heart" | "notes_base">): string {
  return [p.notes_top[0], p.notes_heart[0], p.notes_base[0]].filter(Boolean).join(" · ");
}

export const getSettings = cache(async (): Promise<Result<Settings>> => {
  if (!isSupabaseConfigured) return { data: DEFAULT_SETTINGS, error: OFFLINE };
  try {
    const { data, error } = await createPublicClient().from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return { data: data ?? DEFAULT_SETTINGS, error: null };
  } catch {
    return { data: DEFAULT_SETTINGS, error: OFFLINE };
  }
});

export const getActiveProducts = cache(async (): Promise<Result<ProductWithVariants[]>> => {
  if (!isSupabaseConfigured) return { data: [], error: OFFLINE };
  try {
    const { data, error } = await createPublicClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { data: (data ?? []).map(sortVariants), error: null };
  } catch {
    return { data: [], error: OFFLINE };
  }
});

export const getProductBySlug = cache(async (slug: string): Promise<Result<ProductWithVariants | null>> => {
  if (!isSupabaseConfigured) return { data: null, error: OFFLINE };
  try {
    const { data, error } = await createPublicClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    return { data: data ? sortVariants(data) : null, error: null };
  } catch {
    return { data: null, error: OFFLINE };
  }
});

export const getActivePrizes = cache(async (): Promise<Result<Prize[]>> => {
  if (!isSupabaseConfigured) return { data: [], error: OFFLINE };
  try {
    const { data, error } = await createPublicClient()
      .from("spin_prizes")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch {
    return { data: [], error: OFFLINE };
  }
});

export type OrderIntentPublic = {
  code: string;
  product_name: string;
  size_ml: number;
  qty: number;
  unit_price: number;
  free_delivery_applied: boolean;
  spin_eligible: boolean;
  spin_used: boolean;
  prize_id: string | null;
  prize_label: string | null;
  prize_short_label: string | null;
};

export async function getOrderIntent(code: string): Promise<Result<OrderIntentPublic | null>> {
  if (!isSupabaseConfigured) return { data: null, error: OFFLINE };
  try {
    const { data, error } = await createPublicClient().rpc("get_order_intent", { p_code: code });
    if (error) throw error;
    return { data: (data as OrderIntentPublic | null) ?? null, error: null };
  } catch {
    return { data: null, error: OFFLINE };
  }
}

/** Pick related products: same family first, then the rest, excluding self. */
export function relatedProducts(all: ProductWithVariants[], self: ProductWithVariants, n = 3) {
  const others = all.filter((p) => p.id !== self.id);
  const same = others.filter((p) => p.family && p.family === self.family);
  const rest = others.filter((p) => !same.includes(p));
  return [...same, ...rest].slice(0, n);
}
