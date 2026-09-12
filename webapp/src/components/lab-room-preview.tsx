"use client";

import { useState } from "react";
import { Check, Monitor, User } from "lucide-react";

import { cn } from "@/lib/utils";

/** Disposición real de Sala 1: no es simétrica.
 *  - Columna A: 3 filas de 4, 6 y 7 equipos (17 en total). Los equipos 1-4 no
 *    son una fila: van en circunferencia alrededor de la mesa del profesor
 *    (una mesa independiente, cuadrada, que no es un puesto), pegada al
 *    pasillo y junto al tablero.
 *  - Columna B: 4 filas de 5, 6, 6 y 6 equipos (23 en total), en línea recta
 *    — el primer puesto de cada fila (18, 23, 29, 35) queda alineado.
 *  - Entre A y B hay un pasillo central bien definido.
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

/** Fila recta. `align="start"` alinea el primer puesto de todas las filas al
 *  mismo borde izquierdo (columna B, filas de distinto largo); `"center"`
 *  (por defecto) centra cada fila. */
function StraightRow({
  seats,
  active,
  color,
  align = "center",
}: {
  seats: number[];
  active: Software | null;
  color?: string;
  align?: "center" | "start";
}) {
  return (
    <div className={cn("flex gap-2", align === "center" ? "justify-center" : "justify-start")}>
      {seats.map((n) => (
        <Seat key={n} n={n} color={color} active={!!active && active.seats.includes(n)} dimmed={!!active && !active.seats.includes(n)} />
      ))}
    </div>
  );
}

/** Los equipos 1-4 en circunferencia alrededor de la mesa del profesor. La
 *  mesa es independiente (no es un puesto de la fila): una mesa cuadrada al
 *  centro, con un equipo en cada punto cardinal alrededor. */
function TeacherDeskCluster({
  seats,
  active,
  color,
}: {
  /** Exactamente 4, en orden: [arriba, derecha, abajo, izquierda]. */
  seats: [number, number, number, number];
  active: Software | null;
  color?: string;
}) {
  const [top, right, bottom, left] = seats;
  const seatProps = (n: number) => ({
    n,
    color,
    active: !!active && active.seats.includes(n),
    dimmed: !!active && !active.seats.includes(n),
  });
  return (
    <div className="grid grid-cols-3 grid-rows-3 place-items-center gap-1.5">
      <div />
      <Seat {...seatProps(top)} />
      <div />
      <Seat {...seatProps(left)} />
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border-2 border-foreground/25 bg-muted text-center text-[9px] font-semibold leading-tight text-muted-foreground">
        <User className="h-3.5 w-3.5" />
        <span className="leading-none">Mesa</span>
        <span className="leading-none">prof.</span>
      </div>
      <Seat {...seatProps(right)} />
      <div />
      <Seat {...seatProps(bottom)} />
      <div />
    </div>
  );
}

/** Pasillo central, bien definido, entre columna A y columna B. */
function Pasillo() {
  return (
    <div className="relative flex w-10 shrink-0 items-stretch justify-center self-stretch" aria-hidden>
      <div className="h-full border-l border-dashed border-muted-foreground/50" />
      <span
        className="absolute inset-y-0 my-auto h-fit whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60"
        style={{ writingMode: "vertical-rl" }}
      >
        Pasillo
      </span>
    </div>
  );
}

function SeatColumn({
  title,
  rows,
  active,
  curveFirstRow = false,
  align = "center",
}: {
  title: string;
  rows: number[][];
  active: Software | null;
  curveFirstRow?: boolean;
  align?: "center" | "start";
}) {
  return (
    <div className={cn("flex flex-col gap-3", align === "center" ? "items-center" : "items-start")}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
      <div className="flex flex-col gap-3">
        {rows.map((row, i) => {
          const isFirst = i === 0;
          return isFirst && curveFirstRow ? (
            // Junto al pasillo: pegada al borde derecho de la columna A, que
            // es justo el borde que da al pasillo central.
            <div key={i} className="self-end">
              <TeacherDeskCluster seats={row as [number, number, number, number]} active={active} color={active?.color} />
            </div>
          ) : (
            <StraightRow key={i} seats={row} active={active} color={active?.color} align={align} />
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

        <div className="flex flex-wrap items-start justify-center gap-2">
          <SeatColumn title={`Columna A · ${COL_A_ROWS.reduce((a, b) => a + b, 0)} equipos`} rows={colA} active={active} curveFirstRow />
          <Pasillo />
          <SeatColumn
            title={`Columna B · ${COL_B_ROWS.reduce((a, b) => a + b, 0)} equipos`}
            rows={colB}
            active={active}
            align="start"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Disposición real de la sala (40 equipos, no simétrica): en la columna A, los equipos 1-4 van en circunferencia
        alrededor de la mesa independiente del profesor (junto al pasillo y al lado del tablero, no es un puesto de la
        fila); la columna B es una grilla recta (18, 23, 29 y 35 alineados), separada de la A por el pasillo central.
        El software instalado por equipo todavía es de ejemplo, no el inventario real.
      </p>
    </div>
  );
}
