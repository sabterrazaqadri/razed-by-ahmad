"use client";

import { useState, type KeyboardEvent } from "react";

type Props = {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  describedBy?: string;
};

/** Type a note, press Enter or comma to add it. Backspace on empty removes the last. */
export function TagInput({ id, value, onChange, placeholder, describedBy }: Props) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p);
    onChange(next);
    setDraft("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="tags">
      {value.map((t, i) => (
        <span className="tag" key={`${t}-${i}`}>
          {t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(",")) commit(v);
          else setDraft(v);
        }}
        onKeyDown={onKey}
        onBlur={() => commit(draft)}
        placeholder={value.length ? "" : placeholder}
        aria-describedby={describedBy}
        enterKeyHint="done"
      />
    </div>
  );
}
