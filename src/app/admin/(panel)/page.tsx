import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { dayName, getSchedule, karachiStartOfDay, karachiWeekday } from "@/lib/schedule";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const now = new Date();
  const todayStart = karachiStartOfDay(now);
  // Week starts Monday, Karachi time.
  const daysSinceMonday = (karachiWeekday(now) + 6) % 7;
  const weekStart = new Date(todayStart.getTime() - daysSinceMonday * 86_400_000);

  const [products, settings, todayOrders, weekSpins, recent] = await Promise.all([
    supabase.from("products").select("id, is_active"),
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("order_intents").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
    supabase
      .from("order_intents")
      .select("id", { count: "exact", head: true })
      .eq("spin_used", true)
      .gte("created_at", weekStart.toISOString()),
    supabase.from("order_intents").select("code, product_name, size_ml, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const all = products.data ?? [];
  const active = all.filter((p) => p.is_active).length;
  const s = settings.data;
  const schedule = s ? getSchedule(s, now) : null;

  return (
    <>
      <div className="adm-head">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Assalam o Alaikum</h1>
        </div>
        <Link className="btn btn-solid btn-sm" href="/admin/products/new">
          + Add a product
        </Link>
      </div>

      {schedule && s && (
        <div className="adm-card" style={{ marginBottom: 20 }} data-testid="rules-status">
          <h2>Today&rsquo;s rules</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8 }}>
            Today is <b style={{ fontWeight: 500, color: "var(--color-gold-hi)" }}>{dayName(schedule.today)}</b> in Pakistan.{" "}
            <span className="pill green">Free delivery is live every day</span>{" "}
            {!s.spinner_enabled ? (
              <span className="pill">Gift spin is switched off</span>
            ) : schedule.spinnerToday ? (
              <span className="pill green">Gift spin is live</span>
            ) : (
              <span className="small">Gift spin runs on {dayName(s.spinner_day)}s.</span>
            )}
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div className="adm-card stat">
          <b>{all.length}</b>
          <span>Products</span>
        </div>
        <div className="adm-card stat">
          <b>{active}</b>
          <span>Live on the site</span>
        </div>
        <div className="adm-card stat">
          <b>{all.length - active}</b>
          <span>Hidden</span>
        </div>
        <div className="adm-card stat">
          <b>{todayOrders.count ?? 0}</b>
          <span>Buy clicks today</span>
        </div>
        <div className="adm-card stat">
          <b>{weekSpins.count ?? 0}</b>
          <span>Spins this week</span>
        </div>
      </div>

      <div className="adm-card">
        <h2>Latest buy clicks</h2>
        {recent.data?.length ? (
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
            {recent.data.map((o) => (
              <li key={o.code} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}>
                <span>
                  <b style={{ fontWeight: 400, color: "var(--color-gold-hi)", letterSpacing: ".1em" }}>{o.code}</b> ·{" "}
                  {o.product_name} {o.size_ml} ml
                </span>
                <span className="small">
                  {new Date(o.created_at).toLocaleString("en-PK", {
                    timeZone: "Asia/Karachi",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small">No orders started yet.</p>
        )}
        <Link className="small" href="/admin/orders" style={{ display: "inline-block", marginTop: 16, color: "var(--color-gold)" }}>
          All orders →
        </Link>
      </div>
    </>
  );
}
