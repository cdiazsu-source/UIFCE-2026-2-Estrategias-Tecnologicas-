/** Comités de Gestión: tipos y límites compartidos entre la página, el formulario y las acciones. */

export const COMMITTEE_KINDS = ["COORDINACION", "DIRECCION"] as const;
export type CommitteeKind = (typeof COMMITTEE_KINDS)[number];

export const COMMITTEE_KIND_LABEL: Record<CommitteeKind, string> = { COORDINACION: "Coordinación", DIRECCION: "Dirección" };

export const COMMITTEE_NAME_MAX = 120;

/** Comité cuya reunión se presenta con la herramienta de coordinación (`/reunion`): «Reunión de dirección 2» (la inserta la migración). */
export const PRESENTATION_COMMITTEE_ID = "comite_direccion_2";

export type CommitteeRow = { id: string; name: string; startsAt: string; kind: CommitteeKind };

export function isCommitteeKind(v: string): v is CommitteeKind {
  return (COMMITTEE_KINDS as readonly string[]).includes(v);
}

/** Fecha y hora de Colombia (UTC-5, sin horario de verano) a partir del valor de un `datetime-local` («AAAA-MM-DDTHH:mm»). */
export function parseBogotaLocal(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00-05:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
