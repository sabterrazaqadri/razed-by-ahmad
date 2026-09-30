import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin";
import { EMPTY_PRODUCT } from "@/lib/validation";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <>
      <div className="adm-head">
        <div>
          <Link className="small" href="/admin/products">
            ← Products
          </Link>
          <h1 style={{ marginTop: 8 }}>New product</h1>
        </div>
      </div>
      <ProductForm initial={EMPTY_PRODUCT} />
    </>
  );
}
