import Image from "next/image";
import Link from "next/link";
import { ActiveToggle, SortOrderInput } from "@/components/admin/ProductRowControls";
import { BottleArt } from "@/components/BottleArt";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Products" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";

  let query = supabase
    .from("products")
    .select("id, name, slug, badge, images, bottle_variant, is_active, sort_order, product_variants(price, stock)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (q) query = query.ilike("name", `%${q.replace(/[%_]/g, "")}%`);

  const [{ data: products, error }, { data: settings }] = await Promise.all([
    query,
    supabase.from("site_settings").select("currency").eq("id", 1).maybeSingle(),
  ]);
  const currency = settings?.currency ?? "PKR";

  return (
    <>
      <div className="adm-head">
        <div>
          <span className="eyebrow">Catalogue</span>
          <h1>Products</h1>
        </div>
        <Link className="btn btn-solid btn-sm" href="/admin/products/new">
          + Add a product
        </Link>
      </div>

      <form role="search" style={{ display: "flex", gap: 8, marginBottom: 18, maxWidth: 480 }}>
        <input className="input" type="search" name="q" defaultValue={q} placeholder="Search by name" aria-label="Search products" />
        <button className="btn btn-sm" type="submit" style={{ height: 46 }}>
          Search
        </button>
      </form>

      {error && <p className="notice">Couldn&rsquo;t load products. Refresh to try again.</p>}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col" style={{ width: 64 }}>
                <span className="sr-only">Image</span>
              </th>
              <th scope="col">Name</th>
              <th scope="col">Price</th>
              <th scope="col">Stock</th>
              <th scope="col">Live</th>
              <th scope="col">Badge</th>
              <th scope="col">Order</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => {
              const prices = p.product_variants.map((v) => Number(v.price));
              const stock = p.product_variants.reduce((n, v) => n + v.stock, 0);
              const min = prices.length ? Math.min(...prices) : null;
              const max = prices.length ? Math.max(...prices) : null;
              return (
                <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.6 }}>
                  <td>
                    <div
                      style={{
                        width: 44,
                        height: 52,
                        position: "relative",
                        background: "var(--color-ink)",
                        border: "1px solid var(--color-line-soft)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {p.images[0] ? (
                        <Image src={p.images[0]} alt="" fill sizes="44px" style={{ objectFit: "cover" }} />
                      ) : (
                        <BottleArt variant={p.bottle_variant} className="" />
                      )}
                    </div>
                  </td>
                  <td>
                    <Link href={`/admin/products/${p.id}`} style={{ color: "var(--color-bone)", fontSize: 15 }}>
                      {p.name}
                    </Link>
                    <div className="small">/{p.slug}</div>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {min === null
                      ? "—"
                      : min === max
                        ? formatPrice(min, currency)
                        : `${formatPrice(min, currency)} – ${formatPrice(max!, currency).replace(/^Rs /, "")}`}
                  </td>
                  <td>
                    <span className={stock <= 5 ? "pill gold" : undefined}>{stock}</span>
                  </td>
                  <td>
                    <ActiveToggle id={p.id} active={p.is_active} name={p.name} />
                  </td>
                  <td>{p.badge ? <span className="pill gold">{p.badge}</span> : <span className="small">—</span>}</td>
                  <td>
                    <SortOrderInput id={p.id} value={p.sort_order} name={p.name} />
                  </td>
                </tr>
              );
            })}
            {products && !products.length && (
              <tr>
                <td colSpan={7} className="small" style={{ padding: 28, textAlign: "center" }}>
                  {q ? `Nothing called “${q}”.` : "No products yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="hint" style={{ marginTop: 12 }}>
        Lower “Order” numbers show first on the site. Tap a name to edit prices, photos and notes.
      </p>
    </>
  );
}
