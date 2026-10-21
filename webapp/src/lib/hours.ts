/** Control de horas del equipo (/horas): cada persona (máster y monitores Junior) tiene una meta de horas por semana, repartida
 *  en categorías; el máster planea las horas de cada semana y registra las que se hicieron de verdad.
 *  Vive aparte de la acción (`lib/actions/hours.ts`) porque un archivo "use server" solo puede exportar funciones async. */

export const WEEKLY_HOURS_TARGET = 20;
/** De las 20 h semanales, estas son de Gestión del Conocimiento (GC). */
export const GC_WEEKLY_HOURS = 2;
/** Cada monitor Junior tiene además 4 h semanales de su proyecto de estudio (PE). */
export const PE_WEEKLY_HOURS = 4;
/** Y 4 h semanales de punto de información (PI) en la oficina. */
export const PI_WEEKLY_HOURS = 4;
/** Quien dicta un curso libre (mientras dura) dedica 4 h semanales a dictarlo; salen de las horas de proyectos. */
export const CL_COURSE_WEEKLY_HOURS = 4;

/** Quiénes registran horas: máster y monitores Junior del área ET. */
export const HOUR_ROLES = ["MASTER", "JUNIOR_ARTES", "JUNIOR_AUXILIAR"] as const;
export const HOUR_AREA = "ET";

export const HOUR_CATEGORIES = ["GESTION_CONOCIMIENTO", "PROYECTO_ESTUDIO", "PUNTO_INFORMACION", "PROYECTO", "APOYO_ACADEMICO", "CURSOS_LIBRES"] as const;
export type HourCategory = (typeof HOUR_CATEGORIES)[number];

export const HOUR_CATEGORY_LABEL: Record<HourCategory, string> = {
  GESTION_CONOCIMIENTO: "Gestión del Conocimiento (GC)",
  PROYECTO_ESTUDIO: "Proyecto de estudio (PE)",
  PUNTO_INFORMACION: "Punto de información (PI)",
  PROYECTO: "Proyectos",
  APOYO_ACADEMICO: "Apoyos académicos",
  CURSOS_LIBRES: "Cursos Libres (dictar)",
};

/** Etiqueta corta, para las fichas de la tarjeta de cada persona. */
export const HOUR_CATEGORY_SHORT: Record<HourCategory, string> = {
  GESTION_CONOCIMIENTO: "GC",
  PROYECTO_ESTUDIO: "PE",
  PUNTO_INFORMACION: "PI",
  PROYECTO: "Proyectos",
  APOYO_ACADEMICO: "Apoyos",
  CURSOS_LIBRES: "Cursos Libres",
};

export const HOUR_CATEGORY_PLACEHOLDER: Record<HourCategory, string> = {
  GESTION_CONOCIMIENTO: "Ej. Documentar el proceso de piezas gráficas",
  PROYECTO_ESTUDIO: "Ej. Avance del proyecto de estudio",
  PUNTO_INFORMACION: "Ej. Atención en el punto de información",
  PROYECTO: "Ej. Piezas del lanzamiento especial (o elige el proyecto abajo)",
  APOYO_ACADEMICO: "Ej. Apoyo a la asignatura de Estadística",
  CURSOS_LIBRES: "Ej. Dictar Excel Básico, grupo 2",
};

export const HOUR_STATUSES = ["POR_HACER", "EN_PROGRESO", "TERMINADA"] as const;
export type HourStatus = (typeof HOUR_STATUSES)[number];
export const HOUR_STATUS_LABEL: Record<HourStatus, string> = {
  POR_HACER: "Por hacer",
  EN_PROGRESO: "En progreso",
  TERMINADA: "Terminada",
};

/** Semana 1 de 2026-2 (lunes), para proponer las fechas cuando todavía no hay semanas creadas. */
export const DEFAULT_FIRST_WEEK_START = "2026-08-24";

export const isHourCategory = (v: string): v is HourCategory => (HOUR_CATEGORIES as readonly string[]).includes(v);
export const isHourStatus = (v: string): v is HourStatus => (HOUR_STATUSES as readonly string[]).includes(v);

/** Horas escritas a mano: acepta «1,5» o «1.5»; entre 0 y 60, en pasos de un cuarto de hora. */
export function parseHours(raw: string): number | null {
  const n = Number(raw.trim().replace(",", "."));
  if (!raw.trim() || !Number.isFinite(n) || n < 0 || n > 60) return null;
  return Math.round(n * 4) / 4;
}

/** «2», «1,5», «0,25» (coma decimal, sin ceros de sobra). */
export function fmtHours(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r).replace(".", ",");
}

export type HourEntryData = {
  id: string;
  weekId: string;
  userId: string;
  category: HourCategory;
  title: string | null;
  planned: number;
  done: number;
  status: HourStatus;
  project: { id: string; title: string } | null;
};

