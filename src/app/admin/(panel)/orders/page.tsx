import { CsvButton } from "@/components/admin/CsvButton";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { karachiDateString } from "@/lib/schedule";

export const metadata = { title: "Orders" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LIMIT = 1000;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const today = karachiDateString();
  const monthAgo = karachiDateString(new Date(Date.now() - 29 * 86_400_000));
  const from = typeof sp.from === "string" && DATE.test(sp.from) ? sp.from : monthAgo;
  const to = typeof sp.to === "string" && DATE.test(sp.to) ? sp.to : today;

  const [{ data: rows, error }, { data: settings }] = await Promise.all([
    supabase
      .from("order_intents")
      .select("*")
      .gte("created_at", new Date(`${from}T00:00:00+05:00`).toISOString())
      .lte("created_at", new Date(`${to}T23:59:59.999+05:00`).toISOString())
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase.from("site_settings").select("currency").eq("id", 1).maybeSingle(),
  ]);
  const currency = settings?.currency ?? "PKR";
  const list = rows ?? [];

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" });

  const csvRows = list.map((o) => ({
    code: o.code,
    product: o.product_name,
    size_ml: o.size_ml,
    qty: o.qty,
    unit_price: Number(o.unit_price),
    free_delivery: o.free_delivery_applied ? "yes" : "no",
    spin_prize: o.spin_prize_label ?? "",
    created_at_karachi: fmt(o.created_at),
  }));

  return (
    <>
      <div className="adm-head">
        <div>
          <span className="eyebrow">Buy-now clicks</span>
          <h1>Orders</h1>
        </div>
        <CsvButton rows={csvRows} filename={`razed-orders-${from}-to-${to}.csv`} />
      </div>
      <p className="hint" style={{ marginBottom: 16 }}>
        Every “Buy now” tap creates one row here with its code. The customer&rsquo;s name and address arrive in
        WhatsApp — match them by code.
      </p>

      <form style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginBottom: 18 }}>
        <label className="field">
          <span>From</span>
          <input className="input" type="date" name="from" defaultValue={from} max={today} />
        </label>
        <label className="field">
          <span>To</span>
          <input className="input" type="date" name="to" defaultValue={to} max={today} />
        </label>
        <button type="submit" className="btn btn-sm" style={{ height: 46 }}>
          Show
        </button>
      </form>

      {error && <p className="notice">Couldn&rsquo;t load orders. Refresh to try again.</p>}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col">Product</th>
              <th scope="col">Size</th>
              <th scope="col">Price</th>
              <th scope="col">Free delivery</th>
              <th scope="col">Prize</th>
              <th scope="col">When (PKT)</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td style={{ letterSpacing: ".12em", color: "var(--color-gold-hi)", whiteSpace: "nowrap" }}>{o.code}</td>
                <td>
                  {o.product_name}
                  {o.qty > 1 ? ` × ${o.qty}` : ""}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{o.size_ml} ml</td>
                <td style={{ whiteSpace: "nowrap" }}>{formatPrice(Number(o.unit_price) * o.qty, currency)}</td>
                <td>{o.free_delivery_applied ? <span className="pill green">Yes</span> : <span className="small">—</span>}</td>
                <td>
                  {o.spin_prize_label ? (
                    <span className="pill gold">{o.spin_prize_label}</span>
                  ) : o.spin_eligible ? (
                    <span className="small">Not spun</span>
                  ) : (
                    <span className="small">—</span>
                  )}
                </td>
                <td className="small" style={{ whiteSpace: "nowrap" }}>
                  {fmt(o.created_at)}
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={7} className="small" style={{ padding: 28, textAlign: "center" }}>
                  No orders in this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {list.length === LIMIT && (
        <p className="hint" style={{ marginTop: 12 }}>
          Showing the latest {LIMIT}. Narrow the dates to see older ones.
        </p>
      )}
    </>
  );
}
