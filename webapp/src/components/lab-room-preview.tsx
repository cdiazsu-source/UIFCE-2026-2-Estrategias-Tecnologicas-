"use client";

import { useState, useTransition } from "react";
import { Search, Trash2, X } from "lucide-react";

import { addLabSeatComment, deleteLabSeatComment, updateLabSeat } from "@/lib/actions/lab-seats";
import { useCanEdit } from "@/components/access-context";
import { cn } from "@/lib/utils";

/** Plano real de Sala 1 (40 equipos + mesa del profesor), dibujado en SVG con
 *  las coordenadas del esquema de la unidad. No es simétrica: el muro derecho
 *  es diagonal (ventanas) y el salón se divide en dos bloques.
 *  - Bloque #1 (izquierda, rejilla recta): 4 filas, de abajo (cerca del
 *    proyector) hacia arriba: 5 (rojo) · 6 (rosa) · 6 (azul) · 6 (verde) =
 *    equipos 18-40.
 *  - Bloque #2 (derecha, curva siguiendo la ventana): mesa del profesor
 *    (rojo, no es un puesto) · 4 (rosa) · 6 (azul) · 7 (verde) = equipos 1-17.
 *  - La numeración va de izquierda a derecha en cada fila, y en las curvas de
 *    pasillo hacia la ventana. El número es el de la BD (LabSeat.number), así
 *    que no cambió nada de lo ya guardado.
 *  - El puesto 0 es el proyector (pared inferior). El «BOARD» del plano es solo
 *    el tablero físico.
 *  Cada equipo y el proyector son una vitrina publicitaria de la unidad: se
 *  trackea qué software tienen licenciado y qué fondo/contenido muestran. */

const RED = "#EB6640";
const PINK = "#FF5C9A";
const BLUE = "#2428EB";
const GREEN = "#1A693A";

type Pt = [number, number];
type SeatRow = { block: 1 | 2; row: number; color: string; pts: Pt[] };

/** Centros de cada equipo en coordenadas del plano (viewBox 40 180 1230 500). */
const LAYOUT: SeatRow[] = [
  // Bloque #1 — rejilla recta
  { block: 1, row: 1, color: RED, pts: [[255, 511], [342, 511], [429, 511], [516, 511], [603, 511]] },
  { block: 1, row: 2, color: PINK, pts: [[168, 428], [255, 428], [342, 428], [429, 428], [516, 428], [603, 428]] },
  { block: 1, row: 3, color: BLUE, pts: [[168, 345], [255, 345], [342, 345], [429, 345], [516, 345], [603, 345]] },
  { block: 1, row: 4, color: GREEN, pts: [[168, 262], [255, 262], [342, 262], [429, 262], [516, 262], [603, 262]] },
  // Bloque #2 — curva siguiendo la ventana (la fila 1 es la mesa del profesor)
  { block: 2, row: 2, color: PINK, pts: [[732, 428], [818, 428], [905, 467], [962, 537]] },
  { block: 2, row: 3, color: BLUE, pts: [[732, 345], [818, 345], [903, 345], [973, 380], [1003, 443], [1033, 522]] },
  { block: 2, row: 4, color: GREEN, pts: [[732, 262], [818, 262], [895, 262], [960, 283], [1045, 322], [1092, 413], [1118, 508]] },
];

const DESK: Pt = [817, 522];

type PlacedSeat = { n: number; x: number; y: number; color: string; block: 1 | 2; row: number };

/** Bloque #2 numera 1-17 (rosa, azul, verde); Bloque #1 sigue con 18-40. */
const SEATS: PlacedSeat[] = (() => {
  const out: PlacedSeat[] = [];
  let n = 1;
  for (const r of [...LAYOUT.filter((l) => l.block === 2), ...LAYOUT.filter((l) => l.block === 1)]) {
    for (const [x, y] of r.pts) out.push({ n: n++, x, y, color: r.color, block: r.block, row: r.row });
  }
  return out;
})();

const SEAT_COUNT = SEATS.length;

type Software = { key: string; label: string; color: string; category: string };

