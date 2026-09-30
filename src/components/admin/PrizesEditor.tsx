"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import { savePrizes } from "@/app/admin/actions";
import { Wheel } from "@/components/Wheel";
import { prizesSchema, type PrizesInput } from "@/lib/validation";
import { useToast } from "./Toast";

export function PrizesEditor({ initial }: { initial: PrizesInput["prizes"] }) {
  const router = useRouter();
  const [toast, show] = useToast();
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PrizesInput>({ resolver: zodResolver(prizesSchema), defaultValues: { prizes: initial } });
  const { fields, append, remove, move } = useFieldArray({ control, name: "prizes" });
  const live = useWatch({ control, name: "prizes" }) ?? [];

  const active = live.filter((p) => p?.is_active);
  const total = active.reduce((n, p) => n + (Number.isFinite(p.weight) ? Math.max(0, p.weight) : 0), 0);
  const chance = (p: PrizesInput["prizes"][number]) =>
    p?.is_active && total > 0 && Number.isFinite(p.weight) ? `${((Math.max(0, p.weight) / total) * 100).toFixed(1)}%` : "—";

  async function onSubmit(values: PrizesInput) {
    const res = await savePrizes(values);
    if (!res.ok) {
      Object.entries(res.fieldErrors ?? {}).forEach(([k, message]) =>
        setError(k as FieldPath<PrizesInput>, { type: "server", message }),
      );
      show(res.error, true);
      return;
    }
    reset(values);
    show("Wheel saved");
    router.refresh();
  }

  const err = (m?: string) =>
    m ? (
      <span className="err" role="alert">
        {m}
      </span>
    ) : null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "start" }}
    >
      <div style={{ display: "grid", gap: 12 }}>
        <p className="hint">
          Weight sets how often a prize comes up: a prize with weight 4 is four times as likely as one with weight 1.
          Keep expensive prizes low. Wheel text must be short enough to fit a slice.
        </p>
        {fields.map((f, i) => {
          const pe = errors.prizes?.[i];
          return (
            <div key={f.id} className="adm-card" style={{ display: "grid", gap: 10, padding: 16 }}>
              <input type="hidden" {...register(`prizes.${i}.id`)} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                <label className="field">
                  <span>Prize (shown to the customer)</span>
                  <input className="input" {...register(`prizes.${i}.label`)} />
                  {err(pe?.label?.message)}
                </label>
                <label className="field">
                  <span>Wheel text</span>
                  <input className="input" maxLength={14} {...register(`prizes.${i}.short_label`)} />
                  {err(pe?.short_label?.message)}
                </label>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
                <label className="field" style={{ width: 110 }}>
                  <span>Weight</span>
                  <input className="input" type="number" inputMode="numeric" min={0} {...register(`prizes.${i}.weight`, { valueAsNumber: true })} />
                </label>
                <span className="small" style={{ paddingBottom: 14 }}>
                  Chance: <b style={{ fontWeight: 400, color: "var(--color-gold-hi)" }}>{chance(live[i])}</b>
                </span>
                <label className="check">
                  <input type="checkbox" {...register(`prizes.${i}.is_active`)} /> On the wheel
                </label>
                <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => move(i, i + 1)}
                    disabled={i === fields.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => remove(i)}
                    aria-label={`Delete prize ${i + 1}`}
                  >
                    ✕
                  </button>
                </span>
              </div>
              {err(pe?.weight?.message)}
            </div>
          );
        })}
        {err(errors.prizes?.message ?? errors.prizes?.root?.message)}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => append({ label: "", short_label: "", weight: 1, is_active: true })}
            disabled={fields.length >= 16}
          >
            + Add a prize
          </button>
          <button type="submit" className="btn btn-solid btn-sm" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save wheel"}
          </button>
          {isDirty && <span className="small" style={{ alignSelf: "center" }}>Unsaved changes</span>}
        </div>
      </div>

      <div className="adm-card" style={{ position: "sticky", top: 20, display: "grid", placeItems: "center", gap: 12 }}>
        <h2 style={{ justifySelf: "start" }}>Live preview</h2>
        <div style={{ width: "min(340px, 100%)" }}>
          <Wheel labels={active.map((p) => p.short_label || "…")} title="Wheel preview" />
        </div>
        <p className="small">
          {active.length} slice{active.length === 1 ? "" : "s"} on the wheel
        </p>
      </div>
      {toast}
    </form>
  );
}
