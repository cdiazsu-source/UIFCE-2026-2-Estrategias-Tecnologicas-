import { prisma } from "@/lib/prisma";
import { loadProjectTemplates, type LinkedTemplate } from "@/lib/project-templates-data";

/** Resumen de un proyecto para la presentación de coordinación: lo más importante en una sola vista, con sus plantillas asociadas. */

export type ProjectSummary = {
  id: string;
  title: string;
  category: string;
  status: string;
  priorityTag: string | null;
  assignee: string | null;
  done: number;
  total: number;
  /** Próximas subtareas pendientes (hasta 3), en su orden. */
  nextPending: string[];
  expectedOutcome: string;
  description: string;
  /** Últimas notas de la bitácora (hasta 3). */
  notes: { author: string; at: string; text: string }[];
  templates: LinkedTemplate[];
};

const clip = (t: string, n: number) => {
  const s = t.replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
};

export async function loadProjectSummary(id: string): Promise<ProjectSummary | null> {
  const p = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      priorityTag: true,
      description: true,
      expectedOutcome: true,
      assignee: { select: { name: true } },
      checklistItems: { orderBy: { order: "asc" }, select: { text: true, done: true } },
      notes: { orderBy: { createdAt: "desc" }, take: 3, select: { author: true, body: true, createdAt: true } },
    },
  });
  if (!p) return null;
  const tpl = await loadProjectTemplates(id, false);
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    status: p.status,
    priorityTag: p.priorityTag,
    assignee: p.assignee?.name ?? null,
    done: p.checklistItems.filter((c) => c.done).length,
    total: p.checklistItems.length,
    nextPending: p.checklistItems.filter((c) => !c.done).slice(0, 3).map((c) => clip(c.text, 140)),
    expectedOutcome: clip(p.expectedOutcome, 420),
    description: clip(p.description, 520),
    notes: p.notes.map((n) => ({ author: n.author, at: n.createdAt.toISOString(), text: clip(n.body, 170) })),
    templates: tpl?.linked ?? [],
  };
}
