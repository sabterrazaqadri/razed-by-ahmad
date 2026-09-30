import { PrizesEditor } from "@/components/admin/PrizesEditor";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Gift wheel" };

export default async function PrizesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("spin_prizes").select("*").order("sort_order", { ascending: true });
  const prizes = (data ?? []).map((p) => ({
    id: p.id,
    label: p.label,
    short_label: p.short_label,
    weight: p.weight,
    is_active: p.is_active,
  }));
  return (
    <>
      <div className="adm-head">
        <div>
          <span className="eyebrow">Gift spin</span>
          <h1>Wheel prizes</h1>
        </div>
      </div>
      <PrizesEditor key={JSON.stringify(prizes)} initial={prizes} />
    </>
  );
}
