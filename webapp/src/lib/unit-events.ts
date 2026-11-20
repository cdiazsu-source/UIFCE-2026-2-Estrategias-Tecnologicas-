/** Microtalleres y eventos de la Unidad (`/eventos`, modelo `UnitEvent`): constantes y cálculos compartidos por el servidor y la pantalla. */

export const KINDS = ["MICROTALLER", "EVENTO"] as const;
export type EventKind = (typeof KINDS)[number];
export const KIND_LABEL: Record<EventKind, string> = { MICROTALLER: "Microtaller", EVENTO: "Evento" };
export const KIND_PLURAL: Record<EventKind, string> = { MICROTALLER: "microtalleres", EVENTO: "eventos" };

export const MODALITIES = ["PRESENCIAL", "VIRTUAL", "HIBRIDO"] as const;
export type Modality = (typeof MODALITIES)[number];
export const MODALITY_LABEL: Record<Modality, string> = { PRESENCIAL: "Presencial", VIRTUAL: "Virtual", HIBRIDO: "Híbrido" };

export const STATUSES = ["PLANEADO", "REALIZADO", "CANCELADO"] as const;
export type EventStatus = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<EventStatus, string> = { PLANEADO: "Planeado", REALIZADO: "Realizado", CANCELADO: "Cancelado" };

export function normalizeKind(v: string): EventKind {
  return (KINDS as readonly string[]).includes(v) ? (v as EventKind) : "MICROTALLER";
}
export function normalizeModality(v: string): Modality {
  return (MODALITIES as readonly string[]).includes(v) ? (v as Modality) : "PRESENCIAL";
}
export function normalizeStatus(v: string): EventStatus {
  return (STATUSES as readonly string[]).includes(v) ? (v as EventStatus) : "PLANEADO";
}

export type UnitEventData = {
  id: string;
  kind: EventKind;
  title: string;
  /** ISO. */
  date: string;
  modality: Modality;
  place: string | null;
  speaker: string | null;
  audience: string | null;
  status: EventStatus;
  registered: number | null;
  attended: number | null;
  link: string | null;
  projectId: string | null;
  notes: string | null;
};

/** Año calendario (hora de Colombia) de una fecha ISO. */
export function yearOf(iso: string): number {
  return Number(new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Bogota" }).slice(0, 4));
}

/** «AAAA-MM-DD» (hora de Colombia) para un campo de fecha. */
export function dayOf(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

export type Summary = {
  microtalleres: number;
  eventos: number;
  /** Realizados (los cancelados no cuentan en los totales). */
  done: number;
  registered: number;
  attended: number;
  /** Porcentaje de asistencia sobre los registros que tienen ambos números; null si no hay. */
  rate: number | null;
};

/** Totales de una lista de eventos. Los cancelados no suman; inscritos y asistentes cuentan solo los realizados. */
export function summarize(list: UnitEventData[]): Summary {
  const active = list.filter((e) => e.status !== "CANCELADO");
  const done = active.filter((e) => e.status === "REALIZADO");
  let registered = 0;
  let attended = 0;
  let baseReg = 0;
  let baseAtt = 0;
  for (const e of done) {
    registered += e.registered ?? 0;
    attended += e.attended ?? 0;
    if (e.registered && e.attended != null) {
      baseReg += e.registered;
      baseAtt += e.attended;
    }
  }
  return {
    microtalleres: active.filter((e) => e.kind === "MICROTALLER").length,
    eventos: active.filter((e) => e.kind === "EVENTO").length,
    done: done.length,
    registered,
    attended,
    rate: baseReg > 0 ? Math.round((baseAtt / baseReg) * 100) : null,
  };
}
