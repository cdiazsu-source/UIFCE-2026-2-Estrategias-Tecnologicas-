"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

/** Ancho del globo (coincide con w-64) y aire mínimo respecto al borde de
 *  pantalla, en px. Se usan para que el globo no se salga del viewport
 *  cuando el ícono está pegado a un borde (columnas derechas en grillas
 *  angostas de celular). */
const TOOLTIP_WIDTH = 256;
const VIEWPORT_MARGIN = 16;

export function InfoHint({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  // Corrimiento en px respecto al centrado por defecto, para no salirse de
  // pantalla cuando el ícono está cerca de un borde. 0 = centrado normal.
  const [shift, setShift] = useState(0);
  const [maxWidth, setMaxWidth] = useState(TOOLTIP_WIDTH);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    // clientWidth (no la barra de scroll) es lo que de verdad limita el
    // layout — más fiable que innerWidth en algunos webviews/emuladores.
    const viewportWidth = document.documentElement.clientWidth;
    const width = Math.min(TOOLTIP_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);
    setMaxWidth(width);
    const rect = ref.current.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const halfWidth = width / 2;
    const idealLeft = center - halfWidth;
    const idealRight = center + halfWidth;
    if (idealLeft < VIEWPORT_MARGIN) setShift(VIEWPORT_MARGIN - idealLeft);
    else if (idealRight > viewportWidth - VIEWPORT_MARGIN) setShift(viewportWidth - VIEWPORT_MARGIN - idealRight);
    else setShift(0);
  }, [open]);

  return (
    <span ref={ref} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Qué es esta sección"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-primary focus-visible:text-primary"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          style={{ transform: `translateX(calc(-50% + ${shift}px))`, maxWidth }}
          className="absolute left-1/2 top-full z-20 mt-2 w-64 rounded-lg border border-border bg-card p-3 text-xs font-normal normal-case leading-relaxed tracking-normal text-card-foreground shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
