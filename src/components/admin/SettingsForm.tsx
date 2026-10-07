"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, type FieldPath } from "react-hook-form";
import { saveSettings } from "@/app/admin/actions";
import { DAY_NAMES } from "@/lib/schedule";
import { settingsSchema, type SettingsInput } from "@/lib/validation";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { useToast } from "./Toast";

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const router = useRouter();
  const [toast, show] = useToast();
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsInput>({ resolver: zodResolver(settingsSchema), defaultValues: initial, mode: "onBlur" });

  async function onSubmit(values: SettingsInput) {
    const res = await saveSettings(values);
    if (!res.ok) {
      Object.entries(res.fieldErrors ?? {}).forEach(([k, message]) =>
        setError(k as FieldPath<SettingsInput>, { type: "server", message }),
      );
      show(res.error, true);
      return;
    }
    reset(values);
    show("Settings saved — the shop is updated");
    router.refresh();
  }

  function testNumber() {
    const n = getValues("whatsapp_number").replace(/\D/g, "");
    if (!/^\d{8,15}$/.test(n)) {
      setError("whatsapp_number", { type: "manual", message: "Enter the number first (digits only)" });
      return;
    }
    const text = buildOrderMessage({
      code: "RZ-TEST",
      productName: "On My Way",
      sizeMl: 50,
      unitPrice: 11500,
      currency: getValues("currency") || "PKR",
    });
    window.open(buildWhatsAppUrl(n, `(Test message from the shop admin)\n\n${text}`), "_blank", "noopener");
  }

  const err = (m?: string) =>
    m ? (
      <span className="err" role="alert">
        {m}
      </span>
    ) : null;
  const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 };
  const dayOptions = DAY_NAMES.map((d, i) => (
    <option key={d} value={i}>
      {d}
    </option>
  ));

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "grid", gap: 20, maxWidth: 860 }}>
      <section className="adm-card" style={{ display: "grid", gap: 16 }}>
        <h2>Orders</h2>
        <label className="field">
          <span>WhatsApp number that receives orders</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              className="input"
              style={{ flex: "1 1 220px" }}
              inputMode="numeric"
              autoComplete="off"
              placeholder="923001234567"
              {...register("whatsapp_number")}
            />
            <button type="button" className="btn btn-wa btn-sm" style={{ height: 46 }} onClick={testNumber}>
              Test this number
            </button>
          </div>
          <span className="hint">Country code first, no + or spaces. Pakistan numbers start with 92.</span>
          {err(errors.whatsapp_number?.message)}
        </label>
        <div style={grid2}>
          <label className="field">
            <span>Currency</span>
            <input className="input" maxLength={3} {...register("currency")} />
            {err(errors.currency?.message)}
          </label>
        </div>
      </section>

      <section className="adm-card" style={{ display: "grid", gap: 16 }}>
        <h2>Weekly offers (Pakistan time)</h2>
        <div style={grid2}>
          <div className="field">
            <span>Free delivery</span>
            <p className="small">Runs every day — applied to every order automatically.</p>
          </div>
          <label className="field">
            <span>Gift spin day</span>
            <select className="input" {...register("spinner_day", { valueAsNumber: true })}>
              {dayOptions}
            </select>
          </label>
        </div>
        <label className="check">
          <input type="checkbox" {...register("spinner_enabled")} /> Gift spin switched on
        </label>
      </section>

      <section className="adm-card" style={{ display: "grid", gap: 16 }}>
        <h2>Words on the site</h2>
        <label className="field">
          <span>Announcement bar</span>
          <input className="input" {...register("announcement_text")} placeholder="Free delivery every day — the courier is on us" />
          <span className="hint">Leave empty to show “Free delivery every day — the courier is on us”.</span>
          {err(errors.announcement_text?.message)}
        </label>
        <label className="field">
          <span>Home page headline</span>
          <textarea className="input" rows={2} {...register("hero_headline")} />
          <span className="hint">New line = line break. Put a word in *stars* to make it gold italic.</span>
          {err(errors.hero_headline?.message)}
        </label>
        <label className="field">
          <span>Text under the headline</span>
          <textarea className="input" rows={3} {...register("hero_sub")} />
          {err(errors.hero_sub?.message)}
        </label>
        <label className="field">
          <span>About the house</span>
          <textarea className="input" rows={6} {...register("about_text")} />
          <span className="hint">Leave an empty line between paragraphs.</span>
          {err(errors.about_text?.message)}
        </label>
      </section>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "rgba(7,6,10,.94)",
          borderTop: "1px solid var(--color-line)",
          padding: "14px 0",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <button type="submit" className="btn btn-solid" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save settings"}
        </button>
        {isDirty && <span className="small">Unsaved changes</span>}
      </div>
      {toast}
    </form>
  );
}
