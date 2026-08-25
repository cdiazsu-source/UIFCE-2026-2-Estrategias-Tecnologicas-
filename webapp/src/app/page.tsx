import { prisma } from "@/lib/prisma";
import { SituationStrip } from "@/components/situation-strip";
import { ProjectCard, type ProjectCardData } from "@/components/project-card";
import { UpdatesFeed, type FeedItem } from "@/components/updates-feed";
import { InfoHint } from "@/components/info-hint";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const [stats, projects, notes] = await Promise.all([
    prisma.situationStat.findMany({ orderBy: { order: "asc" } }),
    prisma.project.findMany({
      orderBy: { sourceOrder: "asc" },
      include: { checklistItems: { select: { done: true } } },
    }),
    prisma.projectNote.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { project: { select: { id: true, title: true } } },
    }),
  ]);

  const projectCards: ProjectCardData[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    priorityTag: p.priorityTag,
    status: p.status,
    checklistDone: p.checklistItems.filter((c) => c.done).length,
    checklistTotal: p.checklistItems.length,
  }));

  const feedItems: FeedItem[] = notes.map((n) => ({
    id: n.id,
    body: n.body,
    author: n.author,
    createdAt: n.createdAt,
    projectId: n.project.id,
    projectTitle: n.project.title,
  }));

  return { stats, projectCards, feedItems };
}

export default async function HomePage() {
  const { stats, projectCards, feedItems } = await getHomeData();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Situación actual
          <InfoHint text="Foto fija de cómo llega el área al semestre: canales en riesgo o activos, el principio rector, y cuántas alertas críticas hay abiertas. Se edita a mano con el lápiz de cada tarjeta, no se calcula solo — actualízala cuando algo importante cambie." />
        </h1>
        <SituationStrip stats={stats} />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Proyectos ({projectCards.length})
            <InfoHint text="Una tarjeta por cada iniciativa de la planeación del semestre. La barra de progreso cuenta subtareas del checklist marcadas como hechas. Haz clic en cualquiera para ver el detalle completo." />
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projectCards.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
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
