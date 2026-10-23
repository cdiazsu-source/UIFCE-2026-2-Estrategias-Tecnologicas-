"use client";

import { useState } from "react";
import Link from "next/link";

import { cn, timeAgo, bogotaDateKey } from "@/lib/utils";
import type { Footprint, FootprintRange, FootprintStatus } from "@/lib/welcome-types";

const RANGES: { value: FootprintRange; label: string }[] = [
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "semestre", label: "Semestre" },
];

/** Intensidad de cada cuadro de la tira de siete días (nivel 0 a 4). */
const HEAT = ["", "rgba(0,0,102,0.14)", "rgba(0,0,102,0.38)", "rgba(0,0,102,0.62)", "rgba(0,0,102,0.9)"];
const DAY_LETTER = ["D", "L", "M", "X", "J", "V", "S"];

const STATUS: Record<FootprintStatus, { label: string; cls: string }> = {
  ACTIVO: { label: "Activo", cls: "bg-success/15 text-success" },
  POCA: { label: "Poca actividad", cls: "bg-warning/15 text-warning" },
  SIN: { label: "Sin actividad", cls: "bg-destructive/10 text-destructive" },
};

const PROJECTS_SHOWN = 5;

/** «hoy, 3:05 pm», «ayer, 6:40 pm», «hace 9 días». */
function whenLabel(iso: string | null): string {
  if (!iso) return "sin registro";
  const d = new Date(iso);
  const dayKey = bogotaDateKey(d);
  const today = bogotaDateKey(new Date());
  const yesterday = bogotaDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const time = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", hour: "numeric", minute: "2-digit", hour12: true }).format(d).replace(/\s+/g, " ");
  if (dayKey === today) return `hoy, ${time}`;
  if (dayKey === yesterday) return `ayer, ${time}`;
  return timeAgo(d);
}

/** Letra del día de la semana de una clave «AAAA-MM-DD» (se lee al mediodía UTC para no correrse de día). */
const letterOf = (key: string) => DAY_LETTER[new Date(`${key}T12:00:00Z`).getUTCDay()];

/** Huella digital de los monitores Junior para el máster: quién usó la app (con tira de 7 días) y qué tanto se tocó cada proyecto,
 *  resaltando los asignados que no tienen huella. */
export function FootprintPanel({ footprint, loading, onRange }: { footprint: Footprint; loading: boolean; onRange: (r: FootprintRange) => void }) {
  const [all, setAll] = useState(false);
  const shown = all ? footprint.projects : footprint.projects.slice(0, PROJECTS_SHOWN);
  const hidden = footprint.projects.length - shown.length;
  const empty = footprint.juniors.length === 0;

  return (
    <div className={cn("flex flex-col gap-4", loading && "opacity-60")} aria-busy={loading}>
      <section className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-medium text-muted-foreground">Quién usó la app</h2>
          <div className="flex gap-1.5" role="group" aria-label="Rango de la huella">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-pressed={footprint.range === r.value}
                onClick={() => onRange(r.value)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                  footprint.range === r.value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {empty && <p className="py-2 text-sm text-muted-foreground">Todavía no hay monitores Junior con perfil propio.</p>}
        {footprint.juniors.map((j) => (
          <div key={j.id} className="grid items-center gap-x-4 gap-y-2 border-b border-border py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{ background: `${j.color ?? "#1D1DA5"}22`, color: j.color ?? "#1D1DA5" }}
                aria-hidden
              >
                {j.firstName.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                  {j.firstName}
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-normal", STATUS[j.status].cls)}>{STATUS[j.status].label}</span>
                </p>
                <p className="text-xs text-muted-foreground">Último ingreso: {whenLabel(j.lastSeen)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-[3px]" role="img" aria-label={`Actividad de los últimos 7 días de ${j.firstName}`}>
                {j.strip.map((c) => (
                  <span
                    key={c.key}
                    title={`${c.key}: ${c.level === 0 ? "sin actividad" : "con actividad"}`}
                    className={cn("flex h-[22px] w-[22px] items-center justify-center rounded text-[10px]", c.level === 0 ? "border border-border bg-muted/50 text-muted-foreground" : c.level >= 3 ? "text-white" : "text-primary")}
                    style={c.level > 0 ? { background: HEAT[c.level] } : undefined}
                  >
                    {letterOf(c.key)}
                  </span>
                ))}
              </div>
              <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span>
                  <b className="font-medium text-foreground">{j.activeDays}</b> de {j.rangeDays} días
                </span>
                <span>
                  <b className="font-medium text-foreground">{j.clicks}</b> clics
                </span>
                <span>
                  <b className="font-medium text-foreground">{j.projects}</b> proyectos
                </span>
                <span>
                  <b className="font-medium text-foreground">{j.changes}</b> cambios
                </span>
              </p>
            </div>
          </div>
        ))}
      </section>

      {footprint.projects.length > 0 && (
        <section className="flex flex-col gap-1">
          <h2 className="text-xs font-medium text-muted-foreground">Por proyecto</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] table-fixed border-collapse text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="w-[42%] py-1 pr-2 text-left font-normal">Proyecto (responsable)</th>
                  <th className="py-1 text-right font-normal">Visitas</th>
                  <th className="py-1 text-right font-normal">Clics</th>
                  <th className="py-1 text-right font-normal">Cambios</th>
                  <th className="w-[22%] py-1 text-right font-normal">Última huella</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => {
                  const none = p.visits + p.clicks + p.changes === 0;
                  return (
                    <tr key={p.id} className={cn("border-t border-border", none && "text-warning")}>
                      <td className="truncate py-1.5 pr-2">
                        <Link href={`/proyectos/${encodeURIComponent(p.id)}`} className="hover:underline" title={p.title}>
                          {p.title}
                        </Link>
                        {p.assignee && <span className="text-muted-foreground"> ({p.assignee})</span>}
                      </td>
                      <td className="py-1.5 text-right">{p.visits}</td>
                      <td className="py-1.5 text-right">{p.clicks}</td>
                      <td className="py-1.5 text-right">{p.changes}</td>
                      <td className="py-1.5 text-right">{p.last ? (none ? timeAgo(p.last) : whenLabel(p.last)) : "sin huella"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(hidden > 0 || all) && footprint.projects.length > PROJECTS_SHOWN && (
            <button type="button" onClick={() => setAll((v) => !v)} className="self-start text-xs text-muted-foreground underline hover:text-foreground">
              {all ? "Ver menos proyectos" : `Ver los ${footprint.projects.length} proyectos`}
            </button>
          )}
        </section>
      )}

      {footprint.modules.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>Pantallas más visitadas:</span>
          {footprint.modules.map((m) => (
            <span key={m.label} className="rounded-full border border-border px-2 py-0.5">
              {m.label} {m.count}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
