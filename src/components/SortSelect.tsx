"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value, options }: { value: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="sort">
      <span>Sort ·</span>
      <select
        value={value}
        aria-label="Sort fragrances"
        onChange={(e) => {
          const q = new URLSearchParams(params.toString());
          if (e.target.value === "featured") q.delete("sort");
          else q.set("sort", e.target.value);
          const s = q.toString();
          router.push(s ? `${pathname}?${s}` : pathname, { scroll: false });
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
