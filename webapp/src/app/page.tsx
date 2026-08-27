import { prisma } from "@/lib/prisma";
import { AreaOverview } from "@/components/area-overview";
import { SituationStrip } from "@/components/situation-strip";
import { type ProjectCardData, type CardAssignee } from "@/components/project-card";
import { ProjectsGrid } from "@/components/projects-grid";
import { UpdatesFeed, type FeedItem } from "@/components/updates-feed";
import { InfoHint } from "@/components/info-hint";
import { NewProjectButton } from "@/components/new-project-button";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const [stats, projects, notes, completed, people] = await Promise.all([
    prisma.situationStat.findMany({ orderBy: { order: "asc" } }),
    prisma.project.findMany({
      orderBy: { sourceOrder: "asc" },
      select: {
        id: true,
        title: true,
        category: true,
        priorityTag: true,
        status: true,
        isManual: true,
        description: true,
        checklistItems: {
          orderBy: { order: "asc" },
          select: { done: true, order: true, text: true, assigneeId: true, assignee: true },
        },
      },
    }),
    prisma.projectNote.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { project: { select: { id: true, title: true } } },
    }),
    prisma.checklistItem.findMany({
      where: { done: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, text: true, updatedAt: true, project: { select: { id: true, title: true } } },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true, color: true },
    }),
  ]);

  const peopleById = new Map(people.map((u) => [u.id, u]));

  // Por proyecto: la siguiente subtarea pendiente (la que "sigue") y si ya está todo hecho.
  const nextPending = new Map<string, string>();
  const allDone = new Map<string, boolean>();
  for (const p of projects) {
    const next = p.checklistItems.find((c) => !c.done);
    if (next) nextPending.set(p.id, next.text);
    allDone.set(p.id, p.checklistItems.length > 0 && p.checklistItems.every((c) => c.done));
  }

  const projectCards: ProjectCardData[] = projects.map((p) => {
    const seen = new Map<string, CardAssignee>();
    for (const c of p.checklistItems) {
      if (c.assigneeId && !seen.has(c.assigneeId)) {
        const u = peopleById.get(c.assigneeId);
        seen.set(
          c.assigneeId,
          u ? { id: u.id, name: u.name, color: u.color } : { id: c.assigneeId, name: c.assignee ?? "—", color: null },
        );
      }
    }
    return {
      id: p.id,
      title: p.title,
      category: p.category,
      priorityTag: p.priorityTag,
      status: p.status,
      checklistDone: p.checklistItems.filter((c) => c.done).length,
      checklistTotal: p.checklistItems.length,
      isManual: p.isManual,
      description: p.description,
      assignees: [...seen.values()],
    };
  });

  const feedItems: FeedItem[] = [
    ...notes.map(
      (n): FeedItem => ({
        kind: "note",
        id: n.id,
        body: n.body,
        author: n.author,
        authorRole: n.authorRole,
        at: n.createdAt,
        projectId: n.project.id,
        projectTitle: n.project.title,
      }),
    ),
    ...completed.map(
      (c): FeedItem => ({
        kind: "check",
        id: `check-${c.id}`,
        text: c.text,
        at: c.updatedAt,
        projectId: c.project.id,
        projectTitle: c.project.title,
        nextText: nextPending.get(c.project.id) ?? null,
        allDone: allDone.get(c.project.id) ?? false,
      }),
    ),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 18);

  // El filtro "por responsable" del buscador solo lista al máster y a los juniors
  // (quienes ejecutan las subtareas), no a coordinación/dirección.
  const FILTER_ROLES = new Set(["MASTER", "JUNIOR_ARTES", "JUNIOR_AUXILIAR"]);
  const filterPeople = people.filter((p) => FILTER_ROLES.has(p.role));

  return { stats, projectCards, feedItems, filterPeople };
}

export default async function HomePage() {
  const { stats, projectCards, feedItems, filterPeople } = await getHomeData();

  return (
    <div className="flex flex-col gap-8">
      <AreaOverview />

      <section className="flex flex-col gap-3">
        <h1 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Situación actual
          <InfoHint text="Foto fija de cómo llega el área al semestre: canales en riesgo o activos, el principio rector, y cuántas alertas críticas hay abiertas. Se edita a mano con el lápiz de cada tarjeta, no se calcula solo — actualízala cuando algo importante cambie." />
        </h1>
        <SituationStrip stats={stats} />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Proyectos ({projectCards.length})
              <InfoHint text="Una tarjeta por cada iniciativa de la planeación del semestre. Busca por texto o filtra por responsable. La barra de progreso cuenta subtareas hechas; los puntos de color son las personas con subtareas en el proyecto." />
            </h2>
            <NewProjectButton />
          </div>
          <ProjectsGrid projects={projectCards} people={filterPeople} />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Actividad
            <InfoHint text="Lo más reciente de todos los proyectos, junto y en orden cronológico: notas de bitácora y subtareas que se marcan como hechas. Bajo una subtarea completada, titilando, aparece la que sigue en ese proyecto." />
          </h2>
          <UpdatesFeed items={feedItems} />
        </div>
      </section>
    </div>
  );
}
