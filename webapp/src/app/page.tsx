import { prisma } from "@/lib/prisma";
import { AreaOverview } from "@/components/area-overview";
import { SituationStrip } from "@/components/situation-strip";
import { type ProjectCardData, type CardAssignee } from "@/components/project-card";
import { ProjectsGrid } from "@/components/projects-grid";
import { SemesterTabs, type SemesterTab } from "@/components/semester-tabs";
import { UpdatesFeed, type FeedItem } from "@/components/updates-feed";
import { TeamComments, type TeamCommentData } from "@/components/team-comments";
import { InfoHint } from "@/components/info-hint";
import { NewProjectButton } from "@/components/new-project-button";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getSemesters(semParam: string | undefined) {
  const [rows, counts] = await Promise.all([
    prisma.semester.findMany({ orderBy: { order: "asc" } }),
    prisma.project.groupBy({ by: ["semesterId"], _count: { _all: true } }),
  ]);

  const countBy = new Map<string | null, number>();
  for (const c of counts) countBy.set(c.semesterId, c._count._all);

  const current = rows.find((s) => s.isCurrent) ?? rows[0] ?? null;
  const orphanCount = countBy.get(null) ?? 0;

  const tabs: SemesterTab[] = rows.map((s) => ({
    id: s.id,
    label: s.label,
    isCurrent: s.isCurrent,
    // Los proyectos sin semestre se cuentan/muestran junto al vigente.
    projectCount: (countBy.get(s.id) ?? 0) + (current && s.id === current.id ? orphanCount : 0),
  }));

  const selected =
    (semParam ? rows.find((s) => s.label === semParam) : null) ?? current;

  return { rows, tabs, selected, isSelectedCurrent: !!(selected && current && selected.id === current.id) };
}

async function getHomeData(semesterId: string | null, includeOrphans: boolean) {
  const projectWhere =
    semesterId == null
      ? {}
      : includeOrphans
        ? { OR: [{ semesterId }, { semesterId: null }] }
        : { semesterId };

  const [stats, projects, notes, completed, people, teamComments, director] = await Promise.all([
    prisma.situationStat.findMany({ orderBy: { order: "asc" } }),
    prisma.project.findMany({
      where: projectWhere,
      orderBy: { sourceOrder: "asc" },
      select: {
        id: true,
        title: true,
        category: true,
        priorityTag: true,
        status: true,
        isManual: true,
        description: true,
        tags: true,
        checklistItems: {
          orderBy: { order: "asc" },
          select: { done: true, order: true, text: true, assigneeId: true, assignee: true },
        },
      },
    }),
    prisma.projectNote.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        project: { select: { id: true, title: true } },
        checklistItem: { select: { text: true, done: true } },
      },
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
    prisma.teamComment.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      select: { id: true, body: true, author: true, authorRole: true, reviewed: true, createdAt: true },
    }),
    prisma.user.findFirst({
      where: { credentialKey: { not: null } },
      select: { name: true, lastSeenAt: true },
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
      tags: p.tags,
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
        checklistItemText: n.checklistItem?.text ?? null,
        checklistItemDone: n.checklistItem?.done ?? false,
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

  const commentAuthors = people.map((p) => ({ id: p.id, name: p.name, role: p.role }));
  const comments: TeamCommentData[] = teamComments;

  return { stats, projectCards, feedItems, filterPeople, comments, commentAuthors, director };
}

export default async function HomePage({ searchParams }: { searchParams: { sem?: string } }) {
  const { tabs, selected, isSelectedCurrent } = await getSemesters(searchParams.sem);
  const { stats, projectCards, feedItems, filterPeople, comments, commentAuthors, director } = await getHomeData(
    selected?.id ?? null,
    isSelectedCurrent,
  );

  return (
    <div className="flex flex-col gap-8">
      <AreaOverview
        semester={selected ? { id: selected.id, label: selected.label, objectives: selected.objectives } : null}
      />

      {director && (
        <p className="-mt-4 text-xs text-muted-foreground">
          Último acceso del director ({director.name}):{" "}
          <span className="font-medium text-foreground">
            {director.lastSeenAt ? formatDateTime(director.lastSeenAt) : "sin registro todavía"}
          </span>
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h1 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Situación actual
          <InfoHint text="Foto fija de cómo llega el área al semestre: canales en riesgo o activos, el principio rector y las alertas críticas abiertas. No se calcula solo. Cómo se usa: con perfil completo, pasa el cursor por una tarjeta y usa el lápiz para editar etiqueta y valor. Ejemplo: «Canal en riesgo → Instagram (cuenta nueva en consolidación)»." />
        </h1>
        <SituationStrip stats={stats} />
      </section>

      <section className="flex flex-col gap-3">
        <SemesterTabs semesters={tabs} selectedId={selected?.id ?? ""} />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Proyectos {selected ? `${selected.label} ` : ""}({projectCards.length})
              <InfoHint text="Una tarjeta por iniciativa del semestre seleccionado (pestañas de arriba). Cómo se usa: busca por texto o filtra por responsable; el progreso cuenta subtareas hechas y los puntos de color son las personas con subtareas. Con perfil completo, «Nuevo proyecto» lo crea en el semestre visible. Ejemplo: escribe «hackatón» para ver solo ese proyecto." />
            </h2>
            <NewProjectButton semesterId={selected?.id} semesterLabel={selected?.label} />
          </div>
          {projectCards.length === 0 ? (
            <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
              {selected ? `El semestre ${selected.label} todavía no tiene proyectos.` : "No hay proyectos."}
            </p>
          ) : (
            <ProjectsGrid projects={projectCards} people={filterPeople} />
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Actividad
              <InfoHint text="Lo más reciente de todos los proyectos, en orden cronológico: notas de bitácora y subtareas marcadas como hechas. Bajo una subtarea completada, titilando, aparece la que sigue. El texto largo se recorta; clic en una entrada abre el proyecto. Se alimenta de lo que el equipo escribe en la bitácora de cada proyecto." />
            </h2>
            <UpdatesFeed items={feedItems} />
          </div>

          <TeamComments comments={comments} authors={commentAuthors} />
        </div>
      </section>
    </div>
  );
}
