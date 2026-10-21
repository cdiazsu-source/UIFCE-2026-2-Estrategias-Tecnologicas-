import { HOUR_CATEGORIES, HOUR_CATEGORY_LABEL, HOUR_CATEGORY_SHORT } from "@/lib/hours";

/** Horario semanal de oficina (/horas → «Horario»): bloques por persona, o de todo el equipo, de lunes a sábado. Es una
 *  plantilla fija del semestre. Vive aparte de la acción porque un archivo "use server" solo exporta funciones async. */

/** Categorías de horas más «Oficina» (presencia en la oficina sin más detalle). */
export const SHIFT_CATEGORIES = [...HOUR_CATEGORIES, "OFICINA"] as const;
export type ShiftCategory = (typeof SHIFT_CATEGORIES)[number];

export const SHIFT_CATEGORY_SHORT: Record<ShiftCategory, string> = { ...HOUR_CATEGORY_SHORT, OFICINA: "Oficina" };
export const SHIFT_CATEGORY_LABEL: Record<ShiftCategory, string> = { ...HOUR_CATEGORY_LABEL, OFICINA: "Oficina (presencia)" };

export const isShiftCategory = (v: string): v is ShiftCategory => (SHIFT_CATEGORIES as readonly string[]).includes(v);

/** Edificios donde se puede estar: el 310 es el de la oficina (el predeterminado) y el 238 es el otro. */
export const OFFICE_BUILDINGS = ["310", "238"] as const;
export const DEFAULT_BUILDING = "310";
export const isBuilding = (v: string): boolean => (OFFICE_BUILDINGS as readonly string[]).includes(v);

export const SCHEDULE_DAYS = [
  { n: 1, short: "Lun", name: "Lunes" },
  { n: 2, short: "Mar", name: "Martes" },
  { n: 3, short: "Mié", name: "Miércoles" },
  { n: 4, short: "Jue", name: "Jueves" },
  { n: 5, short: "Vie", name: "Viernes" },
  { n: 6, short: "Sáb", name: "Sábado" },
] as const;

/** Rango visible por defecto de la grilla; se amplía si algún bloque queda fuera. */
export const SCHEDULE_START_HOUR = 7;
export const SCHEDULE_END_HOUR = 19;
/** Rango permitido al guardar un bloque (minutos desde la medianoche) y paso de las horas. */
export const SHIFT_MIN_MINUTES = 6 * 60;
export const SHIFT_MAX_MINUTES = 22 * 60;
export const SHIFT_STEP_MINUTES = 30;

export type ShiftData = {
  id: string;
  /** null = todo el equipo. */
  userId: string | null;
  day: number;
  start: number;
  end: number;
  category: ShiftCategory;
  label: string | null;
  /** «310» o «238». */
  location: string;
};

/** «14:00» desde minutos. */
export function fmtTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Opciones de hora (cada 30 min) para los selectores. */
export function timeOptions(): { value: number; label: string }[] {
  const out: { value: number; label: string }[] = [];
  for (let m = SHIFT_MIN_MINUTES; m <= SHIFT_MAX_MINUTES; m += SHIFT_STEP_MINUTES) out.push({ value: m, label: fmtTime(m) });
  return out;
}

/** Reparte los bloques de un día en carriles para que los que coinciden en el tiempo queden lado a lado. */
export function layoutDay<T extends { id: string; start: number; end: number }>(items: T[]): (T & { lane: number; lanes: number })[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id));
  const out: (T & { lane: number; lanes: number })[] = [];
  let cluster: (T & { lane: number; lanes: number })[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const close = () => {
    for (const c of cluster) c.lanes = laneEnds.length;
    out.push(...cluster);
    cluster = [];
    laneEnds = [];
  };
  for (const it of sorted) {
    if (cluster.length > 0 && it.start >= clusterEnd) close();
    let lane = laneEnds.findIndex((e) => e <= it.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = it.end;
    clusterEnd = Math.max(clusterEnd, it.end);
    cluster.push({ ...it, lane, lanes: 1 });
  }
  close();
  return out;
}

const WEEKDAY: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** Día (1 = lunes … 7 = domingo) y minutos desde la medianoche, ahora, en hora de Bogotá. */
export function bogotaNow(date: Date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return { day: WEEKDAY[get("weekday")] ?? 1, minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
}

/** Próximo bloque que empieza después de ahora (hoy o en los días siguientes), con cuántos días faltan. */
export function nextShift(shifts: ShiftData[], now: { day: number; minutes: number }): { shift: ShiftData; daysAhead: number } | null {
  for (let offset = 0; offset <= 7; offset++) {
    const day = ((now.day - 1 + offset) % 7) + 1;
    const candidates = shifts.filter((s) => s.day === day && (offset > 0 || s.start > now.minutes)).sort((a, b) => a.start - b.start);
    if (candidates.length > 0) return { shift: candidates[0], daysAhead: offset };
  }
  return null;
}

/** «45 min», «1 h 30 min». */
export function fmtRemaining(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Bloques que están en curso en ese momento. */
export function activeNow(shifts: ShiftData[], now: { day: number; minutes: number }): ShiftData[] {
  return shifts.filter((s) => s.day === now.day && s.start <= now.minutes && now.minutes < s.end);
}

