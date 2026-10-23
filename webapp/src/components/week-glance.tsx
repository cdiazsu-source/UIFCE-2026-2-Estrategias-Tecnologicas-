"use client";

import { cn } from "@/lib/utils";
import { useNow } from "@/components/schedule-board";
import {
  SCHEDULE_DAYS,
  SCHEDULE_END_HOUR,
  SCHEDULE_START_HOUR,
  SHIFT_CATEGORY_LABEL,
  BUILDING_STYLE,
  activeNow,
  buildingStyle,
  fmtTime,
  layoutDay,
  shiftLabel,
  type ShiftData,
} from "@/lib/office-schedule";

/** Alto de una hora en la grilla compacta (px). */
const ROW = 22;

/** Resumen de horas por edificio: «16 h en el edificio 310 y 2 h en el 238». */
function hoursByBuilding(shifts: ShiftData[]): { total: number; text: string } {
  const per = new Map<string, number>();
  for (const s of shifts) per.set(s.location, (per.get(s.location) ?? 0) + (s.end - s.start) / 60);
  const parts = [...per.entries()].sort((a, b) => b[1] - a[1]);
  const total = parts.reduce((n, [, h]) => n + h, 0);
  const fmt = (h: number) => String(Math.round(h * 10) / 10).replace(".", ",");
  const text = parts.map(([b, h], i) => `${fmt(h)} h en ${i === 0 ? "el edificio " : "el "}${b}`).join(" y ");
  return { total, text };
}

/** Semana de lunes a sábado de una persona, compacta: bloques por edificio, los que ya pasaron en gris, el bloque actual con
 *  contorno, la columna de hoy resaltada y una línea con la hora actual. */
export function WeekGlance({ shifts }: { shifts: ShiftData[] }) {
  const now = useNow();
  const startHour = Math.min(SCHEDULE_START_HOUR, ...shifts.map((s) => Math.floor(s.start / 60)));
  const endHour = Math.max(SCHEDULE_END_HOUR, ...shifts.map((s) => Math.ceil(s.end / 60)));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const mine = shifts.filter((s) => s.userId !== null);
  const sum = hoursByBuilding(mine);
  const live = now ? activeNow(shifts, now) : [];
  const isPast = (s: ShiftData) => !!now && now.day !== 7 && (s.day < now.day || (s.day === now.day && s.end <= now.minutes));

  return (
    <div className="flex flex-col gap-2">
      <p className="flex flex-wrap justify-between gap-x-3 text-xs text-muted-foreground">
        <span>
          Tu semana{sum.total > 0 ? ` · ${Math.round(sum.total * 10) / 10} h: ${sum.text}` : ""}
        </span>
      </p>
      <div className="overflow-x-auto">
        <div className="grid min-w-[480px] text-[11px]" style={{ gridTemplateColumns: "30px repeat(6, minmax(0, 1fr))" }}>
          <div />
          {SCHEDULE_DAYS.map((d) => (
            <div key={d.n} className="px-0.5 py-1 text-center text-muted-foreground">
              <span className={cn("rounded-full px-2 py-0.5", now?.day === d.n && "bg-primary font-medium text-primary-foreground")}>{d.short}</span>
            </div>
          ))}
          <div>
            {hours.map((h) => (
              <div key={h} className="pr-1 text-right text-muted-foreground" style={{ height: ROW }}>
                <span className="relative -top-1.5">{h}</span>
              </div>
            ))}
          </div>
          {SCHEDULE_DAYS.map((d) => {
            const laid = layoutDay(shifts.filter((s) => s.day === d.n));
            return (
              <div
                key={d.n}
                className={cn("relative border-l border-border", now?.day === d.n && "bg-muted/60")}
                style={{ height: hours.length * ROW, backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px)", backgroundSize: `100% ${ROW}px` }}
              >
                {laid.map((s) => {
                  const st = buildingStyle(s.location);
                  const past = isPast(s);
                  const current = live.some((x) => x.id === s.id);
                  const w = 100 / s.lanes;
                  return (
                    <div
                      key={s.id}
                      title={`${SHIFT_CATEGORY_LABEL[s.category]}${s.label ? ` · ${s.label}` : ""} · edificio ${s.location} · ${fmtTime(s.start)}–${fmtTime(s.end)}`}
                      className={cn("absolute overflow-hidden rounded px-1 py-0.5 leading-tight", current && "z-[5] font-medium ring-2 ring-primary ring-offset-1")}
                      style={{
                        top: ((s.start - startHour * 60) / 60) * ROW,
                        height: ((s.end - s.start) / 60) * ROW - 2,
                        left: `calc(${s.lane * w}% + 1px)`,
                        width: `calc(${w}% - 2px)`,
                        ...(past ? { background: "#F1F1F1", color: "#8A8A8A", border: "1px solid #E2E2E2" } : { background: st.bg, color: st.fg }),
                      }}
                    >
                      {shiftLabel(s)}
                    </div>
                  );
                })}
                {now?.day === d.n && now.minutes >= startHour * 60 && now.minutes <= endHour * 60 && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: ((now.minutes - startHour * 60) / 60) * ROW }} aria-hidden>
                    <span className="-ml-1 h-2 w-2 rounded-full bg-destructive" />
                    <span className="h-px flex-1 bg-destructive" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {Object.entries(BUILDING_STYLE).map(([b, st]) => (
          <span key={b} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: st.bg, outline: `1px solid ${st.border}` }} aria-hidden />
            Edificio {b}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#F1F1F1", border: "1px solid #E2E2E2" }} aria-hidden />
          Ya pasó
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-card ring-2 ring-primary" aria-hidden />
          Bloque actual
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-px w-3.5 bg-destructive" aria-hidden />
          Hora actual
        </span>
      </p>
    </div>
  );
}
