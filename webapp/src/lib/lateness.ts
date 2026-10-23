import { DEFAULT_FIRST_WEEK_START } from "@/lib/hours";

/** Tiempo tarde acumulado del equipo (/horas → «Puntualidad»): el máster registra cuántos minutos llegó tarde cada persona un día y la
 *  app acumula el total por persona y del equipo desde el inicio del semestre. Vive aparte de la acción (`lib/actions/lateness.ts`)
 *  porque un archivo "use server" solo exporta funciones async. */

/** Desde cuándo se acumula (inicio del semestre; las fechas «solo día» van a medianoche UTC). */
export const LATE_SINCE = DEFAULT_FIRST_WEEK_START;
export const lateSinceDate = () => new Date(`${LATE_SINCE}T00:00:00Z`);

export const LATE_MAX_MINUTES = 480;
export const LATE_NOTE_MAX = 120;

export type LateData = {
  id: string;
  userId: string;
  /** «AAAA-MM-DD». */
  date: string;
  minutes: number;
  note: string | null;
};

/** «35 min», «1 h», «1 h 25 min». */
export function fmtMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}

/** Total y número de tardanzas de una lista de registros. */
export function lateTotals(entries: { minutes: number }[]): { minutes: number; count: number } {
  return { minutes: entries.reduce((n, e) => n + e.minutes, 0), count: entries.length };
}
