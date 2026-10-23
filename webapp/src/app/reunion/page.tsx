import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { canUseDeveloper } from "@/lib/session";
import { DELIVERED_PROJECT_IDS, type CoordBlocker, type CoordProject } from "@/lib/coordination";
import { CoordinationBoard } from "@/components/coordination-board";

export const dynamic = "force-dynamic";

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

/** Reunión coordinación: solo el máster (sin «Ver como»). */
export default async function ReunionPage() {
  if (!(await canUseDeveloper())) redirect("/");

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

  // Tabla nueva: sin la migración, el bloque de bloqueos avisa en lugar de tumbar la pantalla.
  let blockers: CoordBlocker[] | null = null;
  try {
    blockers = (await prisma.coordinationBlocker.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true, text: true } }));
  } catch {
    blockers = null;
  }

  return <CoordinationBoard delivered={deliveredOrdered} upcoming={upcoming.map(toProject)} blockers={blockers} />;
}
