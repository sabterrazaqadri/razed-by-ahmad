// The olfactory ladder — the brand's signature element. A hairline gold rule
// with ticks where the top, heart and base notes sit in the wear.

type Props = {
  top: string[];
  heart: string[];
  base: string[];
  /** "hero" shows tier names; "product" adds how long each tier lasts. */
  size?: "hero" | "product";
  /** Max notes per tier to print (the hero keeps it short). */
  limit?: number;
};

const TIERS = [
  { key: "top", hero: "Top", product: "Top · 0–40 min", cls: "" },
  { key: "heart", hero: "Heart", product: "Heart · 1–4 hrs", cls: "is-heart" },
  { key: "base", hero: "Base", product: "Base · 4 hrs +", cls: "is-base" },
] as const;

function joinNotes(notes: string[], limit?: number) {
  const list = limit ? notes.slice(0, limit) : notes;
  return list.length ? list.join(", ") : "—";
}

export function NoteLadder({ top, heart, base, size = "hero", limit }: Props) {
  const notes = { top, heart, base };
  return (
    <dl className="ladder">
      <i className="ladder-cap top" aria-hidden="true" />
      {TIERS.map((t) => (
        <div key={t.key} className={`ladder-step ${t.cls}`}>
          <dt className="k">{size === "product" ? t.product : t.hero}</dt>
          <dd className="v">{joinNotes(notes[t.key], limit)}</dd>
        </div>
      ))}
      <i className="ladder-cap bot" aria-hidden="true" />
    </dl>
  );
}

/** Card-size ladder: three ticks of increasing height = top / heart / base. */
export function MiniLadder() {
  return (
    <div className="mini-ladder" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}
