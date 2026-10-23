import type { ShiftData } from "@/lib/office-schedule";

/** Lo que la capa de bienvenida recibe del servidor (JSON serializable). Vive aparte de `lib/welcome.ts` para que el
 *  componente de cliente pueda importar los tipos sin traer Prisma. */

/** Por qué una novedad involucra a la persona: la etiquetaron, es una nota sobre una subtarea suya o es de un proyecto suyo. */
export type NewsReason = "TAG" | "SUBTASK" | "PROJECT";

export type WelcomeNews = {
  id: string;
  projectId: string;
  projectTitle: string;
  reason: NewsReason;
  author: string;
  at: string;
  excerpt: string;
};

/** Capa de una persona identificada (Junior, dirección o coordinación). */
export type MemberWelcome = {
  kind: "member";
  firstName: string;
  /** Visita anterior (ISO), o null si no hay registro. */
  lastVisit: string | null;
  /** Hasta 3 novedades que la involucran, y cuántas hay en total. */
  news: WelcomeNews[];
  newsTotal: number;
  /** Sus bloques del horario y los de todo el equipo; vacío si no tiene horario propio. */
  shifts: ShiftData[];
  /** true = su actividad en la app queda registrada (monitores Junior): se le avisa en la capa. */
  tracked: boolean;
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
