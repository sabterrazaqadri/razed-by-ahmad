"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ToastState = { message: string; bad: boolean } | null;

/** Minimal toast: `const [toast, show] = useToast(); show("Saved")`. */
export function useToast() {
  const [state, setState] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, bad = false) => {
    if (timer.current) clearTimeout(timer.current);
    setState({ message, bad });
    timer.current = setTimeout(() => setState(null), 3200);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const node = state ? (
    <div className={`toast${state.bad ? " bad" : ""}`} role={state.bad ? "alert" : "status"} data-testid="toast">
      {state.message}
    </div>
  ) : null;

  return [node, show] as const;
}
