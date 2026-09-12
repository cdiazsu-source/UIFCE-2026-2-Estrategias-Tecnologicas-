"use client";

import { useState } from "react";
import { Check, Monitor, Pencil, Projector, User, X } from "lucide-react";

import { updateLabSeat } from "@/lib/actions/lab-seats";
import { useCanEdit } from "@/components/access-context";
import { cn } from "@/lib/utils";

/** Disposición real de Sala 1: no es simétrica (el salón tampoco lo es).
 *  - Columna A: 3 filas de 4, 6 y 7 equipos (17 en total). Los equipos 1-4 no
 *    son una fila recta: van en media luna frente a la mesa del profesor (una
 *    mesa independiente, cuadrada, que no es un puesto), pegada al pasillo y
 *    junto al tablero. El resto de las filas de la columna A van justo detrás.
 *  - Columna B: 4 filas de 5, 6, 6 y 6 equipos (23 en total), en línea recta
 *    — el primer puesto de cada fila (18, 23, 29, 35) queda alineado.
 *  - Entre A y B hay un pasillo central bien definido.
 *  Total: 40 equipos, más el tablero (que en realidad es un proyector,
 *  puesto 0). Cada equipo y el tablero son una vitrina publicitaria de la
 *  unidad: se trackea qué software tienen licenciado y qué fondo de
 *  pantalla / contenido muestran (idealmente el QR al Linktree de la UIFCE). */

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

type Software = { key: string; label: string; color: string };

const SOFTWARE: Software[] = [
  { key: "excel", label: "Excel", color: "#16A34A" },
  { key: "r", label: "R", color: "#2563EB" },
  { key: "siigo", label: "Siigo", color: "#7C3AED" },
  { key: "powerbi", label: "Power BI", color: "#D97706" },
];

/** Ficha de un equipo o del tablero: nombre, software licenciado (solo
 *  equipos) y qué fondo de pantalla / contenido promocional muestra ahora. */
export type SeatData = { name?: string; software: string[]; wallpaper?: string };

/** Un equipo: número + nombre opcional (ej. "UIFCE-09"). Con perfil completo,
 *  click selecciona el equipo para editarlo en la ficha de la esquina. */
