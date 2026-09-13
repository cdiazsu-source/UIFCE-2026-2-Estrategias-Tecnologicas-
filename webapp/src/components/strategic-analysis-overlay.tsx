"use client";

import { useEffect, useState } from "react";
import { Presentation, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { DOFA_QUADRANTS, type DofaQuadrantKey } from "@/lib/dofa-data";
import {
  COVERAGE_LABEL,
  PROPOSED_INITIATIVES,
  STRATEGIC_SUMMARY,
  STRATEGIC_THEMES,
  type CoverageStatus,
} from "@/lib/strategic-analysis";

const QUADRANT_COLOR: Record<DofaQuadrantKey, string> = Object.fromEntries(
  DOFA_QUADRANTS.map((q) => [q.key, q.color]),
) as Record<DofaQuadrantKey, string>;

const STATUS_STYLE: Record<CoverageStatus, string> = {
  covered: "bg-primary/15 text-primary",
  partial: "bg-warning/15 text-warning",
  gap: "bg-destructive/15 text-destructive",
};

function QuadrantDot({ quadrant }: { quadrant: DofaQuadrantKey }) {
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
      style={{ backgroundColor: QUADRANT_COLOR[quadrant] }}
      title={DOFA_QUADRANTS.find((q) => q.key === quadrant)?.label}
    >
      {quadrant}
    </span>
  );
}

function ThemeCard({ theme }: { theme: (typeof STRATEGIC_THEMES)[number] }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {theme.quadrants.map((q) => (
              <QuadrantDot key={q} quadrant={q} />
            ))}
          </div>
          <h3 className="text-sm font-semibold">{theme.title}</h3>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            STATUS_STYLE[theme.status],
          )}
        >
          {COVERAGE_LABEL[theme.status]}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{theme.dofaSummary}</p>

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Proyecto{theme.projects.length === 1 ? "" : "s"} que lo atiende{theme.projects.length === 1 ? "" : "n"}
        </p>
        {theme.projects.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">Ninguno en el portafolio vigente.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {theme.projects.map((p) => (
              <li key={p} className="text-sm">
                · {p}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-l-2 border-primary/40 pl-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Estrategia tecnológica</p>
        <p className="text-sm leading-relaxed">{theme.techStrategy}</p>
      </div>
    </div>
  );
}

function InitiativeCard({ initiative }: { initiative: (typeof PROPOSED_INITIATIVES)[number] }) {
  const theme = STRATEGIC_THEMES.find((t) => t.id === initiative.fromThemeId);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
          Nueva iniciativa
        </span>
        {theme && <span className="text-[11px] text-muted-foreground">Responde a: {theme.title}</span>}
      </div>
      <h3 className="text-sm font-semibold">{initiative.title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{initiative.description}</p>
      <div className="border-l-2 border-primary/40 pl-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Por qué es tecnológica</p>
        <p className="text-sm leading-relaxed">{initiative.techAngle}</p>
      </div>
    </div>
  );
}

export function StrategicAnalysisOverlay() {
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
  }, [open, setOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Análisis estratégico"
        title="Análisis estratégico: DOFA × proyectos"
        className="press inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Presentation className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Análisis estratégico: DOFA cruzado con el portafolio de proyectos"
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card px-6 py-5">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Estrategias Tecnológicas — UIFCE
              </p>
              <h1 className="text-xl font-bold tracking-tight">Análisis estratégico: DOFA × Portafolio 2026-2</h1>
              <p className="max-w-3xl text-sm text-muted-foreground">{STRATEGIC_SUMMARY}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar análisis estratégico"
              className="press inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto flex max-w-5xl flex-col gap-8">
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Temas estratégicos ({STRATEGIC_THEMES.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {STRATEGIC_THEMES.map((theme) => (
                    <ThemeCard key={theme.id} theme={theme} />
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-3 border-t border-border pt-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Iniciativas nuevas propuestas ({PROPOSED_INITIATIVES.length})
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Solo para los temas del DOFA que ningún proyecto vigente cubre todavía.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {PROPOSED_INITIATIVES.map((initiative) => (
                    <InitiativeCard key={initiative.id} initiative={initiative} />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
