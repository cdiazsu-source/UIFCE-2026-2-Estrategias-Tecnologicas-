"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, PieChart } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { categoryColor } from "@/lib/category-color";
import { macroForCategory } from "@/lib/category-groups";

export type CategoryProject = { id: string; title: string; category: string };

type Slice = { label: string; count: number; pct: number; color: string };

/** Vista de la rueda: nivel 1 = macro-categoría, nivel 2 = subcategoría
 *  (la `category` original), nivel 3 = lista de proyectos. `cameFromMacro`
 *  recuerda si el nivel 2 se saltó (macro con una sola subcategoría), para
 *  que "Volver" desde el nivel 3 regrese al lugar correcto. */
type View =
  | { level: "macro" }
  | { level: "sub"; macro: string }
  | { level: "projects"; macro: string; sub: string; cameFromMacro: boolean };

function buildSlices(counts: Map<string, number>, total: number): Slice[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: (count / total) * 100, color: categoryColor(label) }));
}

/** Rueda (donut) sin librerías: cada rebanada es un arco del anillo, en el
 *  mismo orden de la leyenda. Cada arco es clickable (misma acción que su
 *  fila de leyenda). */
function Donut({
  slices,
  total,
  onSliceClick,
}: {
  slices: Slice[];
  total: number;
  onSliceClick: (label: string) => void;
}) {
  const size = 148;
  const stroke = 24;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative h-[148px] w-[148px] shrink-0">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-full w-full -rotate-90"
        role="img"
        aria-label="Distribución de proyectos"
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        {slices.map((s) => {
          const len = (s.pct / 100) * c;
          const el = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              className="cursor-pointer transition-opacity hover:opacity-75"
              onClick={() => onSliceClick(s.label)}
            >
              <title>{`${s.label} — ${s.count}`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold leading-none">{total}</span>
        <span className="text-[11px] text-muted-foreground">proyectos</span>
      </div>
    </div>
  );
}

function SliceLegend({ slices, onSelect }: { slices: Slice[]; onSelect: (label: string) => void }) {
  return (
    <ul className="flex min-w-[14rem] flex-1 flex-col gap-1">
      {slices.map((s) => (
        <li key={s.label}>
          <button
            type="button"
            onClick={() => onSelect(s.label)}
            className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm hover:bg-accent"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            <span className="flex-1 truncate">{s.label}</span>
            <span className="shrink-0 text-muted-foreground">
              {s.count} · {Math.round(s.pct)}%
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}

function ProjectsList({ projects }: { projects: CategoryProject[] }) {
  return (
    <ul className="flex w-full flex-col gap-1">
      {projects.map((p) => (
        <li key={p.id}>
          <Link
            href={`/proyectos/${p.id}`}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          >
            <span className="truncate">{p.title}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CategoryDistribution({ projects }: { projects: CategoryProject[] }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ level: "macro" });

  const withMacro = useMemo(
    () => projects.map((p) => ({ ...p, macro: macroForCategory(p.category) })),
    [projects],
  );

  const macroSlices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of withMacro) counts.set(p.macro, (counts.get(p.macro) ?? 0) + 1);
    return buildSlices(counts, withMacro.length || 1);
  }, [withMacro]);

  const macroTotal = withMacro.length;

  const projectsInMacro = useMemo(() => {
    if (view.level === "macro") return [];
    return withMacro.filter((p) => p.macro === view.macro);
  }, [withMacro, view]);

  const subSlices = useMemo(() => {
    if (view.level === "macro") return [];
    const counts = new Map<string, number>();
    for (const p of projectsInMacro) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return buildSlices(counts, projectsInMacro.length || 1);
  }, [projectsInMacro, view]);

  const projectsInView = useMemo(() => {
    if (view.level !== "projects") return [];
    return withMacro
      .filter((p) => p.macro === view.macro && p.category === view.sub)
      .sort((a, b) => a.title.localeCompare(b.title, "es"));
  }, [withMacro, view]);

  function toggleOpen() {
    setOpen((v) => {
      if (v) setView({ level: "macro" });
      return !v;
    });
  }

  function selectMacro(macro: string) {
    const inMacro = withMacro.filter((p) => p.macro === macro);
    const distinctCategories = new Set(inMacro.map((p) => p.category));
    // Si la macro-categoría solo tiene una subcategoría real, saltar directo a
    // la lista de proyectos (mostrar una rueda de "100% una rebanada" no aporta).
    if (distinctCategories.size <= 1) {
      setView({ level: "projects", macro, sub: inMacro[0]?.category ?? macro, cameFromMacro: true });
    } else {
      setView({ level: "sub", macro });
    }
  }

  function selectSub(sub: string) {
    if (view.level === "macro") return;
    setView({ level: "projects", macro: view.macro, sub, cameFromMacro: false });
  }

  function goBack() {
    if (view.level === "sub") setView({ level: "macro" });
    else if (view.level === "projects") {
      setView(view.cameFromMacro ? { level: "macro" } : { level: "sub", macro: view.macro });
    }
  }

  const backLabel = view.level === "sub" ? "Todas las categorías" : view.level === "projects" ? view.macro : "";

  return (
    // display: contents -> este wrapper desaparece del layout; el botón y el
    // panel (cuando está abierto) quedan como hijos directos del contenedor
    // con flex-wrap del llamador, así el panel puede ocupar todo el ancho.
    <div className="contents">
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className="press inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <PieChart className="h-4 w-4" aria-hidden />
        Por categoría
      </button>

      {open && (
        <Card className="w-full">
          <CardContent className="flex flex-col gap-3 pt-5">
            {view.level !== "macro" && (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                {backLabel}
              </button>
            )}

            {view.level === "projects" ? (
              <>
                <p className="text-sm font-medium">
                  {view.sub} · {projectsInView.length} proyecto{projectsInView.length === 1 ? "" : "s"}
                </p>
                <ProjectsList projects={projectsInView} />
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-6">
                <Donut
                  slices={view.level === "macro" ? macroSlices : subSlices}
                  total={view.level === "macro" ? macroTotal : projectsInMacro.length}
                  onSliceClick={view.level === "macro" ? selectMacro : selectSub}
                />
                <SliceLegend
                  slices={view.level === "macro" ? macroSlices : subSlices}
                  onSelect={view.level === "macro" ? selectMacro : selectSub}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
