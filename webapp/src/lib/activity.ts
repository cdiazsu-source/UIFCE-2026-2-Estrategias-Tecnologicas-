import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { DEFAULT_FIRST_WEEK_START } from "@/lib/hours";
import { SIDEBAR_ITEMS, isItemActive } from "@/lib/sidebar-nav";
import { JUNIOR_PROFILES, isJuniorWho } from "@/lib/view-profiles";
import { bogotaDateKey, greetingName } from "@/lib/utils";
import type { Footprint, FootprintJunior, FootprintProject, FootprintRange, FootprintStatus } from "@/lib/welcome-types";

/** Huella digital de los monitores Junior: qué módulos y proyectos abren, a qué botones dan clic y cuántas acciones de
 *  guardado ejecutan. Solo se registra a un Junior con su credencial propia (ni al máster ni «Ver como») y nunca lo que
 *  escribe, solo el nombre del botón. Lo que pasa de 90 días se borra. */

export const ACTIVITY_KINDS = ["MODULE", "PROJECT", "CLICK", "CHANGE"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_RETENTION_DAYS = 90;
export const ACTIVITY_MAX_BATCH = 40;
export const ACTIVITY_LABEL_MAX = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Clave del Junior cuya actividad se registra en esta sesión, o null si no se registra (máster, dirección, coordinación o
 *  «Ver como»: así el máster mirando como un Junior no le suma clics a nombre de él). */
export async function getTrackedWho(): Promise<string | null> {
  const s = await getSession();
  if (!s.authed || s.viewing || s.realLevel !== "junior") return null;
  return isJuniorWho(s.who) ? s.who : null;
}

/** Pantalla a la que pertenece una ruta: la opción del menú lateral, o «proyecto» para el detalle de un proyecto. */
export function moduleOfPath(path: string): string {
  if (/^\/proyectos\/[^/]+/.test(path)) return "proyecto";
  if (path === "/") return "panel";
  return SIDEBAR_ITEMS.find((i) => i.href !== "/" && isItemActive(i, path))?.id ?? (path.split("/")[1] || "otro");
}

export function projectIdOfPath(path: string): string | null {
  const m = path.match(/^\/proyectos\/([^/?#]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

const MODULE_LABEL: Record<string, string> = {
  ...Object.fromEntries(SIDEBAR_ITEMS.map((i) => [i.id, i.label])),
  proyecto: "Detalle de proyecto",
};
const moduleLabel = (m: string | null) => (m ? (MODULE_LABEL[m] ?? m) : "—");

export type CleanEvent = { kind: ActivityKind; path: string; label: string | null };

/** Valida el cuerpo que manda el navegador: tipos conocidos, rutas internas, etiquetas cortas y a lo sumo 40 por lote. */
export function parseEvents(body: unknown): CleanEvent[] {
  const raw = body && typeof body === "object" && Array.isArray((body as { events?: unknown }).events) ? (body as { events: unknown[] }).events : [];
  const out: CleanEvent[] = [];
  for (const e of raw.slice(0, ACTIVITY_MAX_BATCH)) {
    if (!e || typeof e !== "object") continue;
    const { k, p, l } = e as { k?: unknown; p?: unknown; l?: unknown };
    if (typeof k !== "string" || !(ACTIVITY_KINDS as readonly string[]).includes(k)) continue;
    if (typeof p !== "string" || !p.startsWith("/") || p.startsWith("//")) continue;
    const path = p.split(/[?#]/)[0].slice(0, 200);
    const label = typeof l === "string" ? l.replace(/\s+/g, " ").trim().slice(0, ACTIVITY_LABEL_MAX) || null : null;
    out.push({ kind: k as ActivityKind, path, label: k === "CLICK" || k === "CHANGE" ? label : null });
  }
  return out;
}

/** Guarda un lote de eventos de un Junior. Ocasionalmente borra lo que pasó de 90 días. */
export async function recordEvents(who: string, events: CleanEvent[]): Promise<void> {
  if (events.length === 0) return;
  const user = await prisma.user.findFirst({ where: { credentialKey: who }, select: { id: true } });
  await prisma.activityEvent.createMany({
    data: events.map((e) => ({
      userId: user?.id ?? null,
      profileKey: who,
      kind: e.kind,
      path: e.path,
      module: moduleOfPath(e.path),
      projectId: projectIdOfPath(e.path),
      label: e.label,
    })),
  });
  if (Math.random() < 0.02) {
    await prisma.activityEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - ACTIVITY_RETENTION_DAYS * DAY_MS) } } });
  }
}

/** Nivel de 0 a 4 según cuántos eventos tuvo la persona ese día. */
const level = (n: number) => (n === 0 ? 0 : n <= 5 ? 1 : n <= 20 ? 2 : n <= 50 ? 3 : 4);

/** Resumen de la huella de los monitores Junior para el máster, en el rango pedido (7 días, 30 días o el semestre, que no pasa de
 *  los 90 días que se conservan). Todo se calcula en el servidor. */
export async function loadFootprint(range: FootprintRange): Promise<Footprint> {
  const now = new Date();
  const retentionStart = new Date(now.getTime() - ACTIVITY_RETENTION_DAYS * DAY_MS);
  let since: Date;
  if (range === "7") since = new Date(now.getTime() - 7 * DAY_MS);
  else if (range === "30") since = new Date(now.getTime() - 30 * DAY_MS);
  else {
    const semesterStart = new Date(`${DEFAULT_FIRST_WEEK_START}T00:00:00-05:00`);
    since = semesterStart > retentionStart ? semesterStart : retentionStart;
  }
  const rangeDays = Math.max(1, Math.round((now.getTime() - since.getTime()) / DAY_MS));
  const stripFrom = new Date(now.getTime() - 7 * DAY_MS);
  const queryFrom = since < stripFrom ? since : stripFrom;
  const stripKeys = Array.from({ length: 7 }, (_, i) => bogotaDateKey(new Date(now.getTime() - (6 - i) * DAY_MS)));

  const keys = Object.keys(JUNIOR_PROFILES);
  const [users, events] = await Promise.all([
    prisma.user.findMany({
      where: { credentialKey: { in: keys }, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true, credentialKey: true, lastSeenAt: true },
    }),
    prisma.activityEvent.findMany({
      where: { profileKey: { in: keys }, createdAt: { gte: queryFrom } },
      select: { profileKey: true, kind: true, projectId: true, module: true, createdAt: true },
    }),
  ]);

  const inRange = events.filter((e) => e.createdAt >= since);

  const juniors: FootprintJunior[] = users.map((u) => {
    const mine = inRange.filter((e) => e.profileKey === u.credentialKey);
    const days = new Set(mine.map((e) => bogotaDateKey(e.createdAt)));
    const perDay = new Map<string, number>();
    for (const e of events) {
      if (e.profileKey !== u.credentialKey) continue;
      const k = bogotaDateKey(e.createdAt);
      perDay.set(k, (perDay.get(k) ?? 0) + 1);
    }
    const ratio = days.size / rangeDays;
    const status: FootprintStatus = days.size === 0 ? "SIN" : ratio >= 0.4 ? "ACTIVO" : "POCA";
    return {
      id: u.id,
      name: u.name,
      firstName: greetingName(u.name),
      color: u.color,
      lastSeen: u.lastSeenAt ? u.lastSeenAt.toISOString() : null,
      strip: stripKeys.map((key) => ({ key, level: level(perDay.get(key) ?? 0) })),
      activeDays: days.size,
      rangeDays,
      clicks: mine.filter((e) => e.kind === "CLICK").length,
      projects: new Set(mine.map((e) => e.projectId).filter((x): x is string => !!x)).size,
      changes: mine.filter((e) => e.kind === "CHANGE").length,
      status,
    };
  });

  // Proyectos: los abiertos asignados a un Junior y los que tuvieron huella en el rango.
  const touched = new Set(inRange.map((e) => e.projectId).filter((x): x is string => !!x));
  const projectRows = await prisma.project.findMany({
    where: { OR: [{ assigneeId: { in: users.map((u) => u.id) }, status: { not: "COMPLETADO" } }, { id: { in: [...touched] } }] },
    select: { id: true, title: true, assignee: { select: { name: true } } },
  });
  const lastEver = await prisma.activityEvent.groupBy({
    by: ["projectId"],
    where: { projectId: { in: projectRows.map((p) => p.id) } },
    _max: { createdAt: true },
  });
  const lastById = new Map(lastEver.map((l) => [l.projectId, l._max.createdAt]));

  const projects: FootprintProject[] = projectRows
    .map((p) => {
      const mine = inRange.filter((e) => e.projectId === p.id);
      return {
        id: p.id,
        title: p.title,
        assignee: p.assignee ? greetingName(p.assignee.name) : null,
        visits: mine.filter((e) => e.kind === "PROJECT").length,
        clicks: mine.filter((e) => e.kind === "CLICK").length,
        changes: mine.filter((e) => e.kind === "CHANGE").length,
        last: lastById.get(p.id)?.toISOString() ?? null,
      };
    })
    .sort((a, b) => {
      const score = (x: FootprintProject) => x.visits + x.clicks + x.changes;
      // Con huella primero (de más a menos); sin huella al final, los más antiguos primero.
      if (score(a) > 0 !== score(b) > 0) return score(a) > 0 ? -1 : 1;
      if (score(a) > 0) return score(b) - score(a);
      return (a.last ?? "").localeCompare(b.last ?? "");
    })
    .slice(0, 40);

  const counts = new Map<string, number>();
  for (const e of inRange) if (e.kind === "MODULE" || e.kind === "PROJECT") counts.set(e.module ?? "", (counts.get(e.module ?? "") ?? 0) + 1);
  const modules = [...counts.entries()]
    .map(([m, count]) => ({ label: moduleLabel(m), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { range, juniors, projects, modules, retentionDays: ACTIVITY_RETENTION_DAYS };
}
