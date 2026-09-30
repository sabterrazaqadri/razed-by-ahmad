"use client";

import { useEffect } from "react";
import { forgetSpin } from "./SpinStage";

/** Once a spin is settled, stop redirecting future page loads to it. */
export function SpinCleanup() {
  useEffect(() => {
    forgetSpin();
  }, []);
  return null;
}
