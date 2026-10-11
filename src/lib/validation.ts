// Zod schemas shared by the admin forms (client-side, via react-hook-form)
// and the Server Actions (server-side, the one that actually counts).

import { z } from "zod";

export const FAMILY_OPTIONS = ["oud", "amber", "floral", "musk", "smoke"] as const;

const noteList = z.array(z.string().trim().min(1).max(40)).max(12, "Twelve notes at most");

export const variantSchema = z.object({
  id: z.string().optional(),
  size_ml: z
    .number({ error: "Enter a size" })
    .int("Whole millilitres only")
    .min(1, "At least 1 ml")
    .max(1000, "That's a big bottle — max 1000 ml"),
  price: z.number({ error: "Enter a price" }).gt(0, "Enter a price above 0").max(10_000_000),
  compare_at_price: z.number().min(0).max(10_000_000).nullable(),
  stock: z.number({ error: "Enter stock (0 if none)" }).int("Whole numbers only").min(0, "Stock can't be negative"),
  is_default: z.boolean(),
});

export const productSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Give it a name").max(80, "Keep the name under 80 characters"),
    slug: z
      .string()
      .trim()
      .min(1, "The web address can't be empty")
      .max(80)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and single dashes only"),
    tagline: z.string().max(400, "Keep the short description under 400 characters"),
    description: z.string().max(4000, "Keep the long description under 4000 characters"),
    family: z.enum([...FAMILY_OPTIONS, ""]),
    badge: z.string().trim().max(30, "Badges are short — 30 characters max"),
    bottle_variant: z.enum(["a", "b", "c"]),
    notes_top: noteList,
    notes_heart: noteList,
    notes_base: noteList,
    is_active: z.boolean(),
    is_featured: z.boolean(),
    sort_order: z.number({ error: "Enter a number" }).int().min(-9999).max(9999),
    images: z.array(z.union([z.string().url(), z.string().regex(/^\/[^/]/, "Must be a URL or a /public path")])).max(12, "Twelve images at most"),
    variants: z.array(variantSchema).min(1, "Add at least one size"),
  })
  .superRefine((p, ctx) => {
    const sizes = p.variants.map((v) => v.size_ml);
    sizes.forEach((s, i) => {
      if (sizes.indexOf(s) !== i)
        ctx.addIssue({ code: "custom", path: ["variants", i, "size_ml"], message: "This size is listed twice" });
    });
    p.variants.forEach((v, i) => {
      if (v.compare_at_price !== null && v.compare_at_price <= v.price)
        ctx.addIssue({
          code: "custom",
          path: ["variants", i, "compare_at_price"],
          message: "The 'was' price should be higher than the price",
        });
    });
  });

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;

export const EMPTY_PRODUCT: ProductInput = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  family: "",
  badge: "",
  bottle_variant: "a",
  notes_top: [],
  notes_heart: [],
  notes_base: [],
  is_active: true,
  is_featured: false,
  sort_order: 100,
  images: [],
  variants: [
    { size_ml: 30, price: 0, compare_at_price: null, stock: 0, is_default: false },
    { size_ml: 50, price: 0, compare_at_price: null, stock: 0, is_default: true },
    { size_ml: 100, price: 0, compare_at_price: null, stock: 0, is_default: false },
  ],
};

export const settingsSchema = z.object({
  whatsapp_number: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, "Digits only, with country code and no + (e.g. 923001234567)"),
  free_delivery_day: z.number().int().min(0).max(6),
  spinner_day: z.number().int().min(0).max(6),
  spinner_enabled: z.boolean(),
  announcement_text: z.string().max(160, "Keep the announcement under 160 characters"),
  hero_headline: z.string().max(120, "Keep the headline under 120 characters"),
  hero_sub: z.string().max(400, "Keep this under 400 characters"),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, "Three-letter currency code, e.g. PKR"),
  about_text: z.string().max(3000, "Keep the story under 3000 characters"),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export const prizeSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, "Describe the prize").max(80),
  short_label: z.string().trim().min(1, "Wheel text needed").max(14, "Wheel text must fit — 14 characters max"),
  weight: z.number({ error: "Enter a weight" }).int("Whole numbers only").min(0, "0 or more").max(1000),
  is_active: z.boolean(),
});

export const prizesSchema = z.object({
  prizes: z.array(prizeSchema).max(16, "Sixteen prizes at most — the wheel gets unreadable"),
});

export type PrizesInput = z.infer<typeof prizesSchema>;