export type HourWeekData = {
  id: string;
  number: number;
  /** ISO; fechas «solo día» a medianoche UTC. */
  startDate: string;
  endDate: string;
};

export type HourTotals = {
  planned: number;
  done: number;
  byCategory: Record<HourCategory, { planned: number; done: number }>;
  counts: Record<HourStatus, number> & { total: number };
};

export function emptyTotals(): HourTotals {
  return {
    planned: 0,
    done: 0,
    byCategory: Object.fromEntries(HOUR_CATEGORIES.map((c) => [c, { planned: 0, done: 0 }])) as HourTotals["byCategory"],
    counts: { POR_HACER: 0, EN_PROGRESO: 0, TERMINADA: 0, total: 0 },
  };
}

/** Suma de horas y conteo por estado de un conjunto de registros. */
export function summarize(entries: Pick<HourEntryData, "category" | "planned" | "done" | "status">[]): HourTotals {
  const t = emptyTotals();
  for (const e of entries) {
    t.planned += e.planned;
    t.done += e.done;
    t.byCategory[e.category].planned += e.planned;
    t.byCategory[e.category].done += e.done;
    t.counts[e.status] += 1;
    t.counts.total += 1;
  }
  return t;
}

/** Cumplimiento: horas hechas sobre horas planeadas (0–100). Sin plan no hay qué cumplir: 0. */
export function compliance(totals: Pick<HourTotals, "planned" | "done">): number {
  return totals.planned > 0 ? Math.round((totals.done / totals.planned) * 100) : 0;
}

const DAY = 24 * 60 * 60 * 1000;

export function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY).toISOString();
}

const dayFmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });

/** «24 ago – 29 ago». */
export function weekRange(w: Pick<HourWeekData, "startDate" | "endDate">): string {
  const strip = (s: string) => s.replace(".", "");
  return `${strip(dayFmt.format(new Date(w.startDate)))} – ${strip(dayFmt.format(new Date(w.endDate)))}`;
}

export function weekLabel(w: HourWeekData): string {
  return `Semana ${w.number} (${weekRange(w)})`;
}

/** Mes de la semana (por su fecha de inicio): clave «2026-08» y nombre «agosto de 2026». */
export function weekMonth(w: Pick<HourWeekData, "startDate">): { key: string; label: string } {
  return { key: w.startDate.slice(0, 7), label: monthFmt.format(new Date(w.startDate)) };
}

/** Semana a mostrar al abrir: la que contiene hoy; si no hay, la última ya empezada; si ninguna, la primera. */
export function pickCurrentWeek(weeks: HourWeekData[], todayKey: string): HourWeekData | null {
  if (weeks.length === 0) return null;
  const inside = weeks.find((w) => w.startDate.slice(0, 10) <= todayKey && todayKey <= w.endDate.slice(0, 10));
  if (inside) return inside;
  const started = weeks.filter((w) => w.startDate.slice(0, 10) <= todayKey);
  return started.length > 0 ? started[started.length - 1] : weeks[0];
}

/** Horas semanales fijas por categoría según el rol: GC para todos; PE y PI solo para los monitores Junior. El resto no
 *  tiene meta propia: cuenta dentro de las ${WEEKLY_HOURS_TARGET} h. */
export function categoryTargets(role: string): Partial<Record<HourCategory, number>> {
  return role === "MASTER" ? { GESTION_CONOCIMIENTO: GC_WEEKLY_HOURS } : { GESTION_CONOCIMIENTO: GC_WEEKLY_HOURS, PROYECTO_ESTUDIO: PE_WEEKLY_HOURS, PUNTO_INFORMACION: PI_WEEKLY_HOURS };
}

/** Estado del contador semanal de una persona frente a la meta: lo que falta o sobra por asignar, y las categorías fijas
 *  (GC, PE, PI) que todavía no tienen sus horas planeadas. */
export function targetNote(planned: number, byCategory: HourTotals["byCategory"], role: string): { text: string; ok: boolean }[] {
  const out: { text: string; ok: boolean }[] = [];
  const diff = Math.round((WEEKLY_HOURS_TARGET - planned) * 100) / 100;
  if (diff > 0) out.push({ text: `Faltan ${fmtHours(diff)} h por asignar`, ok: false });
  else if (diff < 0) out.push({ text: `${fmtHours(-diff)} h por encima de la meta`, ok: false });
  else out.push({ text: "Meta semanal completa", ok: true });
  for (const [category, target] of Object.entries(categoryTargets(role)) as [HourCategory, number][]) {
    const missing = Math.round((target - byCategory[category].planned) * 100) / 100;
    if (missing > 0) out.push({ text: `${HOUR_CATEGORY_SHORT[category]}: faltan ${fmtHours(missing)} h`, ok: false });
  }
  return out;
}
