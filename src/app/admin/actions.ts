"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, revalidateStore, storagePathFromUrl } from "@/lib/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { prizesSchema, productSchema, settingsSchema, type PrizesInput, type ProductInput, type SettingsInput } from "@/lib/validation";

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function flatten(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.map(String).join(".");
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

// ── auth ───────────────────────────────────────────────────

export type LoginState = { error: string | null };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "/admin");
  const next = nextRaw.startsWith("/admin") && !nextRaw.startsWith("//") ? nextRaw : "/admin";

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match." };

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "This account isn't set up as the shop admin." };
  }
  redirect(next);
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ── products ───────────────────────────────────────────────

export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string; slug: string }>> {
  const { supabase } = await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: flatten(parsed.error.issues) };
  }
  const p = parsed.data;

  // Exactly one default size.
  const defaultIdx = Math.max(0, p.variants.findIndex((v) => v.is_default));
  const variants = p.variants.map((v, i) => ({ ...v, is_default: i === defaultIdx }));

  const row = {
    name: p.name,
    slug: p.slug,
    tagline: p.tagline.trim() || null,
    description: p.description.trim() || null,
    family: p.family || null,
    badge: p.badge.trim() || null,
    bottle_variant: p.bottle_variant,
    notes_top: p.notes_top,
    notes_heart: p.notes_heart,
    notes_base: p.notes_base,
    is_active: p.is_active,
    is_featured: p.is_featured,
    sort_order: p.sort_order,
    images: p.images,
  };

  let id = p.id;
  let oldSlug: string | null = null;
  let oldImages: string[] = [];

  if (id) {
    const { data: existing } = await supabase.from("products").select("slug, images").eq("id", id).maybeSingle();
    if (!existing) return { ok: false, error: "This product no longer exists." };
    oldSlug = existing.slug;
    oldImages = existing.images;
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) return productDbError(error);
  } else {
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) return productDbError(error);
    id = data.id;
  }

  // Sync variants: delete removed, update kept, insert new.
  const { data: current } = await supabase.from("product_variants").select("id").eq("product_id", id);
  const keep = new Set(variants.map((v) => v.id).filter(Boolean));
  const toDelete = (current ?? []).map((v) => v.id).filter((vid) => !keep.has(vid));
  if (toDelete.length) {
    const { error } = await supabase.from("product_variants").delete().in("id", toDelete);
    if (error) return { ok: false, error: "Saved the product, but couldn't remove an old size. Try saving again." };
  }
  for (const v of variants) {
    const vrow = {
      product_id: id,
      size_ml: v.size_ml,
      price: v.price,
      compare_at_price: v.compare_at_price,
      stock: v.stock,
      is_default: v.is_default,
    };
    const { error } = v.id
      ? await supabase.from("product_variants").update(vrow).eq("id", v.id).eq("product_id", id)
      : await supabase.from("product_variants").insert(vrow);
    if (error) return { ok: false, error: "Saved the product, but a size didn't save. Try saving again." };
  }

  // Clean up images removed in this edit.
  const removed = oldImages.filter((u) => !p.images.includes(u)).map(storagePathFromUrl).filter((x): x is string => !!x);
  if (removed.length) await supabase.storage.from("product-images").remove(removed);

  revalidateStore([p.slug, oldSlug]);
  revalidatePath("/admin/products");
  return { ok: true, data: { id, slug: p.slug } };
}

function productDbError(error: { code?: string; message: string }): ActionResult<{ id: string; slug: string }> {
  if (error.code === "23505")
    return {
      ok: false,
      error: "Another product already uses that web address.",
      fieldErrors: { slug: "Already used by another product — change it slightly" },
    };
  return { ok: false, error: "Couldn't save. Please try again." };
}

export async function setProductActive(id: string, isActive: boolean): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id).select("slug").single();
  if (error) return { ok: false, error: "Couldn't update. Please try again." };
  revalidateStore([data.slug]);
  revalidatePath("/admin/products");
  return { ok: true, data: null };
}

export async function setProductSortOrder(id: string, sortOrder: number): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!Number.isInteger(sortOrder) || Math.abs(sortOrder) > 9999) return { ok: false, error: "Use a whole number." };
  const { data, error } = await supabase.from("products").update({ sort_order: sortOrder }).eq("id", id).select("slug").single();
  if (error) return { ok: false, error: "Couldn't update. Please try again." };
  revalidateStore([data.slug]);
  revalidatePath("/admin/products");
  return { ok: true, data: null };
}

export async function deleteProductPermanently(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data: existing } = await supabase.from("products").select("slug, images").eq("id", id).maybeSingle();
  if (!existing) return { ok: false, error: "Already deleted." };
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete. Please try again." };
  const paths = existing.images.map(storagePathFromUrl).filter((x): x is string => !!x);
  if (paths.length) await supabase.storage.from("product-images").remove(paths);
  revalidateStore([existing.slug]);
  revalidatePath("/admin/products");
  return { ok: true, data: null };
}

// ── settings ───────────────────────────────────────────────

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: flatten(parsed.error.issues) };
  }
  const s = parsed.data;
  const { error } = await supabase
    .from("site_settings")
    .update({
      whatsapp_number: s.whatsapp_number,
      free_delivery_day: s.free_delivery_day,
      spinner_day: s.spinner_day,
      spinner_enabled: s.spinner_enabled,
      announcement_text: s.announcement_text.trim() || null,
      hero_headline: s.hero_headline.trim() || null,
      hero_sub: s.hero_sub.trim() || null,
      currency: s.currency.toUpperCase(),
      about_text: s.about_text.trim() || null,
    })
    .eq("id", 1);
  if (error) return { ok: false, error: "Couldn't save settings. Please try again." };
  revalidatePath("/", "layout");
  return { ok: true, data: null };
}

// ── prizes ─────────────────────────────────────────────────

export async function savePrizes(input: PrizesInput): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = prizesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: flatten(parsed.error.issues) };
  }
  const prizes = parsed.data.prizes;
  if (prizes.filter((p) => p.is_active).length > 0 && prizes.filter((p) => p.is_active && p.weight > 0).length === 0) {
    return { ok: false, error: "At least one active prize needs a weight above 0, or nobody can win anything." };
  }

  const { data: current } = await supabase.from("spin_prizes").select("id");
  const keep = new Set(prizes.map((p) => p.id).filter(Boolean));
  const toDelete = (current ?? []).map((p) => p.id).filter((id) => !keep.has(id));
  if (toDelete.length) {
    const { error } = await supabase.from("spin_prizes").delete().in("id", toDelete);
    if (error) return { ok: false, error: "Couldn't remove a prize. Please try again." };
  }
  for (const [i, p] of prizes.entries()) {
    const row = { label: p.label, short_label: p.short_label, weight: p.weight, is_active: p.is_active, sort_order: i + 1 };
    const { error } = p.id
      ? await supabase.from("spin_prizes").update(row).eq("id", p.id)
      : await supabase.from("spin_prizes").insert(row);
    if (error) return { ok: false, error: "Couldn't save a prize. Please try again." };
  }
  revalidatePath("/", "layout");
  return { ok: true, data: null };
}
