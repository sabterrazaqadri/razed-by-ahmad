import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BottleArt } from "@/components/BottleArt";
import { NoteLadder } from "@/components/NoteLadder";
import { ProductCard } from "@/components/ProductCard";
import { ProductMedia } from "@/components/ProductMedia";
import { Paragraphs, RichHeadline, plainHeadline } from "@/components/RichText";
import { WaIcon } from "@/components/WaIcon";
import { Wheel } from "@/components/Wheel";
import { getActivePrizes, getActiveProducts, getSettings } from "@/lib/data";
import { DAY_SHORT, WEEK_ORDER, dayName, getSchedule } from "@/lib/schedule";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { data: s } = await getSettings();
  return {
    title: { absolute: "Razed by Ahmad — Extrait de Parfum, Pakistan" },
    description: s.hero_sub ?? undefined,
    alternates: { canonical: "/" },
    openGraph: { title: `Razed by Ahmad — ${plainHeadline(s.hero_headline ?? "Extrait de parfum")}`, url: "/" },
  };
}

const NUMBER_WORDS = ["None", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

export default async function HomePage() {
  const [{ data: settings }, { data: products }, { data: prizes }] = await Promise.all([
    getSettings(),
    getActiveProducts(),
    getActivePrizes(),
  ]);
  const schedule = getSchedule(settings);
  const currency = settings.currency;

  const featured = products.filter((p) => p.is_featured);
  const grid = (featured.length ? featured : products).slice(0, 3);
  const heroProduct = grid[0] ?? products[0];

  // Note strip: the lead notes of the collection, deduplicated.
  const notes = Array.from(
    new Set(products.flatMap((p) => [p.notes_base[0], p.notes_heart[0], p.notes_top[0]]).filter(Boolean)),
  ).slice(0, 8);

  const spinDay = dayName(schedule.spinnerDay);
  const contactUrl = buildWhatsAppUrl(settings.whatsapp_number, "Assalam o Alaikum — Razed by Ahmad");
  const count = products.length;

  return (
    <>
      {/* ── hero ─────────────────────────────── */}
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="wrap">
          <div className="hero-copy">
            <span className="eyebrow">Extrait de parfum · Pakistan</span>
            <h1 className="display h1">
              <RichHeadline text={settings.hero_headline ?? "What stays\nafter the *fire*"} />
            </h1>
            {settings.hero_sub && <p className="lede">{settings.hero_sub}</p>}
            <div className="hero-actions">
              <Link className="btn btn-solid" href="/collection">
                Shop the collection
              </Link>
              <a className="btn btn-wa" href={contactUrl} target="_blank" rel="noopener noreferrer">
                <WaIcon /> Order on WhatsApp
              </a>
            </div>
            <div className="hero-meta">
              <div>
                <b>28%</b>Extrait concentration
              </div>
              <div>
                <b>9 hrs</b>Average wear
              </div>
              <div>
                <b>50</b>Bottles per batch
              </div>
            </div>
          </div>
          <div className="hero-stage">
            {heroProduct ? (
              <>
                {heroProduct.images[0] ? (
                  <div className="bottle" style={{ position: "relative", aspectRatio: "200 / 330" }}>
                    <ProductMedia
                      src={heroProduct.images[0]}
                      alt={heroProduct.name}
                      bottleVariant={heroProduct.bottle_variant}
                      sizes="(max-width: 820px) 46vw, 330px"
                      priority
                    />
                  </div>
                ) : (
                  <BottleArt variant={heroProduct.bottle_variant} label={`${heroProduct.name} bottle`} />
                )}
                <NoteLadder
                  top={heroProduct.notes_top}
                  heart={heroProduct.notes_heart}
                  base={heroProduct.notes_base}
                  limit={2}
                />
              </>
            ) : (
              <BottleArt variant="a" />
            )}
          </div>
        </div>
      </section>

      {/* ── note strip ───────────────────────── */}
      {notes.length > 0 && (
        <div className="notestrip" id="notes">
          <div className="row">
            {[0, 1].map((copy) =>
              notes.map((n, i) => (
                <span key={`${copy}-${n}`} aria-hidden={copy === 1 ? true : undefined}>
                  <b>{String(i + 1).padStart(2, "0")}</b> &nbsp;{n}
                </span>
              )),
            )}
          </div>
        </div>
      )}

      {/* ── featured ─────────────────────────── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">The collection</span>
              <h2 className="display h2" style={{ marginTop: 14 }}>
                {count > 0 && count <= 12 ? `${NUMBER_WORDS[count]}, and no more` : "The collection"}
              </h2>
            </div>
            <Link className="small" href="/collection" style={{ borderBottom: "1px solid var(--color-line)", paddingBottom: 4 }}>
              View all &rarr;
            </Link>
          </div>
          {grid.length ? (
            <div className="grid-3">
              {grid.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  currency={currency}
                  spinnerHint={schedule.spinnerToday}
                  priority={i === 0}
                  sizes="(max-width: 820px) 100vw, 33vw"
                />
              ))}
              {grid.length < 3 && (
                <Link
                  href="/collection"
                  className="collection-fill"
                  style={{ gridColumn: `span ${3 - grid.length}` }}
                  aria-label="View the full collection"
                >
                  <Image
                    src="/Collection.png"
                    alt="The Razed by Ahmad collection — 7°, On My Way and Scent Me to Sleep"
                    fill
                    sizes="(max-width: 820px) 100vw, 66vw"
                    style={{ objectFit: "cover" }}
                  />
                </Link>
              )}
            </div>
          ) : (
            <p className="empty">The collection is being restocked. Message us on WhatsApp for the current batch.</p>
          )}
        </div>
      </section>

      {/* ── free delivery panel ──────────────── */}
      <section style={{ paddingBottom: "clamp(64px,9vw,132px)" }}>
        <div className="wrap">
          <div className="monday is-live" data-testid="delivery-panel">
            <div className="monday-mark">
              Free
              <small>Every day</small>
            </div>
            <div>
              <h3 className="display">Delivery is on us, every day.</h3>
              <p className="lede" style={{ maxWidth: "40ch" }}>
                Order any day of the week and we cover nationwide delivery — no code, no minimum. It is applied
                automatically and shown on your WhatsApp order.
              </p>
              <ul className="week" aria-label="This week">
                {WEEK_ORDER.map((d) => {
                  const cls = ["on", d === schedule.today ? "today" : ""].filter(Boolean).join(" ");
                  const note = [
                    "free delivery",
                    schedule.spinnerEnabled && d === schedule.spinnerDay ? "gift spin" : "",
                    d === schedule.today ? "today" : "",
                  ]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <li
                      key={d}
                      className={cls}
                      aria-current={d === schedule.today ? "date" : undefined}
                      title={`${dayName(d)} — ${note}`}
                    >
                      <span aria-hidden="true">{DAY_SHORT[d]}</span>
                      <span className="sr-only">
                        {dayName(d)} ({note})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <Link className="btn btn-solid" href="/collection">
              Order today
            </Link>
          </div>
        </div>
      </section>

      {/* ── gift spin teaser ─────────────────── */}
      {schedule.spinnerEnabled && (
        <section className="section" id="gifting" style={{ borderTop: "1px solid var(--color-line-soft)" }}>
          <div className="wrap">
            <div className="split">
              <div>
                <span className="eyebrow">{spinDay}s</span>
                <h2 className="display h2" style={{ margin: "16px 0 18px" }}>
                  {schedule.spinnerToday ? (
                    <>
                      Today every
                      <br />
                      order takes a <em>spin</em>
                    </>
                  ) : (
                    <>
                      Every {spinDay}
                      <br />
                      order takes a <em>spin</em>
                    </>
                  )}
                </h2>
                <p className="lede">
                  Order on a {spinDay} and the wheel opens as soon as your order starts. One spin per order — a
                  travel vial, a gift box, free delivery, or money off the next one.
                </p>
                <div className="hero-actions">
                  {schedule.spinnerToday ? (
                    <Link className="btn btn-solid" href="/collection">
                      Order and spin
                    </Link>
                  ) : null}
                  <details className="prize-list">
                    <summary className="btn">See the prizes</summary>
                    <ul className="small" style={{ listStyle: "none", padding: 0, marginTop: 16, lineHeight: 2 }}>
                      {prizes.map((p) => (
                        <li key={p.id}>— {p.label}</li>
                      ))}
                    </ul>
                  </details>
                </div>
                <p className="small" style={{ marginTop: 22 }}>
                  Opens 12:00 AM – 11:59 PM PKT, {spinDay}s only.
                </p>
              </div>
              <div className="wheel-wrap">
                <div className="wheel-glow" aria-hidden="true" />
                <Wheel labels={prizes.map((p) => p.short_label)} title="Gift wheel prizes" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── story ────────────────────────────── */}
      <section
        className="section"
        id="about"
        style={{ background: "var(--color-pitch)", borderTop: "1px solid var(--color-line-soft)" }}
      >
        <div className="wrap">
          <div className="split">
            <div className="story-panel">
              <BottleArt variant="c" />
              <span className="cap">Small batches · bottled by hand</span>
            </div>
            <div>
              <span className="eyebrow">The house</span>
              <h2 className="display h2" style={{ margin: "16px 0 20px" }}>
                Ahmad blends first,
                <br />
                and names it after.
              </h2>
              {settings.about_text ? (
                <Paragraphs text={settings.about_text} className="lede" />
              ) : (
                <p className="lede">
                  Every extrait is blended, worn and adjusted in Pakistan before it is bottled — fifty at a time.
                </p>
              )}
              <p className="sig">Ahmad</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