const SOFTWARE: Software[] = [
  // Las llaves excel, r, siigo y powerbi ya estaban guardadas en la BD.
  { key: "powerbi", label: "Power BI", color: "#D97706", category: "Analítica y BI" },
  { key: "tableau", label: "Tableau", color: "#0369A1", category: "Analítica y BI" },
  { key: "sap-lumira", label: "SAP Lumira", color: "#BE185D", category: "Analítica y BI" },
  { key: "access", label: "Access", color: "#B91C1C", category: "Analítica y BI" },
  { key: "excel", label: "Excel", color: "#16A34A", category: "Analítica y BI" },
  { key: "spss", label: "IBM SPSS", color: "#1D4ED8", category: "Estadística y ciencia de datos" },
  { key: "stata", label: "STATA", color: "#0E7490", category: "Estadística y ciencia de datos" },
  { key: "r", label: "R / RStudio", color: "#2563EB", category: "Estadística y ciencia de datos" },
  { key: "anaconda", label: "Anaconda (Python)", color: "#15803D", category: "Estadística y ciencia de datos" },
  { key: "nvivo", label: "NVIVO", color: "#A21CAF", category: "Estadística y ciencia de datos" },
  { key: "geodaspace", label: "GeoDaSpace", color: "#047857", category: "Estadística y ciencia de datos" },
  { key: "gephi", label: "Gephi", color: "#4338CA", category: "Estadística y ciencia de datos" },
  { key: "flexsim", label: "FlexSim", color: "#C2410C", category: "Simulación y gestión" },
  { key: "ms-project", label: "MS Project", color: "#4D7C0F", category: "Simulación y gestión" },
  { key: "world-office", label: "World Office", color: "#6D28D9", category: "Simulación y gestión" },
  { key: "siigo", label: "Siigo", color: "#7C3AED", category: "Simulación y gestión" },
  { key: "zotero", label: "Zotero", color: "#9F1239", category: "Investigación y referencias" },
  { key: "mendeley", label: "Mendeley", color: "#B45309", category: "Investigación y referencias" },
];

const CATEGORIES = Array.from(new Set(SOFTWARE.map((x) => x.category)));

type SwState = "installed" | "pending" | "none";

export type SeatComment = { id: string; author?: string; content: string; createdAt: string };

/** Ficha de un equipo o del proyector: nombre, software licenciado (solo
 *  equipos) y qué fondo de pantalla / contenido promocional muestra ahora. */
export type SeatData = {
  name?: string;
  /** Software instalado. */
  software: string[];
  /** Software pendiente de instalar. */
  pending: string[];
  wallpaper?: string;
  assetTag1?: string;
  assetTag2?: string;
  comments: SeatComment[];
};

const PROJECTOR_SEAT = 0;

/** Un equipo del plano: monitor con su número. Con perfil completo, click lo
 *  selecciona para editarlo en la ficha de arriba a la derecha. */
