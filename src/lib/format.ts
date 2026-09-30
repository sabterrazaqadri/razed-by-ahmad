const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** "Rs 11,500" for PKR, "USD 120" for anything else. */
export function formatPrice(amount: number, currency = "PKR"): string {
  const n = grouped.format(Math.round(Number(amount)));
  return currency.toUpperCase() === "PKR" ? `Rs ${n}` : `${currency.toUpperCase()} ${n}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
