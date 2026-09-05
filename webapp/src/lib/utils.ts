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
