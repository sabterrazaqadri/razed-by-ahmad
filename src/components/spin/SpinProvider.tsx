"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SPIN_STORAGE_KEY, SpinStage, forgetSpin, type SpinOrder, type WheelPrize } from "./SpinStage";

type Ctx = { openSpin: (order: SpinOrder) => void };

const SpinContext = createContext<Ctx | null>(null);

export function useSpin() {
  const ctx = useContext(SpinContext);
  if (!ctx) throw new Error("useSpin must be used inside <SpinProvider>");
  return ctx;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function SpinProvider({
  prizes,
  spinnerDayName,
  children,
}: {
  prizes: WheelPrize[];
  spinnerDayName: string;
  children: ReactNode;
}) {
  const [order, setOrder] = useState<SpinOrder | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // A refresh mid-spin lands on /spin/[code] instead of granting a new spin.
  useEffect(() => {
    if (pathname.startsWith("/spin/") || pathname.startsWith("/admin")) return;
    try {
      const code = localStorage.getItem(SPIN_STORAGE_KEY);
      if (code && /^RZ-[A-Z0-9]{4,8}$/.test(code)) router.replace(`/spin/${code}`);
    } catch {
      /* storage unavailable */
    }
    // run once per page load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSpin = useCallback((o: SpinOrder) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    try {
      localStorage.setItem(SPIN_STORAGE_KEY, o.code);
    } catch {
      /* storage unavailable — the spin still works, it just won't survive a reload */
    }
    setOrder(o);
  }, []);

  const close = useCallback(() => {
    forgetSpin();
    setOrder(null);
    returnFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!order) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const node = dialogRef.current;
    node?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    function onKey(e: KeyboardEvent) {
      if (!node) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [order, close]);

  return (
    <SpinContext.Provider value={{ openSpin }}>
      {children}
      {order && (
        <>
          <div className="scrim" onClick={close} aria-hidden="true" />
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="spin-title"
            ref={dialogRef}
            data-testid="spin-modal"
          >
            <button type="button" className="modal-x" onClick={close} aria-label="Close">
              &times;
            </button>
            <SpinStage
              order={order}
              prizes={prizes}
              spinnerDayName={spinnerDayName}
              onClose={close}
              headingId="spin-title"
            />
          </div>
        </>
      )}
    </SpinContext.Provider>
  );
}
