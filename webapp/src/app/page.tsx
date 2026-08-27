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
  const [stats, projects, notes, people] = await Promise.all([
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
        checklistItems: { select: { done: true, assigneeId: true, assignee: true } },
      },
    }),
    prisma.projectNote.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { project: { select: { id: true, title: true } } },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
  ]);

  const peopleById = new Map(people.map((u) => [u.id, u]));

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

  const feedItems: FeedItem[] = notes.map((n) => ({
    id: n.id,
    body: n.body,
    author: n.author,
    authorRole: n.authorRole,
    createdAt: n.createdAt,
    projectId: n.project.id,
    projectTitle: n.project.title,
  }));

  return { stats, projectCards, feedItems, people };
}

export default async function HomePage() {
  const { stats, projectCards, feedItems, people } = await getHomeData();

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
          <ProjectsGrid projects={projectCards} people={people} />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Actividad
            <InfoHint text="Las notas de bitácora más recientes de todos los proyectos, juntas y en orden cronológico — para ver de un vistazo qué se movió esta semana sin entrar proyecto por proyecto." />
          </h2>
          <UpdatesFeed items={feedItems} />
        </div>
      </section>
    </div>
  );
}
