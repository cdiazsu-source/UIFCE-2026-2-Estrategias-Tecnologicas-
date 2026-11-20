import { prisma } from "@/lib/prisma";
import { ALLIED_SUPPORTS, type AlliedSupport } from "@/lib/academic-allies-data";
import {
  normalizeAsk,
  normalizeStatus,
  type AllyInfo,
  type AllySupportRow,
  type AlliesData,
  type EventInfo,
  type FollowUpInfo,
} from "@/lib/convocation";
import type { ProgramKey } from "@/lib/mallas-data";

const PROGRAM_KEYS = ["economia", "administracion", "contaduria"] as const;

/** Datos de «Aliados académicos» para la pantalla: de la BD si las tablas existen y tienen profesores; si la migración aún no se
 *  aplicó (o el script de carga no se ha corrido), cae a los datos estáticos del repositorio y sin seguimiento. */
export async function loadAcademicAllies(): Promise<AlliesData> {
  const fallback: AlliesData = {
    db: false,
    supports: ALLIED_SUPPORTS.map((a) => ({ ...a, allyId: a.p })),
  };
  try {
    const allies = await prisma.academicAlly.findMany({
      orderBy: { name: "asc" },
      include: { supports: true, notes: { orderBy: { createdAt: "desc" } } },
    });
    if (allies.length === 0) return fallback;

    const [events, followUps] = await Promise.all([
      prisma.convocationEvent.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
      prisma.convocationFollowUp.findMany(),
    ]);

    const supports: AllySupportRow[] = allies.flatMap((al) =>
      al.supports.map((s) => ({
        allyId: al.id,
        p: al.name,
        c: s.course,
        pg: (s.program as AlliedSupport["pg"]) ?? "otro",
        m: s.mallaCourse,
        s: (s.sessions ?? {}) as AlliedSupport["s"],
        w: s.software,
        e: (s.states ?? {}) as AlliedSupport["e"],
      })),
    );
    const allyInfo: AllyInfo[] = allies.map((al) => ({
      id: al.id,
      name: al.name,
      email: al.email,
      notes: al.notes.map((n) => ({ id: n.id, body: n.body, author: n.author, at: n.createdAt.toISOString() })),
    }));
    const eventInfo: EventInfo[] = events.map((e) => ({
      id: e.id,
      name: e.name,
      programs: e.programs.filter((p): p is ProgramKey => (PROGRAM_KEYS as readonly string[]).includes(p)),
      semFrom: e.semFrom,
      semTo: e.semTo,
      topics: e.topics,
      eventDate: e.eventDate ? e.eventDate.toISOString() : null,
      notes: e.notes,
      projectId: e.projectId,
    }));
    const followInfo: FollowUpInfo[] = followUps.map((f) => ({
      eventId: f.eventId,
      allyId: f.allyId,
      status: normalizeStatus(f.status),
      ask: normalizeAsk(f.ask ?? ""),
      note: f.note,
      contactedAt: f.contactedAt ? f.contactedAt.toISOString() : null,
      updatedBy: f.updatedBy,
    }));
    return { db: true, supports, allies: allyInfo, events: eventInfo, followUps: followInfo };
  } catch {
    return fallback;
  }
}
