import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getTrackedWho, loadFootprint } from "@/lib/activity";
import { isShiftCategory, type ShiftData } from "@/lib/office-schedule";
import { PROJECT_STATUS_LABEL, greetingName } from "@/lib/utils";
import { lateSinceDate } from "@/lib/lateness";
import { isJuniorWho, viewProfile } from "@/lib/view-profiles";
import type { FootprintRange, WelcomeHighlight, WelcomePayload, WelcomeProject } from "@/lib/welcome-types";

/** Datos de la capa de bienvenida de esta sesión: la huella digital de los monitores para el máster; para cualquier otra persona
 *  identificada, su visita anterior, sus proyectos con lo importante que pasó y su horario. null = no hay capa que mostrar. */

const DAY_MS = 24 * 60 * 60 * 1000;
/** Sin visita anterior registrada, se miran los últimos 7 días; nunca más de 30. */
const DEFAULT_NEWS_DAYS = 7;
const MAX_NEWS_DAYS = 30;
const PROJECTS_SHOWN = 5;

/** Proyectos abiertos en los que participa la persona (responsable, subtareas a su nombre o etiquetada en una nota desde `since`), con
 *  lo importante desde su último ingreso: notas de otras personas (y las que la etiquetan) y subtareas terminadas. */
async function loadProjects(userId: string, name: string, since: Date): Promise<{ items: WelcomeProject[]; total: number; updates: number; pending: number; overdue: number }> {
  const rows = await prisma.project.findMany({
    where: {
      status: { not: "COMPLETADO" },
      OR: [{ assigneeId: userId }, { checklistItems: { some: { assigneeId: userId } } }, { notes: { some: { createdAt: { gte: since }, mentionIds: { has: userId } } } }],
    },
    select: {
      id: true,
      title: true,
      status: true,
      priorityTag: true,
      assigneeId: true,
      checklistItems: { select: { text: true, done: true, assigneeId: true, updatedAt: true, dueDate: true } },
      notes: {
        where: { createdAt: { gte: since }, author: { not: name }, OR: [{ authorId: null }, { authorId: { not: userId } }] },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { body: true, author: true, createdAt: true, mentionIds: true },
      },
    },
  });
  const now = Date.now();
  const clip = (t: string, n: number) => {
    const s = t.replace(/\s+/g, " ").trim();
    return s.length > n ? `${s.slice(0, n - 1)}…` : s;
  };
  const items = rows.map((p): WelcomeProject => {
    const mine = p.checklistItems.filter((i) => i.assigneeId === userId && !i.done);
    const highlights: WelcomeHighlight[] = [
      ...p.notes.map((n): WelcomeHighlight => ({ kind: n.mentionIds.includes(userId) ? "ETIQUETA" : "NOTA", text: clip(n.body, 110), who: n.author, at: n.createdAt.toISOString() })),
      ...p.checklistItems
        .filter((i) => i.done && i.updatedAt >= since)
        .slice(0, 3)
        .map((i): WelcomeHighlight => ({ kind: "HECHA", text: clip(i.text, 90), who: null, at: i.updatedAt.toISOString() })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 4);
    return {
      id: p.id,
      title: p.title,
      role: p.assigneeId === userId ? "Responsable" : p.checklistItems.some((i) => i.assigneeId === userId) ? "Con subtareas tuyas" : "Te etiquetaron",
      urgent: p.priorityTag === "ATENCION_INMEDIATA",
      statusLabel: PROJECT_STATUS_LABEL[p.status] ?? p.status,
      done: p.checklistItems.filter((i) => i.done).length,
      total: p.checklistItems.length,
      myPending: mine.length,
      myOverdue: mine.filter((i) => i.dueDate && i.dueDate.getTime() < now).length,
      highlights,
    };
  });
  items.sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.highlights.length - a.highlights.length || a.title.localeCompare(b.title, "es"));
  return {
    items: items.slice(0, PROJECTS_SHOWN),
    total: items.length,
    updates: items.reduce((n, p) => n + p.highlights.length, 0),
    pending: items.reduce((n, p) => n + p.myPending, 0),
    overdue: items.reduce((n, p) => n + p.myOverdue, 0),
  };
}

/** `preview`: la vista previa de «Ver como»: la capa tal como la vería el perfil que se está viendo (solo con «Ver como» activo). */
export async function loadWelcome(range: FootprintRange = "7", preview = false): Promise<WelcomePayload | null> {
  const session = await getSession();
  if (!session.authed) return null;
  if (preview && (!session.viewing || !session.viewWho)) return null;

  try {
    // Máster (credencial compartida): la huella digital de los monitores.
    if (!preview && session.isMaster) {
      const master = await prisma.user.findFirst({ where: { role: "MASTER", area: "ET", active: true }, orderBy: { name: "asc" }, select: { name: true } });
      return { kind: "master", firstName: master ? greetingName(master.name) : "", footprint: await loadFootprint(range) };
    }

    // Persona identificada por su credencial propia (Junior, dirección o coordinación).
    const key = preview ? session.viewWho : session.who;
    if (!key) return null;
    const user = await prisma.user.findFirst({ where: { credentialKey: key }, select: { id: true, name: true } });
    if (!user) return null;
    const previousVisitAt = (await prisma.userVisit.findUnique({ where: { userId: user.id }, select: { previousVisitAt: true } }))?.previousVisitAt ?? null;

    const floor = new Date(Date.now() - MAX_NEWS_DAYS * DAY_MS);
    const since = previousVisitAt && previousVisitAt > floor ? previousVisitAt : new Date(Date.now() - DEFAULT_NEWS_DAYS * DAY_MS);
    const [projects, shiftRows, tracked] = await Promise.all([
      loadProjects(user.id, user.name, since),
      prisma.officeShift.findMany({ where: { OR: [{ userId: user.id }, { userId: null }] }, orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }] }),
      // En la vista previa se muestra el aviso que vería ese perfil si es un Junior (aquí no se registra nada).
      preview ? Promise.resolve(isJuniorWho(key) ? key : null) : getTrackedWho(),
    ]);
    const shifts: ShiftData[] = shiftRows
      .filter((s) => isShiftCategory(s.category))
      .map((s) => ({ id: s.id, userId: s.userId, day: s.dayOfWeek, start: s.startMinutes, end: s.endMinutes, category: s.category as ShiftData["category"], label: s.label, location: s.location }));
    // Tiempo tarde acumulado: tabla nueva, en su propio try para que la capa salga aunque falte la migración.
    let late: { minutes: number; count: number } | null = null;
    try {
      const agg = await prisma.lateEntry.aggregate({ where: { userId: user.id, date: { gte: lateSinceDate() } }, _sum: { minutes: true }, _count: true });
      late = { minutes: agg._sum.minutes ?? 0, count: agg._count };
    } catch {
      late = null;
    }
    // Sin bloques propios no hay semana que mostrar (los del equipo solos no dicen dónde está esta persona).
    const own = shifts.some((s) => s.userId === user.id);

    return {
      kind: "member",
      firstName: greetingName(user.name),
      lastVisit: previousVisitAt ? previousVisitAt.toISOString() : null,
      projects: projects.items,
      projectsTotal: projects.total,
      updatesTotal: projects.updates,
      pendingTotal: projects.pending,
      overdueTotal: projects.overdue,
      shifts: own ? shifts : [],
      tracked: tracked !== null,
      late,
      ...(preview ? { preview: { label: viewProfile(key)?.label ?? user.name } } : {}),
    };
  } catch {
    // La capa es un extra: si la BD no responde (o falta la migración), la app sigue sin ella.
    return null;
  }
}
