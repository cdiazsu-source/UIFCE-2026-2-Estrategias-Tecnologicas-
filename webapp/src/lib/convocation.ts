import type { AlliedSupport } from "@/lib/academic-allies-data";
import { PROGRAMS, type ProgramKey } from "@/lib/mallas-data";

/** Convocatoria con aliados académicos: qué profesor conviene contactar para cada evento y qué pedirle. Código puro (sin base de
 *  datos) para usarlo igual en el servidor y en el navegador. Los datos de apoyos vienen de `academic-allies-data.ts` o de la BD. */

export const FOLLOW_STATUSES = ["POR_CONTACTAR", "CONTACTADO", "ACEPTO", "SIN_RESPUESTA", "NO_DISPONIBLE"] as const;
export type FollowStatus = (typeof FOLLOW_STATUSES)[number];

export const FOLLOW_STATUS_LABEL: Record<FollowStatus, string> = {
  POR_CONTACTAR: "Por contactar",
  CONTACTADO: "Contactado",
  ACEPTO: "Aceptó",
  SIN_RESPUESTA: "Sin respuesta",
  NO_DISPONIBLE: "No disponible",
};

export const ASKS = ["ANUNCIO", "REENVIO", "SESION"] as const;
export type Ask = (typeof ASKS)[number];

export const ASK_LABEL: Record<Ask, string> = {
  ANUNCIO: "Anunciarlo en clase",
  REENVIO: "Reenviar la invitación",
  SESION: "Una sesión en su clase",
};

export function normalizeStatus(v: string): FollowStatus {
  return (FOLLOW_STATUSES as readonly string[]).includes(v) ? (v as FollowStatus) : "POR_CONTACTAR";
}

export function normalizeAsk(v: string): Ask | null {
  return (ASKS as readonly string[]).includes(v) ? (v as Ask) : null;
}

/** Apoyo de un profesor con el id de su ficha (en la BD) o su nombre (cuando se leen los datos estáticos). */
export type AllySupportRow = AlliedSupport & { allyId: string };

export type AllyInfo = {
  id: string;
  name: string;
  email: string | null;
  notes: { id: string; body: string; author: string; at: string }[];
};

export type EventInfo = {
  id: string;
  name: string;
  programs: ProgramKey[];
  semFrom: number;
  semTo: number;
  topics: string[];
  eventDate: string | null;
  notes: string | null;
  projectId: string | null;
};

export type FollowUpInfo = {
  eventId: string;
  allyId: string;
  status: FollowStatus;
  ask: Ask | null;
  note: string | null;
  contactedAt: string | null;
  updatedBy: string | null;
};

export type AlliesData =
  | { db: true; supports: AllySupportRow[]; allies: AllyInfo[]; events: EventInfo[]; followUps: FollowUpInfo[] }
  | { db: false; supports: AllySupportRow[] };

export function norm(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/** Semestre de la malla (1 a 10) de la asignatura de un apoyo; 0 si no aparece en la malla. */
export function mallaSemester(pg: AlliedSupport["pg"], mallaCourse: string | null): number {
  if (!mallaCourse || pg === "otro") return 0;
  const i = PROGRAMS[pg].sems.findIndex((s) => s.some((c) => c[0] === mallaCourse));
  return i + 1;
}

export type Candidate = {
  allyId: string;
  name: string;
  score: number;
  courses: { course: string; semester: number; software: string[]; active: boolean }[];
  reason: string;
  ask: Ask;
};

/** Profesores que conviene contactar para un evento, de más a menos prioritario.
 *  Cuentan los apoyos de los programas del evento cuya asignatura cae en el rango de semestres; los apoyos sin asignatura en la malla
 *  (áreas, escuelas, semilleros) entran con menos peso. Pesa más quien tiene apoyo en 2026-2, después en 2026-1; suma el mismo tema
 *  (el software o la asignatura contienen alguno de los temas del evento) y la constancia (semestres con apoyo). */
export function rankCandidates(
  ev: Pick<EventInfo, "programs" | "semFrom" | "semTo" | "topics">,
  supports: AllySupportRow[],
): Candidate[] {
  const topics = ev.topics.map(norm).filter(Boolean);
  const byAlly = new Map<string, Candidate & { topicHit: boolean; active26: boolean; active261: boolean }>();

  for (const a of supports) {
    if (a.pg === "otro" || !ev.programs.includes(a.pg)) continue;
    const sem = mallaSemester(a.pg, a.m);
    if (sem > 0 && (sem < ev.semFrom || sem > ev.semTo)) continue;

    const active26 = !!a.s["26-2"];
    const active261 = !!a.s["26-1"];
    const hit = topics.length > 0 && topics.some((t) => [...a.w, a.c].some((f) => norm(f).includes(t)));
    const semesters = Object.keys(a.s).length;
    const score = (active26 ? 4 : active261 ? 2 : 1) + (hit ? 2 : 0) + semesters * 0.5 - (sem === 0 ? 2 : 0);

    const cur = byAlly.get(a.allyId) ?? {
      allyId: a.allyId,
      name: a.p,
      score: 0,
      courses: [],
      reason: "",
      ask: "REENVIO" as Ask,
      topicHit: false,
      active26: false,
      active261: false,
    };
    cur.score = Math.max(cur.score, score) + (cur.courses.length > 0 ? 0.1 : 0);
    cur.courses.push({ course: a.c, semester: sem, software: a.w, active: active26 });
    cur.topicHit ||= hit;
    cur.active26 ||= active26;
    cur.active261 ||= active261;
    byAlly.set(a.allyId, cur);
  }

  return [...byAlly.values()]
    .map((c) => {
      const ask: Ask = c.topicHit && c.active26 ? "SESION" : c.active26 || c.active261 ? "ANUNCIO" : "REENVIO";
      const parts = [
        c.active26 ? "Apoyo en 2026-2" : c.active261 ? "Apoyo en 2026-1" : "Apoyo en 2025-2",
        ...(c.topicHit ? ["mismo tema del evento"] : []),
      ];
      return { allyId: c.allyId, name: c.name, score: c.score, courses: c.courses, reason: parts.join(" · "), ask };
    })
    .sort((x, y) => y.score - x.score || x.name.localeCompare(y.name));
}
