"use client";

import { useEffect, useRef } from "react";

/**
 * The product mega menu's disclosure (#pmega). A native <details>, so it opens and every link is reachable with JavaScript off;
 * this component only adds what the browser does not: Escape closes it and returns focus to the button, a press outside closes
 * it, and the up and down arrows move between its links. It opens on a press, never on hover, so touch behaves like a mouse.
 */
export function ProductMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const close = (focus: boolean) => {
      if (!el.open) return;
      el.open = false;
      if (focus) el.querySelector("summary")?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (el.open) e.preventDefault();
        close(true);
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const links = Array.from(el.querySelectorAll<HTMLAnchorElement>("a[href]"));
      if (links.length === 0) return;
      if (!el.open) {
        if (e.key === "ArrowDown" && document.activeElement === el.querySelector("summary")) {
          e.preventDefault();
          el.open = true;
          links[0].focus();
        }
        return;
      }
      e.preventDefault();
      const at = links.indexOf(document.activeElement as HTMLAnchorElement);
      const next = e.key === "ArrowDown" ? (at + 1) % links.length : at <= 0 ? links.length - 1 : at - 1;
      links[next].focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!el.contains(e.target as Node)) close(false);
    };
    el.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      el.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, []);
  return (
    <details ref={ref} className="group">
      <summary className="flex cursor-pointer list-none items-center gap-1 font-medium text-foreground hover:text-primary [&::-webkit-details-marker]:hidden">
        {label}
        <span aria-hidden="true" className="text-xs transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="absolute inset-x-0 top-full z-20 border-b border-border bg-surface shadow-lg">
        <div className="mx-auto w-full max-w-6xl px-6 py-4">{children}</div>
      </div>
    </details>
  );
}
