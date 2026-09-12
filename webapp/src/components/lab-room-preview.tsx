"use client";

import { useState } from "react";
import { Check, Monitor, User } from "lucide-react";

import { cn } from "@/lib/utils";

/** Disposición real de Sala 1: dos columnas de puestos.
 *  - Columna A: 3 filas de 4, 6 y 7 equipos (17 en total).
 *  - Columna B: 4 filas de 5, 6, 6 y 6 equipos (23 en total); la fila 4 se
 *    dibuja levemente curvada porque "rodea" el puesto del profesor.
 *  Total: 40 equipos. El software instalado por equipo sigue siendo de
 *  ejemplo (no es el inventario real todavía) — lo real ya cargado es la
 *  disposición física de la sala. */

const COL_A_ROWS = [4, 6, 7];
const COL_B_ROWS = [5, 6, 6, 6];

function buildSeats(rows: number[], start: number): number[][] {
  let n = start;
  return rows.map((count) => {
    const row = Array.from({ length: count }, () => n++);
    return row;
  });
}

const SEAT_COUNT = COL_A_ROWS.reduce((a, b) => a + b, 0) + COL_B_ROWS.reduce((a, b) => a + b, 0);

type Software = {
  key: string;
  label: string;
  color: string;
  /** Puestos (1..SEAT_COUNT) donde está instalado, ilustrativo. */
  seats: number[];
};

const SOFTWARE: Software[] = [
  {
    key: "excel",
    label: "Excel",
    color: "#16A34A",
    seats: Array.from({ length: SEAT_COUNT }, (_, i) => i + 1),
  },
  {
    key: "r",
    label: "R",
    color: "#2563EB",
    seats: [2, 4, 7, 9, 11, 14, 17, 19, 22, 25, 28, 31, 34, 37, 40],
  },
  {
    key: "siigo",
    label: "Siigo",
    color: "#7C3AED",
    seats: [1, 3, 5, 6, 10, 12, 13, 16, 18, 20, 21, 24],
  },
  {
    key: "powerbi",
    label: "Power BI",
    color: "#D97706",
    seats: [11, 12, 13, 14, 15, 16, 17, 29, 30, 31, 32, 33, 34, 35, 36, 37],
  },
];

function Seat({ n, active, dimmed, color }: { n: number; active: boolean; dimmed: boolean; color?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-semibold transition-all duration-150",
        !active && !dimmed && "border-border bg-muted/60 text-muted-foreground",
        dimmed && "border-border/40 bg-muted/20 text-muted-foreground/30",
      )}
      style={active ? { borderColor: color, backgroundColor: `${color}1f`, color } : undefined}
    >
      {active && (
        <span
          className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      )}
      <Monitor className="h-3.5 w-3.5" />
      <span>{n}</span>
    </div>
  );
}

/** Fila recta: todos los puestos alineados. */
function StraightRow({
  seats,
  active,
  color,
}: {
  seats: number[];
  active: Software | null;
  color?: string;
}) {
  return (
    <div className="flex justify-center gap-2">
      {seats.map((n) => (
        <Seat key={n} n={n} color={color} active={!!active && active.seats.includes(n)} dimmed={!!active && !active.seats.includes(n)} />
      ))}
    </div>
  );
}

/** Última fila de la columna B: se curva alrededor del puesto del profesor,
 *  que queda al centro. Puro efecto visual (translateY simétrico) — el motivo
 *  real es que el puesto del profesor invade el espacio de esa fila. */
function CurvedRowAroundTeacherDesk({
  seats,
  active,
  color,
}: {
  seats: number[];
  active: Software | null;
  color?: string;
}) {
  const mid = Math.floor(seats.length / 2);
  const left = seats.slice(0, mid);
  const right = seats.slice(mid);

  function offsetFor(distanceFromDesk: number) {
    return Math.min(distanceFromDesk * 4, 10);
  }

  return (
    <div className="flex items-end justify-center gap-2">
      {left.map((n, i) => (
        <div key={n} style={{ transform: `translateY(-${offsetFor(left.length - i)}px)` }}>
          <Seat n={n} color={color} active={!!active && active.seats.includes(n)} dimmed={!!active && !active.seats.includes(n)} />
        </div>
      ))}
      <div className="flex h-11 w-9 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-muted-foreground/40 text-[9px] text-muted-foreground">
        <User className="h-3.5 w-3.5" />
        <span className="leading-none">Prof.</span>
      </div>
      {right.map((n, i) => (
        <div key={n} style={{ transform: `translateY(-${offsetFor(i + 1)}px)` }}>
          <Seat n={n} color={color} active={!!active && active.seats.includes(n)} dimmed={!!active && !active.seats.includes(n)} />
        </div>
      ))}
    </div>
  );
}

function SeatColumn({
  title,
  rows,
  active,
  curveLastRow = false,
}: {
  title: string;
  rows: number[][];
  active: Software | null;
  curveLastRow?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
      <div className="flex flex-col gap-3">
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1;
          return isLast && curveLastRow ? (
            <CurvedRowAroundTeacherDesk key={i} seats={row} active={active} color={active?.color} />
          ) : (
            <StraightRow key={i} seats={row} active={active} color={active?.color} />
          );
        })}
      </div>
    </div>
  );
}

export function LabRoomPreview() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const active = SOFTWARE.find((s) => s.key === activeKey) ?? null;

  const colA = buildSeats(COL_A_ROWS, 1);
  const colB = buildSeats(COL_B_ROWS, COL_A_ROWS.reduce((a, b) => a + b, 0) + 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveKey(null)}
          className={cn(
            "press rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
            activeKey === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          Todos
        </button>
        {SOFTWARE.map((s) => {
          const isActive = s.key === activeKey;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveKey((k) => (k === s.key ? null : s.key))}
              className="press rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
              style={
                isActive
                  ? { borderColor: s.color, backgroundColor: s.color, color: "#fff" }
                  : { borderColor: "hsl(var(--input))" }
              }
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        {active
          ? `${active.label}: ${active.seats.length} de ${SEAT_COUNT} equipos.`
          : "Elige un programa para ver en qué equipos está instalado."}
      </p>

      <div className="flex flex-col items-center gap-6 rounded-lg border border-dashed border-input bg-muted/20 p-4">
        <div className="w-full max-w-md rounded-md border border-border bg-muted/60 py-1.5 text-center text-xs font-medium text-muted-foreground">
          Tablero
        </div>

        <div className="flex flex-wrap items-start justify-center gap-8">
          <SeatColumn title={`Columna A · ${COL_A_ROWS.reduce((a, b) => a + b, 0)} equipos`} rows={colA} active={active} />
          <div className="hidden w-px self-stretch bg-border sm:block" aria-hidden />
          <SeatColumn
            title={`Columna B · ${COL_B_ROWS.reduce((a, b) => a + b, 0)} equipos`}
            rows={colB}
            active={active}
            curveLastRow
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Disposición real de la sala (40 equipos: columna A con 3 filas, columna B con 4 — la última rodea el puesto
        del profesor). El software instalado por equipo todavía es de ejemplo, no el inventario real.
      </p>
    </div>
  );
}
