"use client";

import { useState, useTransition } from "react";
import { setProductActive, setProductSortOrder } from "@/app/admin/actions";
import { useToast } from "./Toast";

export function ActiveToggle({ id, active, name }: { id: string; active: boolean; name: string }) {
  const [on, setOn] = useState(active);
  const [pending, start] = useTransition();
  const [toast, show] = useToast();

  return (
    <>
      <label className="check" style={{ minHeight: 0 }}>
        <input
          type="checkbox"
          checked={on}
          disabled={pending}
          aria-label={`${name} is live on the site`}
          onChange={(e) => {
            const next = e.target.checked;
            setOn(next);
            start(async () => {
              const res = await setProductActive(id, next);
              if (!res.ok) {
                setOn(!next);
                show(res.error, true);
              } else show(next ? `${name} is live` : `${name} is hidden`);
            });
          }}
        />
        <span className="small">{on ? "Live" : "Hidden"}</span>
      </label>
      {toast}
    </>
  );
}

export function SortOrderInput({ id, value, name }: { id: string; value: number; name: string }) {
  const [v, setV] = useState(String(value));
  const [saved, setSaved] = useState(value);
  const [pending, start] = useTransition();
  const [toast, show] = useToast();

  function commit() {
    const n = Number(v);
    if (!Number.isInteger(n)) {
      setV(String(saved));
      show("Use a whole number", true);
      return;
    }
    if (n === saved) return;
    start(async () => {
      const res = await setProductSortOrder(id, n);
      if (res.ok) {
        setSaved(n);
        show("Order updated");
      } else {
        setV(String(saved));
        show(res.error, true);
      }
    });
  }

  return (
    <>
      <input
        className="input"
        style={{ width: 76, minHeight: 38, padding: "6px 10px" }}
        inputMode="numeric"
        value={v}
        disabled={pending}
        aria-label={`Display order for ${name}`}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
      />
      {toast}
    </>
  );
}
