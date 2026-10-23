import { prisma } from "@/lib/prisma";
import { DELIVERED_PROJECT_IDS, SLIDE_KEYS, emptyDesigns, parseImages, type CoordData, type CoordProject } from "@/lib/coordination";

/** Datos en vivo de «Reunión coordinación» (servidor). Tablas nuevas: si faltan (migración pendiente) esa parte queda vacía y el resto sale. */

const select = {
  id: true,
  title: true,
  category: true,
  status: true,
  assignee: { select: { name: true } },
  checklistItems: { select: { done: true } },
} as const;

type Row = {
  id: string;
  title: string;
  category: string;
  status: string;
  assignee: { name: string } | null;
  checklistItems: { done: boolean }[];
};

const toProject = (p: Row): CoordProject => ({
  id: p.id,
  title: p.title,
  category: p.category,
  status: p.status,
  done: p.checklistItems.filter((c) => c.done).length,
  total: p.checklistItems.length,
  assignee: p.assignee?.name ?? null,
});

export async function loadCoordination(): Promise<CoordData> {
  const [delivered, upcoming] = await Promise.all([
    prisma.project.findMany({ where: { id: { in: DELIVERED_PROJECT_IDS } }, select }),
    prisma.project.findMany({
      where: { priorityTag: "ATENCION_INMEDIATA", status: { not: "COMPLETADO" }, id: { notIn: DELIVERED_PROJECT_IDS } },
      orderBy: { sourceOrder: "asc" },
      select,
    }),
  ]);
  const byId = new Map(delivered.map((p) => [p.id, p]));
  const deliveredOrdered: CoordProject[] = [];
  for (const id of DELIVERED_PROJECT_IDS) {
    const p = byId.get(id);
    if (p) deliveredOrdered.push(toProject(p));
  }

  let blockers: CoordData["blockers"] = null;
  try {
    blockers = await prisma.coordinationBlocker.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true, text: true } });
  } catch {
    blockers = null;
  }

  const design = emptyDesigns();
  try {
    const rows = await prisma.coordinationPage.findMany();
    for (const r of rows) {
      const key = SLIDE_KEYS.find((k) => k === r.key);
      if (key) design[key] = { title: r.title ?? "", note: r.note ?? "", images: parseImages(r.images) };
    }
  } catch {
    // Sin la tabla de diseño, las páginas salen con sus textos por defecto.
  }

  return { delivered: deliveredOrdered, upcoming: upcoming.map(toProject), blockers, design };
}
