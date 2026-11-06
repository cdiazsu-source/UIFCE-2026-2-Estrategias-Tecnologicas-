import { prisma } from "@/lib/prisma";
import { JUNIOR_PROFILES } from "@/lib/view-profiles";
import { greetingName } from "@/lib/utils";
import { moduleLabel } from "@/lib/activity";
import type { Movement, MovementPerson, Movements } from "@/lib/movements-types";

/** Últimos movimientos de los monitores Junior para el máster: entradas, clics y guardados (huella digital), notas de bitácora,
 *  comentarios de proyectos de estudio y subtareas asignadas que cambiaron. Todo se arma en el servidor y cada fuente va en su
 *  try/catch: si falta una tabla, las demás siguen. */

const PER_SOURCE = 150;
const TOTAL = 300;
const excerpt = (s: string, n = 140) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

async function safe<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

export async function loadMovements(): Promise<Movements> {
  const keys = Object.keys(JUNIOR_PROFILES);
  const users = await prisma.user.findMany({
    where: { credentialKey: { in: keys }, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, credentialKey: true },
  });
  const ids = users.map((u) => u.id);
  const idByKey = new Map(users.map((u) => [u.credentialKey as string, u.id]));
  const items: Movement[] = [];
  let trackingReady = true;

  // Huella digital: entradas, clics y guardados.
  let events: { id: string; userId: string | null; profileKey: string; kind: string; path: string; module: string | null; projectId: string | null; label: string | null; createdAt: Date }[] = [];
  try {
    events = await prisma.activityEvent.findMany({ where: { profileKey: { in: keys } }, orderBy: { createdAt: "desc" }, take: PER_SOURCE * 2 });
  } catch {
    trackingReady = false;
  }

  const [notes, comments, tasks] = await Promise.all([
    safe(() => prisma.projectNote.findMany({ where: { authorId: { in: ids } }, orderBy: { createdAt: "desc" }, take: PER_SOURCE, select: { id: true, authorId: true, body: true, projectId: true, createdAt: true } })),
    safe(() => prisma.studyProjectComment.findMany({ where: { authorId: { in: ids } }, orderBy: { createdAt: "desc" }, take: PER_SOURCE, select: { id: true, authorId: true, body: true, createdAt: true } })),
    safe(() => prisma.checklistItem.findMany({ where: { assigneeId: { in: ids } }, orderBy: { updatedAt: "desc" }, take: PER_SOURCE, select: { id: true, assigneeId: true, text: true, done: true, projectId: true, createdAt: true, updatedAt: true } })),
  ]);

  const projectIds = new Set<string>();
  for (const e of events) if (e.projectId) projectIds.add(e.projectId);
  for (const n of notes) projectIds.add(n.projectId);
  for (const t of tasks) projectIds.add(t.projectId);
  const projects = await safe(() => prisma.project.findMany({ where: { id: { in: [...projectIds] } }, select: { id: true, title: true } }));
  const title = new Map(projects.map((p) => [p.id, p.title]));

  for (const e of events) {
    const userId = e.userId ?? idByKey.get(e.profileKey);
    if (!userId) continue;
    const proj = e.projectId ? (title.get(e.projectId) ?? "Proyecto") : null;
    const screen = moduleLabel(e.module);
    const where = proj ?? screen;
    const href = e.path.startsWith("/") ? e.path : null;
    const at = e.createdAt.toISOString();
    if (e.kind === "MODULE") items.push({ id: e.id, at, userId, type: "ENTRADA", text: `Entró a «${screen}»`, detail: null, where: null, href });
    else if (e.kind === "PROJECT") items.push({ id: e.id, at, userId, type: "PROYECTO", text: `Abrió el proyecto «${proj ?? "—"}»`, detail: null, where: null, href });
    else if (e.kind === "CLICK") items.push({ id: e.id, at, userId, type: "CLIC", text: `Tocó «${e.label ?? "—"}»`, detail: null, where, href });
    else if (e.kind === "CHANGE") items.push({ id: e.id, at, userId, type: "CAMBIO", text: e.label ? `Guardó un cambio («${e.label}»)` : "Guardó un cambio", detail: null, where, href });
  }
  for (const n of notes) {
    if (!n.authorId) continue;
    items.push({ id: `n-${n.id}`, at: n.createdAt.toISOString(), userId: n.authorId, type: "NOTA", text: "Escribió una nota en la bitácora", detail: excerpt(n.body), where: title.get(n.projectId) ?? null, href: `/proyectos/${n.projectId}` });
  }
  for (const c of comments) {
    if (!c.authorId) continue;
    items.push({ id: `c-${c.id}`, at: c.createdAt.toISOString(), userId: c.authorId, type: "COMENTARIO", text: "Comentó en su proyecto de estudio", detail: excerpt(c.body), where: null, href: "/proyectos-de-estudio" });
  }
  for (const t of tasks) {
    if (!t.assigneeId) continue;
    // Una subtarea recién creada no es un movimiento: solo cuentan las que cambiaron después de crearse.
    if (t.updatedAt.getTime() - t.createdAt.getTime() < 60_000) continue;
    items.push({ id: `t-${t.id}`, at: t.updatedAt.toISOString(), userId: t.assigneeId, type: "SUBTAREA", text: t.done ? "Subtarea suya marcada como hecha" : "Subtarea suya actualizada", detail: excerpt(t.text, 120), where: title.get(t.projectId) ?? null, href: `/proyectos/${t.projectId}` });
  }

  items.sort((a, b) => b.at.localeCompare(a.at));
  const people: MovementPerson[] = users.map((u) => ({ id: u.id, name: greetingName(u.name), color: u.color }));
  return { people, items: items.slice(0, TOTAL), trackingReady };
}