function Seat({
  seat,
  name,
  selected,
  active,
  pending,
  dimmed,
  swColor,
  hasTag,
  hasNotes,
  canEdit,
  onSelect,
}: {
  seat: PlacedSeat;
  name?: string;
  selected: boolean;
  active: boolean;
  pending: boolean;
  dimmed: boolean;
  swColor?: string;
  hasTag: boolean;
  hasNotes: boolean;
  canEdit: boolean;
  onSelect: (n: number) => void;
}) {
  const stroke = active && swColor ? swColor : seat.color;
  return (
    <g
      transform={`translate(${seat.x} ${seat.y})`}
      opacity={dimmed ? 0.3 : 1}
      className={cn("group transition-opacity", canEdit ? "cursor-pointer" : "cursor-default")}
      onClick={canEdit ? () => onSelect(seat.n) : undefined}
      role={canEdit ? "button" : undefined}
    >
      <title>
        {`${name ? `${name} · ` : ""}Equipo ${seat.n} · Bloque #${seat.block}, fila ${seat.row}${canEdit ? " — click para gestionarlo" : ""}`}
      </title>
      <rect x={-27} y={-27} width={54} height={54} fill="transparent" />
      <rect
        x={-24}
        y={-24}
        width={48}
        height={37}
        rx={4}
        fill={active && swColor ? `${swColor}26` : "hsl(var(--background))"}
        stroke={pending && swColor ? "#F59E0B" : stroke}
        strokeWidth={selected ? 5 : 2.5}
        strokeDasharray={pending ? "6 4" : undefined}
        className={canEdit ? "group-hover:[stroke-width:4.5px]" : undefined}
      />
      {pending && <rect x={-29} y={-29} width={58} height={47} rx={7} fill="none" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 4" />}
      <rect x={-19} y={-19} width={38} height={27} rx={2} fill="none" stroke={stroke} strokeOpacity={0.35} strokeWidth={1.5} />
      <line x1={0} y1={13} x2={0} y2={20} stroke={stroke} strokeWidth={2.5} />
      <line x1={-10} y1={21} x2={10} y2={21} stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
      <text
        y={-5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={17}
        fontWeight={700}
        fill={active && swColor ? swColor : "currentColor"}
      >
        {seat.n}
      </text>
      {name && <circle cx={-19} cy={-19} r={4.5} className="fill-primary" />}
      {hasTag && (
        <g transform="translate(-21 25)">
          <title>Códigos de torre registrados</title>
          <circle r={8.5} fill="#0F766E" />
          <path d="M-3.5 -3.5 H0.5 L4 0 L0.5 3.5 H-3.5 Z" fill="none" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
        </g>
      )}
      {hasNotes && (
        <g transform="translate(21 25)">
          <title>Tiene observaciones</title>
          <circle r={8.5} fill="#0369A1" />
          <path d="M-4 -3.5 H4 V1.5 H0.5 L-2 4 V1.5 H-4 Z" fill="#fff" />
        </g>
      )}
      {active && swColor && (
        <g transform="translate(22 -22)">
          <circle r={10} fill={swColor} />
          <path d="M-4.5 0.5 L-1.2 4 L5 -3.5" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
}

/** Ficha de gestión de un equipo (o del proyector): cajón lateral fijo a la
 *  derecha con códigos de la torre, checklist de software en 3 estados y
 *  bitácora de observaciones. Los comentarios se guardan al instante; lo demás,
 *  con «Guardar cambios». */
function SeatCard({
  room,
  seatNumber,
  data,
  allSeats,
  onClose,
}: {
  room: string;
  seatNumber: number;
  data: SeatData | undefined;
  allSeats: Record<number, SeatData>;
  onClose: () => void;
}) {
  const isProjector = seatNumber === PROJECTOR_SEAT;
  const [name, setName] = useState(data?.name ?? "");
  const [tag1, setTag1] = useState(data?.assetTag1 ?? "");
  const [tag2, setTag2] = useState(data?.assetTag2 ?? "");
  const [wallpaper, setWallpaper] = useState(data?.wallpaper ?? "");
  const [states, setStates] = useState<Record<string, SwState>>(() => {
    const m: Record<string, SwState> = {};
    for (const k of data?.software ?? []) m[k] = "installed";
    for (const k of data?.pending ?? []) if (!m[k]) m[k] = "pending";
    return m;
  });
  const [q, setQ] = useState("");
  const [note, setNote] = useState("");
  const [saving, startSave] = useTransition();
  const [noting, startNote] = useTransition();

  const norm = (t: string | undefined) => (t ?? "").trim().toLowerCase();
  /** Repetido en otro equipo, o igual al otro código de este mismo equipo. */
  const isDup = (tag: string, other: string) =>
    !!norm(tag) &&
    (norm(tag) === norm(other) ||
      Object.entries(allSeats).some(([n, d]) => Number(n) !== seatNumber && [norm(d.assetTag1), norm(d.assetTag2)].includes(norm(tag))));

  const term = q.trim().toLowerCase();
  const filtered = SOFTWARE.filter((x) => x.label.toLowerCase().includes(term) || x.key.includes(term));
  const installedCount = Object.values(states).filter((v) => v === "installed").length;
  const pendingCount = Object.values(states).filter((v) => v === "pending").length;

  function save() {
    startSave(async () => {
      await updateLabSeat(room, seatNumber, {
        name,
        software: isProjector ? [] : Object.keys(states).filter((k) => states[k] === "installed"),
        pending: isProjector ? [] : Object.keys(states).filter((k) => states[k] === "pending"),
        wallpaper,
        assetTag1: isProjector ? "" : tag1,
        assetTag2: isProjector ? "" : tag2,
        isProjector,
      });
      onClose();
    });
  }

  function addNote() {
    const text = note.trim();
    if (!text) return;
    startNote(async () => {
      await addLabSeatComment(room, seatNumber, text);
      setNote("");
    });
  }

  const input = "w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground";
  const tagField = (label: string, value: string, other: string, set: (v: string) => void, ph: string) => {
    const dup = isDup(value, other);
    return (
      <label className="flex flex-col gap-1 text-[10px] font-medium text-muted-foreground">
        {label}
        <input value={value} onChange={(e) => set(e.target.value)} placeholder={ph} className={cn(input, dup && "border-red-500")} />
        {dup ? (
          <span className="text-[10px] text-red-600">Código repetido en otro equipo (o igual al otro código).</span>
        ) : !value.trim() ? (
          <span className="text-[10px] text-amber-600">Sin registrar.</span>
        ) : null}
      </label>
    );
  };

  const seatPos = SEATS.find((x) => x.n === seatNumber);

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 flex w-[26rem] max-w-full flex-col gap-3 overflow-y-auto border-l border-border bg-card p-4 shadow-2xl"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold">{isProjector ? "Proyector" : `Equipo ${seatNumber}`}</h3>
          {seatPos && (
            <p className="text-[11px] text-muted-foreground">
              Bloque #{seatPos.block} · fila {seatPos.row}
            </p>
          )}
        </div>
        <button type="button" onClick={onClose} className="press rounded p-1 text-muted-foreground hover:bg-accent">
          <X className="h-4 w-4" />
        </button>
      </div>

      <label className="flex flex-col gap-1 text-[10px] font-medium text-muted-foreground">
        {isProjector ? "Nombre / etiqueta" : "Nombre del equipo"}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          placeholder={isProjector ? "ej. Proyector Sala 1" : `ej. UIFCE-${String(seatNumber).padStart(2, "0")}`}
          className={input}
        />
      </label>

      {!isProjector && (
        <section className="flex flex-col gap-2 rounded-md border border-border p-2.5">
          <span className="text-[11px] font-semibold">Códigos de la torre</span>
          {tagField("Código de Torre #1 (Inventario / Placa)", tag1, tag2, setTag1, "ej. INV-UIFCE-2024-042")}
          {tagField("Código de Torre #2 (Serie / CPU)", tag2, tag1, setTag2, "ej. SN-CPU-8932A")}
        </section>
      )}

      {!isProjector && (
        <section className="flex flex-col gap-2 rounded-md border border-border p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold">Software</span>
            <span className="text-[10px] text-muted-foreground">
              {installedCount} instalado · {pendingCount} pendiente
            </span>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar programa…" className={cn(input, "pl-7")} />
          </div>
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
            {CATEGORIES.map((cat) => {
              const items = filtered.filter((x) => x.category === cat);
              if (!items.length) return null;
              return (
                <div key={cat} className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{cat}</span>
                  {items.map((sw) => {
                    const st = states[sw.key] ?? "none";
                    const btn = (v: SwState, label: string, on: string) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setStates((m) => ({ ...m, [sw.key]: v }))}
                        aria-pressed={st === v}
                        className={cn(
                          "press rounded border px-1.5 py-0.5 text-[10px] font-medium",
                          st === v ? on : "border-input text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {label}
                      </button>
                    );
                    return (
                      <div key={sw.key} className="flex items-center justify-between gap-2">
                        <span className="text-[11px]">{sw.label}</span>
                        <div className="flex gap-1">
                          {btn("installed", "Instalado", "border-green-600 bg-green-600 text-white")}
                          {btn("pending", "Pendiente", "border-amber-500 bg-amber-500 text-white")}
                          {btn("none", "No", "border-muted-foreground/60 bg-muted text-foreground")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {!filtered.length && <span className="text-[11px] text-muted-foreground">Ningún programa coincide.</span>}
          </div>
        </section>
      )}

      <label className="flex flex-col gap-1 text-[10px] font-medium text-muted-foreground">
        {isProjector ? "Contenido proyectado / promocional actual" : "Fondo de pantalla / protector actual"}
        <textarea
          value={wallpaper}
          onChange={(e) => setWallpaper(e.target.value)}
          rows={2}
          placeholder={isProjector ? "ej. Slide con QR al Linktree entre clases" : "ej. QR al Linktree de la UIFCE"}
          className={cn(input, "resize-none")}
        />
      </label>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="press flex-1 rounded bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="press rounded border border-input px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
        >
          Cancelar
        </button>
      </div>

      <section className="flex flex-col gap-2 rounded-md border border-border p-2.5">
        <span className="text-[11px] font-semibold">Observaciones y Comentarios</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="ej. Falla en puerto USB frontal · Pantalla parpadea · Pendiente actualización de Windows"
          className={cn(input, "resize-none")}
        />
        <button
          type="button"
          onClick={addNote}
          disabled={noting || !note.trim()}
          className="press self-start rounded border border-input px-2.5 py-1 text-[11px] font-medium hover:bg-accent disabled:opacity-50"
        >
          {noting ? "Agregando…" : "Agregar Comentario"}
        </button>
        <ul className="flex flex-col gap-1.5">
          {(data?.comments ?? []).map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-2 rounded border border-border bg-muted/30 p-2">
              <div className="min-w-0">
                <p className="whitespace-pre-wrap break-words text-xs">{c.content}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {c.author ? `${c.author} · ` : ""}
                  {new Date(c.createdAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <button
                type="button"
                title="Borrar comentario"
                onClick={() => {
                  if (confirm("¿Borrar este comentario?")) startNote(() => deleteLabSeatComment(c.id));
                }}
                className="press shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {!(data?.comments ?? []).length && <li className="text-[11px] text-muted-foreground">Sin comentarios todavía.</li>}
        </ul>
      </section>
    </aside>
  );
}

/** Banda de color que rodea una fila (como los óvalos del plano). */
function rowPath(pts: Pt[]) {
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
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

  const pendingSeats = active
    ? Object.entries(seatData)
        .filter(([n, d]) => Number(n) !== PROJECTOR_SEAT && (d.pending ?? []).includes(active.key))
        .map(([n]) => Number(n))
    : [];

  const projector = seatData[PROJECTOR_SEAT];
  const projectorSelected = selectedSeat === PROJECTOR_SEAT;

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
          ? `${active.label}: ${activeSeats.length} instalado${activeSeats.length === 1 ? "" : "s"} y ${pendingSeats.length} pendiente${pendingSeats.length === 1 ? "" : "s"} de ${SEAT_COUNT} equipos (anillo punteado = pendiente).`
          : canEdit
            ? "Elige un programa para ver en qué equipos tiene licencia, o click en un equipo (o en el proyector) para gestionarlo."
            : "Elige un programa para ver en qué equipos tiene licencia."}
      </p>

      <div className="relative rounded-lg border border-dashed border-input bg-muted/20 p-2 sm:p-4">
        {selectedSeat !== null && (
          <>
            <SeatCard
              key={selectedSeat}
              room={room}
              seatNumber={selectedSeat}
              data={seatData[selectedSeat]}
              allSeats={seatData}
              onClose={() => setSelectedSeat(null)}
            />
          </>
        )}

        <div className="overflow-x-auto">
          <svg
            viewBox="40 180 1230 500"
            className="min-w-[760px] w-full rounded-md bg-background text-foreground"
            role="img"
            aria-label="Plano de la Sala 1 con 40 equipos en dos bloques"
          >
            {/* Perímetro: muro derecho en diagonal (ventanas) y nicho de la entrada */}
            <path
              d="M95 187 H1058 L1240 412 L1142 658 L1136 672 H180 V560 H95 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth={4}
              strokeLinejoin="round"
            />
            <path
              d="M105 197 H1054 L1228 412 L1134 648 H190 V560 H105 Z"
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.5}
              strokeWidth={2}
              strokeLinejoin="round"
            />

            {/* Ventanas: doble línea sobre el muro diagonal */}
            <g stroke="currentColor" strokeWidth={3} strokeLinecap="round">
              <line x1={1086} y1={229} x2={1243} y2={418} />
              <line x1={1098} y1={226} x2={1252} y2={410} />
              <line x1={1210} y1={462} x2={1150} y2={624} />
              <line x1={1222} y1={466} x2={1162} y2={628} />
            </g>
            <text x={1142} y={278} fontSize={28} fontWeight={500} fill="currentColor">
              VENTANA
            </text>

            {/* Entrada: puerta con arco de apertura hacia adentro */}
            <path d="M190 560 A80 80 0 0 1 270 640" fill="none" stroke="currentColor" strokeWidth={2.5} />
            <line x1={190} y1={560} x2={190} y2={642} stroke="currentColor" strokeWidth={3} />
            <text x={62} y={608} fontSize={26} fontWeight={500} fill="currentColor">
              ENTRADA
            </text>

            {/* Divisor central entre bloques */}
            <line x1={667} y1={200} x2={671} y2={606} stroke="currentColor" strokeWidth={3} />
            <text x={378} y={585} fontSize={24} fontStyle="italic" fill="currentColor" textAnchor="middle" opacity={0.75}>
              Bloque #1
            </text>
            <text x={830} y={585} fontSize={24} fontStyle="italic" fill="currentColor" textAnchor="middle" opacity={0.75}>
              Bloque #2
            </text>

            {/* Bandas de color por fila */}
            {LAYOUT.map((l) => (
              <path
                key={`${l.block}-${l.row}`}
                d={rowPath(l.pts)}
                fill="none"
                stroke={l.color}
                strokeOpacity={0.18}
                strokeWidth={70}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {/* Mesa del profesor (fila 1 del bloque #2): mueble, no es un puesto */}
            <g transform={`translate(${DESK[0]} ${DESK[1]})`}>
              <title>Mesa del profesor (Bloque #2, fila 1)</title>
              <rect x={-36} y={-33} width={72} height={66} rx={14} fill={RED} fillOpacity={0.18} />
              <rect x={-24} y={-22} width={48} height={44} rx={4} fill="hsl(var(--background))" stroke={RED} strokeWidth={2.5} />
              <text y={-6} textAnchor="middle" fontSize={11} fontWeight={600} fill="currentColor" opacity={0.7}>
                Mesa
              </text>
              <text y={9} textAnchor="middle" fontSize={11} fontWeight={600} fill="currentColor" opacity={0.7}>
                prof.
              </text>
            </g>

            {SEATS.map((s) => {
              const d = seatData[s.n];
              const isActive = !!active && activeSeats.includes(s.n);
              const isPending = !!active && !isActive && pendingSeats.includes(s.n);
              return (
                <Seat
                  key={s.n}
                  seat={s}
                  name={d?.name}
                  selected={selectedSeat === s.n}
                  active={isActive}
                  pending={isPending}
                  dimmed={!!active && !isActive && !isPending}
                  swColor={active?.color}
                  hasTag={!!(d?.assetTag1 || d?.assetTag2)}
                  hasNotes={(d?.comments?.length ?? 0) > 0}
                  canEdit={canEdit}
                  onSelect={setSelectedSeat}
                />
              );
            })}

            {/* Pared de presentación: PROYECTOR (puesto 0, gestionable) · BOARD */}
            <g
              className={cn("group", canEdit ? "cursor-pointer" : "cursor-default")}
              onClick={canEdit ? () => setSelectedSeat(PROJECTOR_SEAT) : undefined}
              role={canEdit ? "button" : undefined}
            >
              <title>{canEdit ? "Gestionar el proyector" : "Proyector"}</title>
              <rect
                x={318}
                y={620}
                width={309}
                height={42}
                fill={projectorSelected ? "hsl(var(--primary) / 0.12)" : "hsl(var(--background))"}
                stroke="currentColor"
                strokeWidth={projectorSelected ? 4 : 2.5}
                className={canEdit ? "group-hover:[stroke-width:4px]" : undefined}
              />
              <text x={472} y={642} textAnchor="middle" dominantBaseline="central" fontSize={25} fontWeight={500} fill="currentColor">
                {projector?.name ? `PROYECTOR · ${projector.name}` : "PROYECTOR"}
              </text>
            </g>
            <rect x={627} y={620} width={82} height={42} fill="hsl(var(--background))" stroke="currentColor" strokeWidth={2.5} />
            <rect x={709} y={620} width={356} height={42} fill="hsl(var(--background))" stroke="currentColor" strokeWidth={2.5} />
            <text x={887} y={642} textAnchor="middle" dominantBaseline="central" fontSize={25} fontWeight={500} fill="currentColor">
              BOARD
            </text>
          </svg>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {[
            { c: RED, l: "Fila 1 (cerca del proyector)" },
            { c: PINK, l: "Fila 2" },
            { c: BLUE, l: "Fila 3" },
            { c: GREEN, l: "Fila 4 (la más lejana)" },
          ].map((k) => (
            <span key={k.l} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: k.c }} />
              {k.l}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Plano real de la sala (40 equipos, no simétrica — el salón tampoco lo es). Bloque #1, a la izquierda: rejilla
        recta de 5 · 6 · 6 · 6 equipos (18-40). Bloque #2, a la derecha: la mesa independiente del profesor (no es un
        puesto) y filas curvas de 4 · 6 · 7 equipos (1-17) que siguen la ventana. Cada equipo y el proyector son
        vitrina publicitaria de la unidad: su ficha trackea licencias de software y qué fondo de pantalla o contenido
        muestran (ideal: el QR al Linktree de la UIFCE).
      </p>
    </div>
  );
}
