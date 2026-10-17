/** Solicitante de un proyecto: el área o la instancia, fuera de ET, que pidió el servicio
 *  o la iniciativa. Se guarda el código en Project.requesterArea. Los códigos de área
 *  coinciden con User.area (AA, GC, DS, VA, CL). Las iniciativas propias de ET no tienen
 *  solicitante externo, por eso ET no figura en la lista. */
export const REQUESTER_OPTIONS = [
  { value: "AA", label: "AA — Apoyos Académicos" },
  { value: "GC", label: "GC — Gestión del Conocimiento" },
  { value: "DS", label: "DS — Desarrollo" },
  { value: "VA", label: "VA — Virtualización" },
  { value: "CL", label: "CL — Cursos Libres" },
  { value: "COORDINACION", label: "Coordinación" },
  { value: "DIRECCION", label: "Dirección" },
] as const;

export type RequesterValue = (typeof REQUESTER_OPTIONS)[number]["value"];

export function isRequesterValue(v: string): v is RequesterValue {
  return REQUESTER_OPTIONS.some((o) => o.value === v);
}

/** Etiqueta legible del solicitante, o null si no hay (o el código no se reconoce). */
export function requesterLabel(value: string | null | undefined): string | null {
  return REQUESTER_OPTIONS.find((o) => o.value === value)?.label ?? null;
}
