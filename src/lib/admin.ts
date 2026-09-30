import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Gate for every admin page and action: signed in AND listed in admin_users.
 * RLS enforces the same rule in the database, so this is belt and braces.
 */
export async function requireAdmin() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-admin");
  }
  return { supabase, user };
}

/** Refresh every public page a product appears on. */
export function revalidateStore(slugs: (string | null | undefined)[] = []) {
  revalidatePath("/");
  revalidatePath("/collection");
  revalidatePath("/sitemap.xml");
  for (const s of new Set(slugs.filter(Boolean))) revalidatePath(`/product/${s}`);
}

const PUBLIC_PREFIX = "/storage/v1/object/public/product-images/";

/** Storage object path from a public URL, or null if it isn't one of ours. */
export function storagePathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const i = u.pathname.indexOf(PUBLIC_PREFIX);
    return i === -1 ? null : decodeURIComponent(u.pathname.slice(i + PUBLIC_PREFIX.length));
  } catch {
    return null;
  }
}
