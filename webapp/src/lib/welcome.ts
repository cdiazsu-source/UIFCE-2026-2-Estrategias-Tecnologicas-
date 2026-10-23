import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getTrackedWho, loadFootprint } from "@/lib/activity";
import { isShiftCategory, type ShiftData } from "@/lib/office-schedule";
import { greetingName } from "@/lib/utils";
import { isJuniorWho, viewProfile } from "@/lib/view-profiles";
import type { FootprintRange, MemberWelcome, NewsReason, WelcomeNews, WelcomePayload } from "@/lib/welcome-types";

/** Datos de la capa de bienvenida de esta sesión: la huella digital de los monitores para el máster; para cualquier otra persona
 *  identificada, su visita anterior, las novedades que la involucran y su horario. null = no hay capa que mostrar. */

const DAY_MS = 24 * 60 * 60 * 1000;
/** Sin visita anterior registrada, se miran los últimos 7 días; nunca más de 30. */
const DEFAULT_NEWS_DAYS = 7;
const MAX_NEWS_DAYS = 30;
const NEWS_SHOWN = 3;

/** Novedades de bitácora que involucran a la persona desde `since`: la etiquetaron en la nota, la nota es sobre una subtarea suya
 *  o es de un proyecto del que es responsable. Solo de otras personas y de proyectos abiertos. */
async function loadNews(userId: string, name: string, since: Date): Promise<{ items: WelcomeNews[]; total: number }> {
  const rows = await prisma.projectNote.findMany({
    where: {
      createdAt: { gte: since },
      project: { status: { not: "COMPLETADO" } },
      AND: [
        { OR: [{ authorId: null }, { authorId: { not: userId } }] },
        { OR: [{ mentionIds: { has: userId } }, { checklistItem: { assigneeId: userId } }, { project: { assigneeId: userId } }] },
      ],
      author: { not: name },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      body: true,
      author: true,
      createdAt: true,
      mentionIds: true,
      project: { select: { id: true, title: true } },
      checklistItem: { select: { assigneeId: true } },
    },
  });
  const items = rows.map((n): WelcomeNews => {
    const reason: NewsReason = n.mentionIds.includes(userId) ? "TAG" : n.checklistItem?.assigneeId === userId ? "SUBTASK" : "PROJECT";
    const body = n.body.replace(/\s+/g, " ").trim();
    return {
      id: n.id,
      projectId: n.project.id,
      projectTitle: n.project.title,
      reason,
      author: n.author,
      at: n.createdAt.toISOString(),
      excerpt: body.length > 120 ? `${body.slice(0, 119)}…` : body,
    };
  });
  return { items: items.slice(0, NEWS_SHOWN), total: items.length };
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
    const [news, shiftRows, tracked] = await Promise.all([
      loadNews(user.id, user.name, since),
      prisma.officeShift.findMany({ where: { OR: [{ userId: user.id }, { userId: null }] }, orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }] }),
      // En la vista previa se muestra el aviso que vería ese perfil si es un Junior (aquí no se registra nada).
      preview ? Promise.resolve(isJuniorWho(key) ? key : null) : getTrackedWho(),
    ]);
    const shifts: ShiftData[] = shiftRows
      .filter((s) => isShiftCategory(s.category))
      .map((s) => ({ id: s.id, userId: s.userId, day: s.dayOfWeek, start: s.startMinutes, end: s.endMinutes, category: s.category as ShiftData["category"], label: s.label, location: s.location }));
    // Sin bloques propios no hay semana que mostrar (los del equipo solos no dicen dónde está esta persona).
    const own = shifts.some((s) => s.userId === user.id);

    return {
      kind: "member",
      firstName: greetingName(user.name),
      lastVisit: previousVisitAt ? previousVisitAt.toISOString() : null,
      news: news.items,
      newsTotal: news.total,
      shifts: own ? shifts : [],
      tracked: tracked !== null,
      ...(preview ? { preview: { label: viewProfile(key)?.label ?? user.name } } : {}),
    };
  } catch {
    // La capa es un extra: si la BD no responde (o falta la migración), la app sigue sin ella.
    return null;
  }
}
