"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Controller, useFieldArray, useForm, type FieldPath } from "react-hook-form";
import { deleteProductPermanently, saveProduct, setProductActive } from "@/app/admin/actions";
import { BottleArt } from "@/components/BottleArt";
import { slugify } from "@/lib/format";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { FAMILY_OPTIONS, productSchema, type ProductInput } from "@/lib/validation";
import { TagInput } from "./TagInput";
import { useToast } from "./Toast";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const BADGES = ["", "Best seller", "New", "Low stock", "Limited"];

const nullableNumber = (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v));

export function ProductForm({ initial }: { initial: ProductInput }) {
  const router = useRouter();
  const isNew = !initial.id;
  const [toast, show] = useToast();
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [uploading, setUploading] = useState(0);
  const [deleting, startDelete] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProductInput>({ resolver: zodResolver(productSchema), defaultValues: initial, mode: "onBlur" });

  const variants = useFieldArray({ control, name: "variants" });
  const images = watch("images");
  const slug = watch("slug");
  const name = watch("name");

  const nameField = register("name", {
    onChange: (e) => {
      if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldValidate: false });
    },
  });

  async function onSubmit(values: ProductInput) {
    const res = await saveProduct(values);
    if (!res.ok) {
      Object.entries(res.fieldErrors ?? {}).forEach(([k, message]) =>
        setError(k as FieldPath<ProductInput>, { type: "server", message }),
      );
      show(res.error, true);
      return;
    }
    show("Saved — the shop is updated");
    if (isNew) {
      router.replace(`/admin/products/${res.data.id}`);
    } else {
      reset(values);
      router.refresh();
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const supabase = getBrowserSupabase();
    const list = Array.from(files);
    const bad = list.find((f) => !IMAGE_TYPES.includes(f.type) || f.size > MAX_IMAGE_BYTES);
    if (bad) {
      show(`${bad.name}: use JPG, PNG, WebP or AVIF under 8 MB`, true);
      return;
    }
    setUploading((n) => n + list.length);
    const folder = slugify(getValues("slug") || getValues("name")) || "product";
    for (const file of list) {
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
      if (error) {
        show(`Upload failed for ${file.name}. Check you're still signed in.`, true);
      } else {
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        setValue("images", [...getValues("images"), data.publicUrl], { shouldDirty: true });
      }
      setUploading((n) => n - 1);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function moveImage(i: number, dir: -1 | 1) {
    const arr = [...getValues("images")];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setValue("images", arr, { shouldDirty: true });
  }

  function removeImage(i: number) {
    setValue(
      "images",
      getValues("images").filter((_, k) => k !== i),
      { shouldDirty: true },
    );
  }

  function makeDefault(i: number) {
    getValues("variants").forEach((_, k) => setValue(`variants.${k}.is_default`, k === i, { shouldDirty: true }));
  }

  function hide() {
    if (!initial.id) return;
    if (!window.confirm(`Hide ${initial.name} from the shop? You can switch it back on any time.`)) return;
    startDelete(async () => {
      const res = await setProductActive(initial.id!, false);
      if (res.ok) {
        setValue("is_active", false);
        show(`${initial.name} is hidden`);
        router.refresh();
      } else show(res.error, true);
    });
  }

  function destroy() {
    if (!initial.id) return;
    const typed = window.prompt(
      `This deletes ${initial.name}, its sizes and its photos for good. Type DELETE to confirm.`,
    );
    if (typed !== "DELETE") return;
    startDelete(async () => {
      const res = await deleteProductPermanently(initial.id!);
      if (res.ok) {
        router.push("/admin/products");
        router.refresh();
      } else show(res.error, true);
    });
  }

  const err = (m?: string) =>
    m ? (
      <span className="err" role="alert">
        {m}
      </span>
    ) : null;

  const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "grid", gap: 20, maxWidth: 980 }}>
      {/* ── basics ── */}
      <section className="adm-card" style={{ display: "grid", gap: 16 }}>
        <h2>The basics</h2>
        <div style={grid2}>
          <label className="field">
            <span>Name</span>
            <input className="input" {...nameField} placeholder="e.g. Oud Noir" />
            {err(errors.name?.message)}
          </label>
          <label className="field">
            <span>Web address</span>
            <input
              className="input"
              {...register("slug", { onChange: () => setSlugTouched(true) })}
              placeholder="oud-noir"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <span className="hint">razedbyahmad.com/product/{slug || "…"}</span>
            {err(errors.slug?.message)}
          </label>
        </div>
        <label className="field">
          <span>Short description (under the name)</span>
          <textarea className="input" rows={3} {...register("tagline")} />
          {err(errors.tagline?.message)}
        </label>
        <label className="field">
          <span>Long description (the story)</span>
          <textarea className="input" rows={5} {...register("description")} />
          {err(errors.description?.message)}
        </label>
        <div style={grid2}>
          <label className="field">
            <span>Family</span>
            <select className="input" {...register("family")}>
              <option value="">—</option>
              {FAMILY_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Badge</span>
            <input className="input" list="badge-options" {...register("badge")} placeholder="None" />
            <datalist id="badge-options">
              {BADGES.filter(Boolean).map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
            {err(errors.badge?.message)}
          </label>
          <label className="field">
            <span>Display order</span>
            <input className="input" type="number" inputMode="numeric" {...register("sort_order", { valueAsNumber: true })} />
            <span className="hint">Lower numbers show first.</span>
            {err(errors.sort_order?.message)}
          </label>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <label className="check">
            <input type="checkbox" {...register("is_active")} /> Live on the site
          </label>
          <label className="check">
            <input type="checkbox" {...register("is_featured")} /> Feature on the home page
          </label>
        </div>
      </section>

      {/* ── sizes & prices ── */}
      <section className="adm-card" style={{ display: "grid", gap: 14 }}>
        <h2>Sizes &amp; prices</h2>
        {variants.fields.map((f, i) => {
          const ve = errors.variants?.[i];
          return (
            <div
              key={f.id}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 10,
                alignItems: "end",
                paddingBottom: 14,
                borderBottom: "1px solid var(--color-line-soft)",
              }}
            >
              <input type="hidden" {...register(`variants.${i}.id`)} />
              <label className="field">
                <span>Size (ml)</span>
                <input className="input" type="number" inputMode="numeric" {...register(`variants.${i}.size_ml`, { valueAsNumber: true })} />
                {err(ve?.size_ml?.message)}
              </label>
              <label className="field">
                <span>Price</span>
                <input className="input" type="number" inputMode="decimal" step="any" {...register(`variants.${i}.price`, { valueAsNumber: true })} />
                {err(ve?.price?.message)}
              </label>
              <label className="field">
                <span>Was (optional)</span>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  {...register(`variants.${i}.compare_at_price`, { setValueAs: nullableNumber })}
                />
                {err(ve?.compare_at_price?.message)}
              </label>
              <label className="field">
                <span>Stock</span>
                <input className="input" type="number" inputMode="numeric" {...register(`variants.${i}.stock`, { valueAsNumber: true })} />
                {err(ve?.stock?.message)}
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                <Controller
                  control={control}
                  name={`variants.${i}.is_default`}
                  render={({ field }) => (
                    <label className="check">
                      <input type="radio" name="default-size" checked={field.value} onChange={() => makeDefault(i)} />
                      Default
                    </label>
                  )}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => variants.remove(i)}
                  disabled={variants.fields.length <= 1}
                  aria-label={`Remove size ${i + 1}`}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
        {err(errors.variants?.message ?? errors.variants?.root?.message)}
        <div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => variants.append({ size_ml: 10, price: 0, compare_at_price: null, stock: 0, is_default: false })}
          >
            + Add a size
          </button>
        </div>
      </section>

      {/* ── notes ── */}
      <section className="adm-card" style={{ display: "grid", gap: 16 }}>
        <h2>The notes</h2>
        <p className="hint" id="notes-hint">
          Type a note and press Enter. The first note of each row shows on the product cards.
        </p>
        {(
          [
            ["notes_top", "Top notes (first 40 minutes)"],
            ["notes_heart", "Heart notes (1–4 hours)"],
            ["notes_base", "Base notes (4 hours +)"],
          ] as const
        ).map(([key, label]) => (
          <div className="field" key={key}>
            <label className="label" htmlFor={key}>
              {label}
            </label>
            <Controller
              control={control}
              name={key}
              render={({ field }) => (
                <TagInput id={key} value={field.value} onChange={field.onChange} placeholder="e.g. Saffron" describedBy="notes-hint" />
              )}
            />
            {err(errors[key]?.message)}
          </div>
        ))}
      </section>

      {/* ── photos ── */}
      <section className="adm-card" style={{ display: "grid", gap: 14 }}>
        <h2>Photos</h2>
        <p className="hint">
          The first photo is the main one. Square photos, at least 1200 × 1200, on black or transparent look best. No
          photo? The drawn bottle below is shown instead.
        </p>
        <div className="imgs">
          {images.map((src, i) => (
            <div className="it" key={src}>
              <Image src={src} alt={`Photo ${i + 1}`} fill sizes="140px" />
              <div className="ops">
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}>
                  ←
                </button>
                <button type="button" onClick={() => removeImage(i)} aria-label={`Remove photo ${i + 1}`}>
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(i, 1)}
                  disabled={i === images.length - 1}
                  aria-label={`Move photo ${i + 1} later`}
                >
                  →
                </button>
              </div>
            </div>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <div className="it" key={`u${i}`} style={{ display: "grid", placeItems: "center" }}>
              <span className="small">Uploading…</span>
            </div>
          ))}
        </div>
        {err(errors.images?.message)}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_TYPES.join(",")}
            multiple
            onChange={(e) => onFiles(e.target.files)}
            className="sr-only"
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className="btn btn-sm" style={{ cursor: "pointer" }}>
            + Add photos
          </label>
        </div>

        <div className="field" style={{ marginTop: 8 }}>
          <span className="label">Drawn bottle (used when there is no photo)</span>
          <Controller
            control={control}
            name="bottle_variant"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Drawn bottle" style={{ display: "flex", gap: 10 }}>
                {(["a", "b", "c"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={field.value === v}
                    onClick={() => field.onChange(v)}
                    style={{
                      width: 76,
                      height: 100,
                      display: "grid",
                      placeItems: "center",
                      border: `1px solid ${field.value === v ? "var(--color-gold)" : "var(--color-line-soft)"}`,
                      background: "var(--color-ink)",
                    }}
                  >
                    <BottleArt variant={v} className="thumb-art" label={`Bottle ${v.toUpperCase()}`} />
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      </section>

      {/* ── save bar ── */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "rgba(7,6,10,.94)",
          borderTop: "1px solid var(--color-line)",
          padding: "14px 0",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          zIndex: 5,
        }}
      >
        <button type="submit" className="btn btn-solid" disabled={isSubmitting || uploading > 0} data-testid="save-product">
          {isSubmitting ? "Saving…" : uploading > 0 ? "Uploading photos…" : isNew ? "Create product" : "Save changes"}
        </button>
        {!isNew && (
          <Link className="btn btn-ghost" href={`/product/${initial.slug}`} target="_blank">
            View on site ↗
          </Link>
        )}
        {isDirty && <span className="small">Unsaved changes</span>}
      </div>

      {!isNew && (
        <section className="adm-card" style={{ display: "grid", gap: 12, borderColor: "rgba(227,139,122,.3)" }}>
          <h2 style={{ color: "var(--color-danger)" }}>Remove {name || "product"}</h2>
          <p className="hint">
            Hiding keeps everything (prices, photos, past orders) and takes it off the shop. Deleting is permanent.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-sm" onClick={hide} disabled={deleting}>
              Hide from shop
            </button>
            <button type="button" className="btn btn-sm btn-danger" onClick={destroy} disabled={deleting}>
              Delete permanently
            </button>
          </div>
        </section>
      )}
      {toast}
    </form>
  );
}
