"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  COMPARATIVO_SEMESTRAL,
  CRUCE_ESTRATEGICO,
  DOFA_QUADRANTS,
  PARAMETROS_OPERATIVOS,
  PROXIMOS_PASOS,
  type DofaPeriod,
  type DofaQuadrantKey,
} from "@/lib/dofa-data";

/** Chip de semestre por hallazgo: resalta 2026-I (el semestre inmediatamente
 *  anterior, el foco del reporte) y lo estructural/vigente; atenúa 2025-I y
 *  2025-II, que quedan como antecedente. */
function PeriodBadge({ period }: { period: DofaPeriod }) {
  const emphasize = period === "2026-I" || period === "Estructural";
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        emphasize ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {period}
    </span>
  );
}

/** Contraste explícito con 2026-I (y, donde aplica, 2025-II) — el eje que
 *  pidió el diagnóstico, para que no quede enterrado entre los hallazgos. */
function ComparativoSemestral() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5">
        <div>
          <h2 className="text-base font-semibold">Comparativo con el semestre inmediatamente anterior</h2>
          <p className="text-sm text-muted-foreground">Qué cambió frente a 2025-I/2025-II, con datos de 2026-I.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {COMPARATIVO_SEMESTRAL.map((c) => (
            <div key={c.indicador} className="rounded-md border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.indicador}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Antes —</span> {c.antes}
              </p>
              <p className="text-sm">
                <span className="font-medium text-primary">Ahora —</span> {c.ahora}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Barra horizontal a mano (sin librería de charts, igual que el resto de la
 *  app): proporción de hallazgos por cuadrante. Cada segmento es clickable y
 *  hace scroll + resalta la tarjeta de ese cuadrante. */
function ProportionBar({ onSelect }: { onSelect: (key: DofaQuadrantKey) => void }) {
  const total = DOFA_QUADRANTS.reduce((sum, q) => sum + q.items.length, 0) || 1;
  return (
    <div className="flex h-8 w-full overflow-hidden rounded-md border border-border">
      {DOFA_QUADRANTS.map((q) => (
        <button
          key={q.key}
          type="button"
          onClick={() => onSelect(q.key)}
          title={`${q.label} — ${q.items.length}`}
          style={{ width: `${(q.items.length / total) * 100}%`, backgroundColor: q.color }}
          className="flex items-center justify-center text-xs font-semibold text-white transition-opacity hover:opacity-80"
        >
          {q.items.length}
        </button>
      ))}
    </div>
  );
}

function Quadrant({
  quadrant,
  highlighted,
  onClick,
}: {
  quadrant: (typeof DOFA_QUADRANTS)[number];
  highlighted: boolean;
  onClick: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { color } = quadrant;

  return (
    <Card
      id={`dofa-${quadrant.key}`}
      className={cn("transition-shadow", highlighted && "ring-2 ring-offset-2")}
      style={highlighted ? ({ ["--tw-ring-color" as string]: color } as React.CSSProperties) : undefined}
    >
      <CardContent className="flex flex-col gap-3 pt-5">
        <button type="button" onClick={onClick} className="flex items-center gap-2 text-left">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
            style={{ backgroundColor: `${color}1f` }}
            aria-hidden
          >
            {quadrant.emoji}
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold" style={{ color }}>
              {quadrant.label}
            </span>
            <span className="block text-xs text-muted-foreground">{quadrant.items.length} hallazgos</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} aria-hidden />
          {expanded ? "Contraer" : "Ver detalle"}
        </button>

        {expanded && (
          <ul className="flex flex-col gap-2.5">
            {quadrant.items.map((item, i) => (
              <li key={i} className="border-l-2 pl-2.5 text-sm leading-snug" style={{ borderColor: `${color}55` }}>
                <div className="flex items-start justify-between gap-2">
                  <span>{item.text}</span>
                  <PeriodBadge period={item.period} />
                </div>
                {item.source && <span className="mt-0.5 block text-xs text-muted-foreground">{item.source}</span>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Qué cuadrantes (F/D/O/A) participan en cada casilla del cruce estratégico,
 *  para resaltarlas cuando se hace click en un cuadrante de la matriz. */
const CRUCE_QUADRANTS: Record<string, DofaQuadrantKey[]> = {
  FO: ["F", "O"],
  DO: ["D", "O"],
  FA: ["F", "A"],
  DA: ["D", "A"],
};

export function DofaBoard() {
  const [activeQuadrant, setActiveQuadrant] = useState<DofaQuadrantKey | null>(null);

  const highlightedCruceCodes = useMemo(() => {
    if (!activeQuadrant) return new Set<string>();
    return new Set(Object.entries(CRUCE_QUADRANTS).filter(([, ks]) => ks.includes(activeQuadrant)).map(([code]) => code));
  }, [activeQuadrant]);

  function goToQuadrant(key: DofaQuadrantKey) {
    setActiveQuadrant(key);
    document.getElementById(`dofa-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="flex flex-col gap-8">
      <ComparativoSemestral />

      <ProportionBar onSelect={goToQuadrant} />

      <p className="text-xs text-muted-foreground">
        En cada cuadrante, los hallazgos de <span className="font-medium text-primary">2026-I</span> y{" "}
        <span className="font-medium text-primary">Estructural</span> (vigentes hoy) van primero; 2025-I y 2025-II
        quedan al final como antecedente.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {DOFA_QUADRANTS.map((q) => (
          <Quadrant
            key={q.key}
            quadrant={q}
            highlighted={activeQuadrant === q.key}
            onClick={() => goToQuadrant(q.key)}
          />
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold">Cruce estratégico</h2>
          <p className="text-sm text-muted-foreground">
            Qué hacer con cada combinación. Al hacer click en un cuadrante de arriba, se resaltan aquí las casillas
            en las que participa.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {CRUCE_ESTRATEGICO.map((c) => {
            const [k1, k2] = CRUCE_QUADRANTS[c.code];
            const color1 = DOFA_QUADRANTS.find((q) => q.key === k1)?.color;
            const color2 = DOFA_QUADRANTS.find((q) => q.key === k2)?.color;
            const isHighlighted = highlightedCruceCodes.has(c.code);
            return (
              <Card
                key={c.code}
                className={cn("transition-shadow", isHighlighted && "ring-2 ring-primary ring-offset-2")}
              >
                <CardContent className="flex flex-col gap-2 pt-5">
                  <div className="flex items-center gap-2">
                    <span className="flex overflow-hidden rounded-full border border-border">
                      <span className="h-3 w-3" style={{ backgroundColor: color1 }} aria-hidden />
                      <span className="h-3 w-3" style={{ backgroundColor: color2 }} aria-hidden />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {c.code} · {c.title}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1.5 text-sm leading-snug">
                    {c.points.map((point, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-muted-foreground">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Próximos 3 pasos concretos</h2>
        <ol className="flex flex-col gap-2.5 text-sm leading-snug">
          {PROXIMOS_PASOS.map((paso, i) => (
            <li key={i} className="flex gap-2.5 rounded-md border border-primary/20 bg-primary/5 p-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span>{paso}</span>
            </li>
          ))}
        </ol>
      </section>

      <details className="rounded-md border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Anexo — Parámetros operativos vigentes (Manual de MicroTalleres y MicroEventos, 2026)
        </summary>
        <dl className="mt-3 flex flex-col gap-3">
          {PARAMETROS_OPERATIVOS.map((p) => (
            <div key={p.label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.label}</dt>
              <dd>
                <ul className="mt-1 flex flex-col gap-1 text-sm leading-snug">
                  {p.points.map((point, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-muted-foreground">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
