"use client";

import { useEffect, useRef, useState } from "react";
import { spinOrder } from "@/app/actions/order";
import { WaIcon } from "@/components/WaIcon";
import { rotationFor, Wheel } from "@/components/Wheel";

export const SPIN_STORAGE_KEY = "razed:spin";

export type WheelPrize = { id: string; short_label: string };

export type SpinOrder = {
  code: string;
  productName: string;
  sizeMl: number;
  /** WhatsApp link without a prize line — used for "skip the spin". */
  whatsappUrl: string;
};

export type SpinOutcome = { prizeId: string | null; label: string; whatsappUrl: string };

type Props = {
  order: SpinOrder;
  prizes: WheelPrize[];
  spinnerDayName: string;
  initial?: SpinOutcome | null;
  /** Close/leave handler. Absent on the standalone /spin page. */
  onClose?: () => void;
  headingId: string;
  as?: "h1" | "h2";
};

export function forgetSpin() {
  try {
    localStorage.removeItem(SPIN_STORAGE_KEY);
  } catch {
    /* storage may be unavailable (private mode) — nothing to forget */
  }
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SpinStage({ order, prizes, spinnerDayName, initial, onClose, headingId, as: Heading = "h2" }: Props) {
  const [phase, setPhase] = useState<"ready" | "spinning" | "done">(initial ? "done" : "ready");
  const [outcome, setOutcome] = useState<SpinOutcome | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(() => {
    if (!initial) return 0;
    const idx = prizes.findIndex((p) => p.id === initial.prizeId);
    return idx >= 0 ? rotationFor(idx, prizes.length, 0) : 0;
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (phase === "done") resultRef.current?.focus();
  }, [phase]);

  async function spin() {
    if (phase !== "ready") return;
    setError(null);
    setPhase("spinning");
    const res = await spinOrder(order.code);
    if (!res.ok) {
      setError(res.error);
      setPhase("ready");
      return;
    }
    const idx = Math.max(0, prizes.findIndex((p) => p.id === res.prizeId));
    const jitter = Math.random() * 2 - 1;
    const reduce = prefersReducedMotion();
    setRotation(reduce ? rotationFor(idx, prizes.length, 0) : rotationFor(idx, prizes.length, 5, jitter));
    const done = () => {
      setOutcome({ prizeId: res.prizeId, label: res.label, whatsappUrl: res.whatsappUrl });
      setPhase("done");
    };
    if (reduce || res.repeat) done();
    else timer.current = setTimeout(done, 4600);
  }

  const leave = () => {
    forgetSpin();
    onClose?.();
  };

  const labels = prizes.map((p) => p.short_label);

  if (phase === "done" && outcome) {
    const lost = /try again|better luck/i.test(outcome.label);
    return (
      <div className="modal-body">
        <span className="eyebrow">{spinnerDayName} gift spin</span>
        <Heading id={headingId} className="display">
          {lost ? (
            <>
              Not this <em>time</em>
            </>
          ) : (
            <>
              It landed on
              <br />
              something <em>good</em>
            </>
          )}
        </Heading>
        <div className="modal-wheel" aria-hidden="true">
          <Wheel labels={labels} rotation={rotation} />
        </div>
        <div className="prize" ref={resultRef} tabIndex={-1} aria-live="polite">
          <b>{outcome.label}</b>
          <span>Added to order {order.code}</span>
        </div>
        <span className="code">{order.code}</span>
        <p className="small" style={{ margin: "16px auto 0", maxWidth: "34ch" }}>
          {order.productName} · {order.sizeMl} ml. Show the code in WhatsApp if anything needs sorting.
        </p>
        <a
          className="btn btn-solid btn-lg btn-block"
          style={{ marginTop: 20 }}
          href={outcome.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={forgetSpin}
          data-testid="spin-whatsapp"
        >
          <WaIcon /> Back to WhatsApp
        </a>
        {onClose ? (
          <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={leave}>
            Keep shopping
          </button>
        ) : (
          <a className="btn btn-ghost btn-block" style={{ marginTop: 10 }} href="/collection" onClick={forgetSpin}>
            Keep shopping
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="modal-body">
      <span className="eyebrow">{spinnerDayName} · one spin per order</span>
      <Heading id={headingId} className="display">
        Your order earned
        <br />a <em>spin</em>
      </Heading>
      <p>
        Order {order.code} is started. Spin once — whatever it lands on is added to this order before it ships.
      </p>
      <div className="modal-wheel">
        <Wheel labels={labels} rotation={rotation} animate title="Gift wheel" />
      </div>
      {error && (
        <p className="err" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </p>
      )}
      <button
        type="button"
        className="btn btn-solid btn-lg btn-block"
        onClick={spin}
        disabled={phase === "spinning" || prizes.length === 0}
        aria-busy={phase === "spinning"}
        data-testid="spin-button"
      >
        {phase === "spinning" ? "Spinning…" : "Spin the wheel"}
      </button>
      <p className="small" style={{ marginTop: 14 }}>
        <a
          href={order.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={forgetSpin}
          style={{ borderBottom: "1px solid var(--color-line)" }}
        >
          Skip the spin and continue to WhatsApp
        </a>
      </p>
    </div>
  );
}
