export type BottleVariant = "a" | "b" | "c";

export function asBottleVariant(v: string | null | undefined): BottleVariant {
  return v === "b" || v === "c" ? v : "a";
}

type Props = {
  variant?: string | null;
  className?: string;
  /** Accessible name. Omit for purely decorative uses. */
  label?: string;
};

/** Illustrated bottle — the automatic fallback whenever a product has no photo. */
export function BottleArt({ variant, className = "bottle", label }: Props) {
  const v = asBottleVariant(variant);
  return (
    <svg
      className={className}
      viewBox="0 0 200 330"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <use href={`#bottle-${v}`} />
    </svg>
  );
}
