"use client";

import { useMemo, useState } from "react";
import { PieChart } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { categoryColor } from "@/lib/category-color";

type Slice = { category: string; count: number; pct: number; color: string };

function buildSlices(items: { category: string }[]): Slice[] {
  const counts = new Map<string, number>();
  for (const it of items) counts.set(it.category, (counts.get(it.category) ?? 0) + 1);
  const total = items.length || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      count,
      pct: (count / total) * 100,
      color: categoryColor(category),
    }));
}

/** Rueda (donut) sin librerías: cada categoría es un arco del anillo, en el
 *  mismo orden de la leyenda. */
function Donut({ slices, total }: { slices: Slice[]; total: number }) {
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
        aria-label="Distribución de proyectos por categoría"
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        {slices.map((s) => {
          const len = (s.pct / 100) * c;
          const el = (
            <circle
              key={s.category}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
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

export function CategoryDistribution({ projects }: { projects: { category: string }[] }) {
  const [open, setOpen] = useState(false);
  const slices = useMemo(() => buildSlices(projects), [projects]);

  return (
    // display: contents -> este wrapper desaparece del layout; el botón y el
    // panel (cuando está abierto) quedan como hijos directos del contenedor
    // con flex-wrap del llamador, así el panel puede ocupar todo el ancho.
    <div className="contents">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="press inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <PieChart className="h-4 w-4" aria-hidden />
        Por categoría
      </button>

      {open && (
        <Card className="w-full">
          <CardContent className="flex flex-wrap items-center gap-6 pt-5">
            <Donut slices={slices} total={projects.length} />
            <ul className="flex min-w-[14rem] flex-1 flex-col gap-1.5 text-sm">
              {slices.map((s) => (
                <li key={s.category} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                    style={{ backgroundColor: s.color }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate">{s.category}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {s.count} · {Math.round(s.pct)}%
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
