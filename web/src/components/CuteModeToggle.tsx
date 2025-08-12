"use client";

import { useEffect, useState } from "react";

export default function CuteModeToggle() {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("cute-mode") : null;
      const initial = stored === "1";
      setEnabled(initial);
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("cute-mode", initial);
      }
    } catch {}
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("cute-mode", next ? "1" : "0");
      }
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("cute-mode", next);
      }
    } catch {}
  }

  // Avoid SSR mismatch; render a simple button even before mounted
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={toggle}
      className={
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm shadow-sm transition " +
        (enabled
          ? "bg-pink-200/80 text-pink-800 hover:bg-pink-200"
          : "bg-emerald-100/80 text-emerald-800 hover:bg-emerald-100")
      }
      title="Toggle Super Cute Mode"
    >
      <span className="text-base" role="img" aria-label="sparkles">✨</span>
      <span className="font-medium">{mounted && enabled ? "Super Cute On" : "Super Cute"}</span>
    </button>
  );
}


