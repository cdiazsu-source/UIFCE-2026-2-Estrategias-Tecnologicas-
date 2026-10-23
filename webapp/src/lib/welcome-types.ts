import type { ShiftData } from "@/lib/office-schedule";

/** Lo que la capa de bienvenida recibe del servidor (JSON serializable). Vive aparte de `lib/welcome.ts` para que el
 *  componente de cliente pueda importar los tipos sin traer Prisma. */

/** Un hecho importante de un proyecto desde la última visita: una nota de otra persona, una nota que la etiqueta o una subtarea terminada. */
export type WelcomeHighlight = {
  kind: "NOTA" | "ETIQUETA" | "HECHA";
  /** Texto de la nota (recortado) o de la subtarea. */
  text: string;
  /** Quién escribió la nota; null en una subtarea terminada. */
  who: string | null;
  at: string;
};

/** Un proyecto abierto en el que la persona participa (es responsable, tiene subtareas o la etiquetaron). */
export type WelcomeProject = {
  id: string;
  title: string;
  /** «Responsable», «Con subtareas tuyas» o «Te etiquetaron». */
  role: string;
  urgent: boolean;
  statusLabel: string;
  done: number;
  total: number;
  /** Subtareas suyas sin terminar y cuántas de ellas están vencidas. */
  myPending: number;
  myOverdue: number;
  /** Lo importante desde su último ingreso (máx. 4, lo más nuevo primero). */
  highlights: WelcomeHighlight[];
};

/** Capa de una persona identificada (Junior, dirección o coordinación). */
export type MemberWelcome = {
  kind: "member";
  firstName: string;
  /** Visita anterior (ISO), o null si no hay registro. */
  lastVisit: string | null;
  /** Sus proyectos abiertos (los 5 con más novedades o más urgentes) y cuántos son en total. */
  projects: WelcomeProject[];
  projectsTotal: number;
  /** Totales para el resumen: novedades desde su último ingreso y subtareas suyas pendientes (y vencidas). */
  updatesTotal: number;
  pendingTotal: number;
  overdueTotal: number;
  /** Sus bloques del horario y los de todo el equipo; vacío si no tiene horario propio. */
  shifts: ShiftData[];
  /** true = su actividad en la app queda registrada (monitores Junior): se le avisa en la capa. */
  tracked: boolean;
  /** Tiempo tarde acumulado de la persona desde el inicio del semestre (minutos y número de tardanzas); null si no se pudo leer. */
  late: { minutes: number; count: number } | null;
  /** Solo en la vista previa de «Ver como»: el perfil cuya capa se está mostrando (no es la del usuario real). */
  preview?: { label: string };
};

export type FootprintRange = "7" | "30" | "semestre";
export type FootprintStatus = "ACTIVO" | "POCA" | "SIN";

export type FootprintJunior = {
  id: string;
  name: string;
  firstName: string;
  color: string | null;
  lastSeen: string | null;
  /** Nivel de actividad (0 a 4) de cada uno de los últimos 7 días, del más antiguo al de hoy. */
  strip: { key: string; level: number }[];
  activeDays: number;
  rangeDays: number;
  clicks: number;
  projects: number;
  changes: number;
  status: FootprintStatus;
};

export type FootprintProject = {
  id: string;
  title: string;
  assignee: string | null;
  visits: number;
  clicks: number;
  changes: number;
  /** Última huella (ISO) en cualquier momento de los últimos 90 días, o null si no hay. */
  last: string | null;
};

export type Footprint = {
  range: FootprintRange;
  juniors: FootprintJunior[];
  projects: FootprintProject[];
  modules: { label: string; count: number }[];
  retentionDays: number;
};

/** Capa del máster: la huella digital de los monitores. */
export type MasterWelcome = {
  kind: "master";
  firstName: string;
  footprint: Footprint;
};

export type WelcomePayload = MemberWelcome | MasterWelcome;
