"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Presentation, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { DOFA_QUADRANTS, type DofaQuadrantKey } from "@/lib/dofa-data";
import {
  COVERAGE_LABEL,
  PROPOSED_INITIATIVES,
  STRATEGIC_INTRO,
  STRATEGIC_THEMES,
  type CoverageStatus,
  type QuadrantFinding,
} from "@/lib/strategic-analysis";

const QUADRANT_COLOR: Record<DofaQuadrantKey, string> = Object.fromEntries(
  DOFA_QUADRANTS.map((q) => [q.key, q.color]),
) as Record<DofaQuadrantKey, string>;

const STATUS_STYLE: Record<CoverageStatus, string> = {
  covered: "bg-primary/15 text-primary",
  partial: "bg-warning/15 text-warning",
  gap: "bg-destructive/15 text-destructive",
};

function FindingBullet({ finding }: { finding: QuadrantFinding }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-snug">
      <span
        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: QUADRANT_COLOR[finding.quadrant] }}
        title={DOFA_QUADRANTS.find((q) => q.key === finding.quadrant)?.label}
        aria-hidden
      />
      <span>{finding.text}</span>
    </li>
  );
}

function ThemeCard({ theme }: { theme: (typeof STRATEGIC_THEMES)[number] }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{theme.title}</h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            STATUS_STYLE[theme.status],
          )}
        >
          {COVERAGE_LABEL[theme.status]}
        </span>
      </div>

      <ul className="flex flex-col gap-1.5">
        {theme.findings.map((f, i) => (
          <FindingBullet key={i} finding={f} />
        ))}
      </ul>

      <div className="flex flex-wrap gap-1.5">
        {theme.projects.length === 0 ? (
          <span className="text-xs italic text-muted-foreground">Ningún proyecto vigente lo atiende</span>
        ) : (
          theme.projects.map((p) => (
            <span
              key={p}
              className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] leading-relaxed text-foreground"
            >
              {p}
            </span>
          ))
        )}
      </div>

      <ul className="flex flex-col gap-1 border-l-2 border-primary/40 pl-3">
        {theme.action.map((a, i) => (
          <li key={i} className="flex items-start gap-1.5 text-sm">
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <span>{a}</span>
          </li>
        ))}
      </ul>
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
        {theme && <span className="text-[11px] text-muted-foreground">{theme.title}</span>}
      </div>
      <h3 className="text-sm font-semibold">{initiative.title}</h3>
      <ul className="flex flex-col gap-1 text-sm">
        <li className="flex items-start gap-1.5">
          <span className="mt-0.5 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Qué
          </span>
          <span>{initiative.what}</span>
        </li>
        <li className="flex items-start gap-1.5">
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span>{initiative.why}</span>
        </li>
      </ul>
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
  }, [open]);

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
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Estrategias Tecnológicas — UIFCE
              </p>
              <h1 className="text-xl font-bold tracking-tight">Análisis estratégico: DOFA × Portafolio 2026-2</h1>
              <ul className="flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-muted-foreground">
                {STRATEGIC_INTRO.map((line, i) => (
                  <li key={i}>· {line}</li>
                ))}
              </ul>
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
            <div className="mx-auto flex max-w-6xl flex-col gap-8">
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Temas estratégicos ({STRATEGIC_THEMES.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {STRATEGIC_THEMES.map((theme) => (
                    <ThemeCard key={theme.id} theme={theme} />
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-3 border-t border-border pt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Iniciativas nuevas propuestas ({PROPOSED_INITIATIVES.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
