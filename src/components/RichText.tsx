import { Fragment } from "react";

/**
 * Tiny formatter for admin-editable headlines: new lines become <br>, and
 * *word* becomes the gold italic <em> used across the display type.
 */
export function RichHeadline({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*[^*]+\*)/g).map((part, j) =>
            part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
              <em key={j}>{part.slice(1, -1)}</em>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}

/** Plain text with blank-line paragraph breaks. */
export function Paragraphs({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className} style={i > 0 ? { marginTop: 18, ...style } : style}>
            {p}
          </p>
        ))}
    </>
  );
}

export function plainHeadline(text: string) {
  return text.replace(/\*/g, "").replace(/\s*\n\s*/g, " ");
}
