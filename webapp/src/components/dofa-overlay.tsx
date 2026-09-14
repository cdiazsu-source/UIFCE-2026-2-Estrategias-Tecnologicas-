"use client";

import { useEffect, useState } from "react";
import { Grid2x2, X } from "lucide-react";

import { DofaBoard } from "@/components/dofa-board";
import { DOFA_META } from "@/lib/dofa-data";

/** El Diagnóstico DOFA vivía en su propia página (`/dofa`, con entrada en el
 *  nav). Se movió al Panel principal como esta capa a pantalla completa —
 *  mismo patrón que `StrategicAnalysisOverlay` — para que el DOFA, sus
 *  proyectos y el análisis estratégico que los cruza queden a un clic de
 *  distancia entre sí, en vez de repartidos en pestañas separadas. */
export function DofaOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Diagnóstico DOFA"
        title="Diagnóstico DOFA"
        className="press inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Grid2x2 className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Diagnóstico DOFA del área"
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card px-6 py-5">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Estrategias Tecnológicas — UIFCE
              </p>
              <h1 className="text-xl font-bold tracking-tight">Diagnóstico DOFA</h1>
              <p className="max-w-3xl text-sm text-muted-foreground">{DOFA_META.contextualizacion}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar diagnóstico DOFA"
              className="press inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto flex max-w-5xl flex-col gap-4">
              <div className="rounded-md border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fuentes del diagnóstico
                </p>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-snug text-muted-foreground">
                  {DOFA_META.fuentes.map((fuente, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span>•</span>
                      <span>{fuente}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <DofaBoard />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
