import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin";
import { FAMILY_OPTIONS, type ProductInput } from "@/lib/validation";

export const metadata = { title: "Edit product" };

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const { data: p } = await supabase.from("products").select("*, product_variants(*)").eq("id", id).maybeSingle();
  if (!p) notFound();

  const family = (FAMILY_OPTIONS as readonly string[]).includes(p.family ?? "") ? (p.family as ProductInput["family"]) : "";
  const initial: ProductInput = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    tagline: p.tagline ?? "",
    description: p.description ?? "",
    family,
    badge: p.badge ?? "",
    bottle_variant: p.bottle_variant === "b" || p.bottle_variant === "c" ? p.bottle_variant : "a",
    notes_top: p.notes_top,
    notes_heart: p.notes_heart,
    notes_base: p.notes_base,
    is_active: p.is_active,
    is_featured: p.is_featured,
    sort_order: p.sort_order,
    images: p.images,
    variants: [...p.product_variants]
      .sort((a, b) => a.size_ml - b.size_ml)
      .map((v) => ({
        id: v.id,
        size_ml: v.size_ml,
        price: Number(v.price),
        compare_at_price: v.compare_at_price === null ? null : Number(v.compare_at_price),
        stock: v.stock,
        is_default: v.is_default,
      })),
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <Link className="small" href="/admin/products">
            ← Products
          </Link>
          <h1 style={{ marginTop: 8 }}>{p.name}</h1>
        </div>
        {!p.is_active && <span className="pill">Hidden from shop</span>}
      </div>
      <ProductForm key={p.updated_at} initial={initial} />
    </>
  );
}
