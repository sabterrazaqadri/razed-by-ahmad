import Link from "next/link";
import { signOut } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="adm">
      <aside className="adm-side">
        <Link href="/admin" className="wordmark" style={{ textAlign: "left", fontSize: 20, textIndent: 0 }}>
          RAZED<span className="wordmark-sub" style={{ textIndent: 0 }}>Shop admin</span>
        </Link>
        <AdminNav />
        <div style={{ marginTop: "auto", display: "grid", gap: 10 }}>
          <span className="small" style={{ wordBreak: "break-all" }}>
            {user.email}
          </span>
          <Link className="btn btn-ghost btn-sm" href="/" target="_blank">
            View site ↗
          </Link>
          <form action={signOut}>
            <button type="submit" className="btn btn-ghost btn-sm btn-block">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div style={{ minWidth: 0 }}>
        <div className="adm-mnav">
          <AdminNav mobile />
          <form action={signOut} style={{ marginLeft: "auto" }}>
            <button type="submit">Sign out</button>
          </form>
        </div>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
