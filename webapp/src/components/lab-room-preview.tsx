"use client";

import { useState } from "react";
import { Check, Monitor } from "lucide-react";

import { cn } from "@/lib/utils";

/** Boceto de una sala tipo laboratorio: qué programa está en qué equipo, para
 *  ver de un vistazo la disponibilidad sin abrir nada. Datos de ejemplo (no es
 *  el inventario real todavía) — el objetivo es probar la idea antes de cargar
 *  la disposición real de cada sala. */

type Software = {
  key: string;
  label: string;
  color: string;
  /** Puestos (1..SEAT_COUNT) donde está instalado, ilustrativo. */
  seats: number[];
};

const SEAT_COUNT = 25;

const SOFTWARE: Software[] = [
  { key: "r", label: "R", color: "#2563EB", seats: [1, 3, 5, 7, 9, 12, 14, 16, 18, 20, 23, 25] },
  {
    key: "excel",
    label: "Excel",
    color: "#16A34A",
    seats: Array.from({ length: SEAT_COUNT }, (_, i) => i + 1),
  },
  { key: "sigo", label: "Sigo", color: "#7C3AED", seats: [2, 4, 6, 8, 10, 13, 15, 17] },
  {
    key: "powerbi",
    label: "Power BI",
    color: "#D97706",
    seats: [1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 21, 22, 23, 24, 25],
  },
];

/** Puestos 1..25 en filas de 5, con un pasillo central (2 + pasillo + 3) como
 *  una sala real de cómputo. */
function seatRows(): number[][] {
  const rows: number[][] = [];
  for (let r = 0; r < SEAT_COUNT / 5; r++) {
    const base = r * 5;
    rows.push([base + 1, base + 2, base + 3, base + 4, base + 5]);
  }
  return rows;
}

function Seat({ n, active, dimmed, color }: { n: number; active: boolean; dimmed: boolean; color?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-semibold transition-all duration-150",
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
      <Monitor className="h-4 w-4" />
      <span>{n}</span>
    </div>
  );
}

export function LabRoomPreview() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const active = SOFTWARE.find((s) => s.key === activeKey) ?? null;
  const rows = seatRows();

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

      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-input bg-muted/20 p-4">
        <div className="w-full max-w-xs rounded-md border border-border bg-muted/60 py-1.5 text-center text-xs font-medium text-muted-foreground">
          Tablero
        </div>

        <div className="flex flex-col gap-3">
          {rows.map((row, i) => {
            const [left, right] = [row.slice(0, 2), row.slice(2)];
            return (
              <div key={i} className="flex items-center gap-3">
                {left.map((n) => (
                  <Seat
                    key={n}
                    n={n}
                    color={active?.color}
                    active={!!active && active.seats.includes(n)}
                    dimmed={!!active && !active.seats.includes(n)}
                  />
                ))}
                <div className="w-6" aria-hidden />
                {right.map((n) => (
                  <Seat
                    key={n}
                    n={n}
                    color={active?.color}
                    active={!!active && active.seats.includes(n)}
                    dimmed={!!active && !active.seats.includes(n)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Boceto para probar la idea: la distribución y el software por equipo son de ejemplo, todavía no es
        el inventario real de la sala.
      </p>
    </div>
  );
}
