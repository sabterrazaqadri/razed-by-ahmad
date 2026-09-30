"use client";

type Row = Record<string, string | number>;

function toCsv(rows: Row[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: string | number) => {
    let s = String(v);
    // Neutralise spreadsheet formulas (CSV injection).
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))].join("\r\n");
}

export function CsvButton({ rows, filename }: { rows: Row[]; filename: string }) {
  return (
    <button
      type="button"
      className="btn btn-sm"
      disabled={!rows.length}
      onClick={() => {
        // BOM so Excel opens UTF-8 (em dashes, Urdu names) correctly.
        const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}
    >
      Export CSV ({rows.length})
    </button>
  );
}
