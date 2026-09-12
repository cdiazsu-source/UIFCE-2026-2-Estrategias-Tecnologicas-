import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Toda la app se muestra en hora de Bogotá (America/Bogota, UTC-5, sin horario
// de verano), sin importar la zona horaria del servidor donde corra (Vercel usa
// UTC). Las fechas "solo día" (vencimientos, última verificación) se dejan en UTC
// a propósito: se guardan a medianoche UTC y convertirlas a Bogotá las correría
// un día hacia atrás.
export const APP_TIME_ZONE = "America/Bogota";

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(d);
}

/** Convierte el valor de un <input type="datetime-local"> ("2026-09-15T09:00",
 *  sin zona) a un Date real, asumiendo que esa hora es de Colombia (UTC-5
 *  fijo, sin horario de verano). Vacío -> null. */
export function fromBogotaInput(local: string): Date | null {
  const v = local.trim();
  if (!v) return null;
  const d = new Date(`${v}:00-05:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Inverso: da la cadena que espera <input type="datetime-local"> mostrando la
 *  hora de Colombia (no la del navegador de quien edita). */
export function toBogotaInputValue(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** "Martes 15 de septiembre", en hora de Colombia. Para agrupar /horario por día. */
export function formatDayHeader(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: APP_TIME_ZONE,
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "9:00 – 11:00 a. m." (o solo la hora de inicio si no hay fin), en hora de
 *  Colombia. */
export function formatTimeRange(start: Date | string, end?: Date | string | null) {
  const fmt = (d: Date | string) =>
    new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", timeZone: APP_TIME_ZONE }).format(
      typeof d === "string" ? new Date(d) : d,
    );
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

/** Clave "YYYY-MM-DD" en hora de Colombia, para comparar/agrupar por día. */
export function bogotaDateKey(date: Date | string) {
  return toBogotaInputValue(date).slice(0, 10);
}

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  POR_INICIAR: "Por iniciar",
  EN_CURSO: "En curso",
  COMPLETADO: "Completado",
};

/** Etiquetas de urgencia del proyecto: fase temporal, independiente del estado.
 *  Se guarda el código (`priorityTag`); el emoji y el color mate van en el
 *  render (ver components/priority-tag.tsx). Doble codificación: emoji + color. */
export const PRIORITY_TAGS = ["ATENCION_INMEDIATA", "PROXIMO_CICLO", "BACKLOG"] as const;
export type PriorityTag = (typeof PRIORITY_TAGS)[number];

export const PRIORITY_TAG_LABEL: Record<string, string> = {
  ATENCION_INMEDIATA: "❗ Atención Inmediata",
  PROXIMO_CICLO: "📅 Próximo Ciclo",
  BACKLOG: "⏸️ Backlog",
};

/** Color mate por etiqueta (rojo teja / amarillo ocre / gris pizarra). */
export const PRIORITY_TAG_COLOR: Record<string, string> = {
  ATENCION_INMEDIATA: "#b23a2a",
  PROXIMO_CICLO: "#c49a00",
  BACKLOG: "#708090",
};

/** Tope de proyectos activos en «❗ Atención Inmediata» por persona (límite WIP). */
export const WIP_ATENCION_INMEDIATA = 3;

export const TOOL_STATUS_LABEL: Record<string, string> = {
  ACTIVA: "Activa",
  VENCIDA: "Vencida",
  SIN_LICENCIA: "Sin licencia",
  GRATUITA: "Gratuita",
};

export const USER_ROLE_LABEL: Record<string, string> = {
  MASTER: "Máster",
  JUNIOR_ARTES: "Junior — Artes",
  JUNIOR_AUXILIAR: "Junior — ET",
  COORDINADOR: "Coordinación",
  DIRECTOR: "Dirección",
  EQUIPO: "Equipo",
  LIDER: "Líder",
};

export const CHECKPOINT_STATUS_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_CURSO: "En curso",
  CUMPLIDO: "Cumplido",
  ATRASADO: "Atrasado",
};

/** Roles que corresponden a un monitor Junior (tienen proyectos de estudio). */
export const JUNIOR_ROLES = ["JUNIOR_ARTES", "JUNIOR_AUXILIAR"] as const;

/** Quién puede dejar o responder una actualización de proyecto de estudio (PE):
 *  los dos Junior, Coordinación y Máster. Un módulo "use server" solo puede
 *  exportar funciones async, así que esta lista vive aquí (la usan la acción
 *  en lib/actions/study-comments.ts y la consulta de la página principal). */
export const STUDY_COMMENT_ROLES = ["MASTER", "JUNIOR_ARTES", "JUNIOR_AUXILIAR", "COORDINADOR"] as const;
