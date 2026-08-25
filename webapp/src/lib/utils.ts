import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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
  }).format(d);
}

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  POR_INICIAR: "Por iniciar",
  EN_CURSO: "En curso",
  COMPLETADO: "Completado",
};

export const TOOL_STATUS_LABEL: Record<string, string> = {
  ACTIVA: "Activa",
  VENCIDA: "Vencida",
  SIN_LICENCIA: "Sin licencia",
  GRATUITA: "Gratuita",
};