function Seat({
  n,
  selected,
  onSelect,
  name,
  active,
  dimmed,
  color,
  canEdit,
}: {
  n: number;
  selected: boolean;
  onSelect: (n: number) => void;
  name?: string;
  active: boolean;
  dimmed: boolean;
  color?: string;
  canEdit: boolean;
}) {
  return (
    <button
      type="button"
      disabled={!canEdit}
      onClick={() => onSelect(n)}
      title={name ? `${name} (equipo ${n})` : `Equipo ${n}${canEdit ? " — click para gestionarlo" : ""}`}
      className={cn(
        "relative flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-semibold transition-all duration-150",
        canEdit && "cursor-pointer hover:ring-2 hover:ring-primary/40",
        !canEdit && "cursor-default",
        !active && !dimmed && "border-border bg-muted/60 text-muted-foreground",
        dimmed && "border-border/40 bg-muted/20 text-muted-foreground/30",
        selected && "ring-2 ring-primary",
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
      {name && <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" aria-hidden />}
    </button>
  );
}

/** Fila recta. `align="start"` alinea el primer puesto de todas las filas al
 *  mismo borde izquierdo (columna B, filas de distinto largo); `"center"`
 *  (por defecto) centra cada fila. */
function StraightRow({
  seats,
  active,
  activeSeats,
  color,
  align = "center",
  seatData,
  selectedSeat,
  onSelect,
  canEdit,
}: {
  seats: number[];
  active: Software | null;
  activeSeats: number[];
  color?: string;
  align?: "center" | "start";
  seatData: Record<number, SeatData>;
  selectedSeat: number | null;
  onSelect: (n: number) => void;
  canEdit: boolean;
}) {
  return (
    <div className={cn("flex gap-2", align === "center" ? "justify-center" : "justify-start")}>
      {seats.map((n) => (
        <Seat
          key={n}
          n={n}
          selected={selectedSeat === n}
          onSelect={onSelect}
          name={seatData[n]?.name}
          color={color}
          active={!!active && activeSeats.includes(n)}
          dimmed={!!active && !activeSeats.includes(n)}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}

/** Los equipos 1-4 en media luna frente a la mesa del profesor: un arco
 *  suave (los extremos un poco más "atrás" que el centro), no una fila recta. */
function CrescentRow({
  seats,
  active,
  activeSeats,
  color,
  seatData,
  selectedSeat,
  onSelect,
  canEdit,
}: {
  seats: number[];
  active: Software | null;
  activeSeats: number[];
  color?: string;
  seatData: Record<number, SeatData>;
  selectedSeat: number | null;
  onSelect: (n: number) => void;
  canEdit: boolean;
}) {
  const mid = (seats.length - 1) / 2;

  return (
    <div className="flex items-end justify-center gap-2">
      {seats.map((n, i) => (
        <div key={n} style={{ transform: `translateY(${Math.abs(i - mid) * 4}px)` }}>
          <Seat
            n={n}
            selected={selectedSeat === n}
            onSelect={onSelect}
            name={seatData[n]?.name}
            color={color}
            active={!!active && activeSeats.includes(n)}
            dimmed={!!active && !activeSeats.includes(n)}
            canEdit={canEdit}
          />
        </div>
      ))}
    </div>
  );
}

/** Mesa del profesor: independiente, no es un puesto de la fila ni un equipo
 *  trackeable (es solo el mueble). */
function TeacherDesk() {
  return (
    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border-2 border-foreground/25 bg-muted text-center text-[9px] font-semibold leading-tight text-muted-foreground">
      <User className="h-3.5 w-3.5" />
      <span className="leading-none">Mesa</span>
      <span className="leading-none">prof.</span>
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
  activeSeats,
  crescentFirstRow = false,
  align = "center",
  seatData,
  selectedSeat,
  onSelect,
  canEdit,
}: {
  title: string;
  rows: number[][];
  active: Software | null;
  activeSeats: number[];
  crescentFirstRow?: boolean;
  align?: "center" | "start";
  seatData: Record<number, SeatData>;
  selectedSeat: number | null;
  onSelect: (n: number) => void;
  canEdit: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-3", align === "center" ? "items-center" : "items-start")}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
      <div className="flex flex-col gap-4">
        {rows.map((row, i) => {
          const isFirst = i === 0;
          const rowProps = { active, activeSeats, color: active?.color, seatData, selectedSeat, onSelect, canEdit };
          return isFirst && crescentFirstRow ? (
            // Junto al pasillo: pegada al borde derecho de la columna A, que
            // es justo el borde que da al pasillo central.
            <div key={i} className="flex flex-col items-center gap-1.5 self-end">
              <TeacherDesk />
              <CrescentRow seats={row} {...rowProps} />
            </div>
          ) : (
            <StraightRow key={i} seats={row} align={align} {...rowProps} />
          );
        })}
      </div>
    </div>
  );
}

const PROJECTOR_SEAT = 0;

/** Ficha de gestión de un equipo (o del tablero/proyector): se abre siempre
 *  en la misma esquina superior derecha del esquema, una zona que nunca
 *  tiene equipos, para no taparlos al editar. */
function SeatCard({
  room,
  seatNumber,
  data,
  onClose,
}: {
  room: string;
  seatNumber: number;
  data: SeatData | undefined;
  onClose: () => void;
}) {
  const isProjector = seatNumber === PROJECTOR_SEAT;

  return (
    <form
      action={async (formData) => {
        await updateLabSeat(room, seatNumber, {
          name: String(formData.get("name") ?? ""),
          software: isProjector ? [] : formData.getAll("software").map(String),
          wallpaper: String(formData.get("wallpaper") ?? ""),
          isProjector,
        });
        onClose();
      }}
      className="flex w-64 max-w-[85vw] flex-col gap-2.5 rounded-md border border-border bg-card p-3 shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{isProjector ? "Tablero (proyector)" : `Equipo ${seatNumber}`}</span>
        <button type="button" onClick={onClose} className="press rounded p-0.5 text-muted-foreground hover:bg-accent">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <label className="flex flex-col gap-1 text-[10px] font-medium text-muted-foreground">
        {isProjector ? "Nombre / etiqueta" : "Nombre del equipo"}
        <input
          name="name"
          autoFocus
          defaultValue={data?.name ?? ""}
          placeholder={isProjector ? "ej. Proyector Sala 1" : `ej. UIFCE-${String(seatNumber).padStart(2, "0")}`}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          className="w-full rounded border border-input bg-background px-1.5 py-1 text-xs text-foreground"
        />
      </label>

      {!isProjector && (
        <div className="flex flex-col gap-1 text-[10px] font-medium text-muted-foreground">
          Software con licencia
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {SOFTWARE.map((s) => (
              <label key={s.key} className="flex items-center gap-1 text-[11px] font-normal text-foreground">
                <input type="checkbox" name="software" value={s.key} defaultChecked={data?.software.includes(s.key)} />
                {s.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <label className="flex flex-col gap-1 text-[10px] font-medium text-muted-foreground">
        {isProjector ? "Contenido proyectado / promocional actual" : "Fondo de pantalla / protector actual"}
        <textarea
          name="wallpaper"
          rows={2}
          defaultValue={data?.wallpaper ?? ""}
          placeholder={isProjector ? "ej. Slide con QR al Linktree entre clases" : "ej. QR al Linktree de la UIFCE"}
          className="w-full resize-none rounded border border-input bg-background px-1.5 py-1 text-xs text-foreground"
        />
      </label>
      {isProjector && (
        <p className="text-[10px] leading-snug text-muted-foreground">
          También se puede alimentar desde el equipo que esté conectado en cada clase o evento.
        </p>
      )}

      <div className="flex gap-1.5">
        <button type="submit" className="press flex-1 rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground">
          Guardar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="press rounded border border-input px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function LabRoomPreview({ room, seatData }: { room: string; seatData: Record<number, SeatData> }) {
  const canEdit = useCanEdit();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const active = SOFTWARE.find((s) => s.key === activeKey) ?? null;

  const activeSeats = active
    ? Object.entries(seatData)
        .filter(([n, d]) => Number(n) !== PROJECTOR_SEAT && d.software.includes(active.key))
        .map(([n]) => Number(n))
    : [];

  const colA = buildSeats(COL_A_ROWS, 1);
  const colB = buildSeats(COL_B_ROWS, COL_A_ROWS.reduce((a, b) => a + b, 0) + 1);
  const projector = seatData[PROJECTOR_SEAT];

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
          ? `${active.label}: ${activeSeats.length} de ${SEAT_COUNT} equipos.`
          : canEdit
            ? "Elige un programa para ver en qué equipos tiene licencia, o click en un equipo (o en el tablero) para gestionarlo."
            : "Elige un programa para ver en qué equipos tiene licencia."}
      </p>

      <div className="flex flex-col items-center gap-6 rounded-lg border border-dashed border-input bg-muted/20 p-4">
        {/* Grid de 3 columnas: la de la izquierda queda vacía a propósito, del
            mismo ancho que la de la ficha, para que el tablero se mantenga
            centrado tanto si la ficha está abierta como si no. Así la ficha
            nunca cae encima de los equipos: ocupa su propio espacio arriba. */}
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-start gap-3">
          <div aria-hidden />
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => setSelectedSeat(PROJECTOR_SEAT)}
            title={canEdit ? "Gestionar el tablero / proyector" : undefined}
            className={cn(
              "flex w-full max-w-md items-center justify-center gap-1.5 rounded-md border border-border bg-muted/60 py-1.5 text-center text-xs font-medium text-muted-foreground",
              canEdit && "cursor-pointer hover:ring-2 hover:ring-primary/40",
              selectedSeat === PROJECTOR_SEAT && "ring-2 ring-primary",
            )}
          >
            <Projector className="h-3.5 w-3.5" />
            Tablero{projector?.name ? ` · ${projector.name}` : ""}
            {canEdit && <Pencil className="h-3 w-3" />}
          </button>
          <div className="flex justify-end">
            {selectedSeat !== null && (
              <SeatCard room={room} seatNumber={selectedSeat} data={seatData[selectedSeat]} onClose={() => setSelectedSeat(null)} />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-center gap-2">
          <SeatColumn
            title={`Columna A · ${COL_A_ROWS.reduce((a, b) => a + b, 0)} equipos`}
            rows={colA}
            active={active}
            activeSeats={activeSeats}
            crescentFirstRow
            seatData={seatData}
            selectedSeat={selectedSeat}
            onSelect={setSelectedSeat}
            canEdit={canEdit}
          />
          <Pasillo />
          <SeatColumn
            title={`Columna B · ${COL_B_ROWS.reduce((a, b) => a + b, 0)} equipos`}
            rows={colB}
            active={active}
            activeSeats={activeSeats}
            align="start"
            seatData={seatData}
            selectedSeat={selectedSeat}
            onSelect={setSelectedSeat}
            canEdit={canEdit}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Disposición real de la sala (40 equipos, no simétrica — el salón tampoco lo es): en la columna A, los equipos
        1-4 van en media luna frente a la mesa independiente del profesor (junto al pasillo y al tablero, no es un
        puesto de la fila), y el resto de las filas de esa columna van justo detrás; la columna B es una grilla recta
        (18, 23, 29 y 35 alineados), separada de la A por el pasillo central. El tablero es en realidad un proyector.
        Cada equipo y el tablero son vitrina publicitaria de la unidad: su ficha trackea licencias de software y qué
        fondo de pantalla o contenido muestran (ideal: el QR al Linktree de la UIFCE).
      </p>
    </div>
  );
}
