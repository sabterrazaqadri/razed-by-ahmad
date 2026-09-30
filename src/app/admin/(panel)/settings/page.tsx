import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/admin";
import { DEFAULT_SETTINGS } from "@/lib/data";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  const s = data ?? DEFAULT_SETTINGS;
  return (
    <>
      <div className="adm-head">
        <div>
          <span className="eyebrow">Shop</span>
          <h1>Settings</h1>
        </div>
      </div>
      <SettingsForm
        key={s.updated_at}
        initial={{
          whatsapp_number: s.whatsapp_number,
          free_delivery_day: s.free_delivery_day,
          spinner_day: s.spinner_day,
          spinner_enabled: s.spinner_enabled,
          announcement_text: s.announcement_text ?? "",
          hero_headline: s.hero_headline ?? "",
          hero_sub: s.hero_sub ?? "",
          currency: s.currency,
          about_text: s.about_text ?? "",
        }}
      />
    </>
  );
}
