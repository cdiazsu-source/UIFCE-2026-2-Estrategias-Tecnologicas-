import { prisma } from "@/lib/prisma";
import {
  DELIVERED_PROJECT_IDS,
  PROJECT_IMAGES_MAX,
  SECTION_KEYS,
  SLIDE_KEYS,
  emptyDesigns,
  parseImages,
  type CoordData,
  type CoordProject,
  type SectionKey,
} from "@/lib/coordination";

/** Datos en vivo de «Reunión coordinación» (servidor). Tablas nuevas: si faltan (migración pendiente) esa parte queda vacía o con lo automático y el resto sale. */

const select = {
  id: true,
  title: true,
  category: true,
  status: true,
  assignee: { select: { name: true } },
  checklistItems: { select: { done: true } },
} as const;

/** Proyectos que entran solos a cada sección mientras el máster no la personalice:
 *  entregamos = la lista fija; curso = de esa lista, los que están en curso; corte = Atención Inmediata abiertos fuera de la lista. */
export async function defaultProjectIds(section: SectionKey): Promise<string[]> {
  if (section === "entregamos") {
    const found = await prisma.project.findMany({ where: { id: { in: DELIVERED_PROJECT_IDS } }, select: { id: true } });
    const ok = new Set(found.map((p) => p.id));
    return DELIVERED_PROJECT_IDS.filter((id) => ok.has(id));
  }
  if (section === "curso") {
    const rows = await prisma.project.findMany({ where: { id: { in: DELIVERED_PROJECT_IDS }, status: "EN_CURSO" }, select: { id: true } });
    const ok = new Set(rows.map((p) => p.id));
    return DELIVERED_PROJECT_IDS.filter((id) => ok.has(id));
  }
  const rows = await prisma.project.findMany({
    where: { priorityTag: "ATENCION_INMEDIATA", status: { not: "COMPLETADO" }, id: { notIn: DELIVERED_PROJECT_IDS } },
    orderBy: { sourceOrder: "asc" },
    select: { id: true },
  });
  return rows.map((p) => p.id);
}

/** Los proyectos de una sección: los que eligió el máster si la personalizó, o los automáticos. */
async function sectionIds(section: SectionKey, customized: boolean): Promise<string[]> {
  if (customized) {
    try {
      const rows = await prisma.coordinationItem.findMany({ where: { section }, orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { projectId: true } });
      return rows.map((r) => r.projectId);
    } catch {
      return defaultProjectIds(section);
    }
  }
  return defaultProjectIds(section);
}

/** Imágenes mini de cada proyecto: las de las plantillas que tiene enlazadas (captura y piezas), en el orden del enlace.
 *  Se devuelven como direcciones de /api/plantillas-imagen (no se mueven datos pesados). */
async function imagesByProject(projectIds: string[]): Promise<Map<string, { templateIds: string[]; images: string[] }>> {
  const out = new Map<string, { templateIds: string[]; images: string[] }>();
  if (projectIds.length === 0) return out;
  try {
    const links = await prisma.projectTemplateLink.findMany({ where: { projectId: { in: projectIds } }, orderBy: [{ projectId: "asc" }, { order: "asc" }], select: { projectId: true, templateId: true } });
    if (links.length === 0) return out;
    const tids = Array.from(new Set(links.map((l) => l.templateId)));
    const [withShot, pieces] = await Promise.all([
      prisma.template.findMany({ where: { id: { in: tids }, NOT: [{ screenshot: null }, { screenshot: "" }] }, select: { id: true } }),
      prisma.templatePiece.findMany({ where: { templateId: { in: tids } }, orderBy: [{ templateId: "asc" }, { order: "asc" }], select: { id: true, templateId: true } }).catch(() => []),
    ]);
    const shot = new Set(withShot.map((t) => t.id));
    const piecesBy = new Map<string, string[]>();
    for (const p of pieces) piecesBy.set(p.templateId, [...(piecesBy.get(p.templateId) ?? []), p.id]);
    for (const l of links) {
      const cur = out.get(l.projectId) ?? { templateIds: [], images: [] };
      cur.templateIds.push(l.templateId);
      if (shot.has(l.templateId)) cur.images.push(`/api/plantillas-imagen/${l.templateId}`);
      for (const pid of piecesBy.get(l.templateId) ?? []) cur.images.push(`/api/plantillas-imagen/${l.templateId}?pieza=${pid}`);
      cur.images = cur.images.slice(0, PROJECT_IMAGES_MAX);
      out.set(l.projectId, cur);
    }
  } catch {
    // Sin la tabla de enlaces (migración pendiente) los proyectos salen sin imágenes.
  }
  return out;
}

export async function loadCoordination(): Promise<CoordData> {
  // Qué secciones personalizó el máster (tabla nueva: sin ella, todas automáticas).
  const customized: Record<SectionKey, boolean> = { entregamos: false, curso: false, corte: false };
  try {
    for (const r of await prisma.coordinationSection.findMany({ select: { section: true } })) {
      if ((SECTION_KEYS as readonly string[]).includes(r.section)) customized[r.section as SectionKey] = true;
    }
  } catch {
    // todas automáticas
  }

  const ids: Record<SectionKey, string[]> = {
    entregamos: await sectionIds("entregamos", customized.entregamos),
    curso: await sectionIds("curso", customized.curso),
    corte: await sectionIds("corte", customized.corte),
  };
  const all = Array.from(new Set([...ids.entregamos, ...ids.curso, ...ids.corte]));
  const [rows, imgs] = await Promise.all([prisma.project.findMany({ where: { id: { in: all } }, select }), imagesByProject(all)]);
  const byId = new Map(rows.map((p) => [p.id, p]));

  const pick = (list: string[]): CoordProject[] => {
    const out: CoordProject[] = [];
    for (const id of list) {
      const p = byId.get(id);
      if (!p) continue;
      const im = imgs.get(id);
      out.push({
        id: p.id,
        title: p.title,
        category: p.category,
        status: p.status,
        done: p.checklistItems.filter((c) => c.done).length,
        total: p.checklistItems.length,
        assignee: p.assignee?.name ?? null,
        images: im?.images ?? [],
        templateIds: im?.templateIds ?? [],
      });
    }
    return out;
  };

  let blockers: CoordData["blockers"] = null;
  try {
    blockers = await prisma.coordinationBlocker.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true, text: true } });
  } catch {
    blockers = null;
  }

  const design = emptyDesigns();
  try {
    const pages = await prisma.coordinationPage.findMany();
    for (const r of pages) {
      const key = SLIDE_KEYS.find((k) => k === r.key);
      if (key) design[key] = { title: r.title ?? "", note: r.note ?? "", images: parseImages(r.images) };
    }
  } catch {
    // Sin la tabla de diseño, las páginas salen con sus textos por defecto.
  }

  return { delivered: pick(ids.entregamos), inProgress: pick(ids.curso), upcoming: pick(ids.corte), blockers, design, customized };
}
