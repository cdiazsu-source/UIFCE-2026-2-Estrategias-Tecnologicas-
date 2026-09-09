import { prisma } from "@/lib/prisma";
import { AreaOverview, type AreaProfileData } from "@/components/area-overview";
import { SituationStrip } from "@/components/situation-strip";
import { type ProjectCardData, type CardAssignee } from "@/components/project-card";
import { ProjectsGrid } from "@/components/projects-grid";
import { SemesterTabs, type SemesterTab } from "@/components/semester-tabs";
import { SemesterObjectives } from "@/components/semester-objectives";
import { TeamRoster, type RosterMember } from "@/components/team-roster";
import { StudyProjects, type JuniorWithStudy } from "@/components/study-projects";
import { UpdatesFeed, type FeedItem } from "@/components/updates-feed";
import { TeamComments, type TeamCommentData } from "@/components/team-comments";
import { InfoHint } from "@/components/info-hint";
import { NewProjectButton } from "@/components/new-project-button";
import { formatDateTime, JUNIOR_ROLES } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ROSTER_ROLES = ["MASTER", "JUNIOR_ARTES", "JUNIOR_AUXILIAR"];

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

  const selected = (semParam ? rows.find((s) => s.label === semParam) : null) ?? current;

  return { tabs, selected, isSelectedCurrent: !!(selected && current && selected.id === current.id) };
}

async function getHomeData(semesterId: string | null, includeOrphans: boolean) {
  const projectWhere =
    semesterId == null
      ? {}
      : includeOrphans
        ? { OR: [{ semesterId }, { semesterId: null }] }
        : { semesterId };

  const [stats, projects, notes, completed, people, roster, teamComments, director, areaProfile, studyJuniors] =
    await Promise.all([
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
          assigneeId: true,
          assignee: { select: { id: true, name: true, color: true } },
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
      prisma.user.findMany({
        // Panel principal → «Integrantes»: SOLO el equipo de ET (área "ET").
        // Los máster/líderes de otras áreas quedan fuera aunque tengan rol MASTER.
        where: { active: true, area: "ET", role: { in: ["MASTER", "JUNIOR_ARTES", "JUNIOR_AUXILIAR"] } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, role: true, photoUrl: true, linkedinUrl: true, color: true },
      }),
      prisma.teamComment.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
        select: {
          id: true,
          body: true,
          author: true,
          authorRole: true,
          reviewed: true,
          parentId: true,
          createdAt: true,
        },
      }),
      prisma.user.findFirst({
        where: { credentialKey: { not: null } },
        select: { name: true, lastSeenAt: true },
      }),
      prisma.areaProfile.findUnique({ where: { id: "area" } }),
      prisma.user.findMany({
        where: { role: { in: [...JUNIOR_ROLES] } },
        orderBy: [{ role: "asc" }, { name: "asc" }],
        include: {
          studyProjects: {
            where: projectWhere,
            orderBy: { order: "asc" },
            include: { checkpoints: { orderBy: { number: "asc" } } },
          },
        },
      }),
    ]);

  const peopleById = new Map(people.map((u) => [u.id, u]));

  const studyProjectsData: JuniorWithStudy[] = studyJuniors.map((j) => ({
    id: j.id,
    name: j.name,
    role: j.role,
    color: j.color,
    photoUrl: j.photoUrl,
    studyProjects: j.studyProjects,
  }));
  const studyJuniorOptions = studyJuniors
    .filter((j) => j.active)
    .map((j) => ({ id: j.id, name: j.name }));

  // Por proyecto: la siguiente subtarea pendiente (la que "sigue") y si ya está todo hecho.
  const nextPending = new Map<string, string>();
  const allDone = new Map<string, boolean>();
  // Por persona: cuántos proyectos activos en «❗ Atención Inmediata» tiene a cargo
  // (para el atajo titilante de la ficha del integrante).
  const urgentByPerson = new Map<string, number>();
  for (const p of projects) {
    const next = p.checklistItems.find((c) => !c.done);
    if (next) nextPending.set(p.id, next.text);
    allDone.set(p.id, p.checklistItems.length > 0 && p.checklistItems.every((c) => c.done));

    if (p.priorityTag === "ATENCION_INMEDIATA" && p.status !== "COMPLETADO") {
      const ids = new Set(
        p.checklistItems.map((c) => c.assigneeId).filter((x): x is string => !!x),
      );
      if (p.assigneeId) ids.add(p.assigneeId);
      for (const id of ids) urgentByPerson.set(id, (urgentByPerson.get(id) ?? 0) + 1);
    }
  }

  // Rango de urgencia para ordenar: primero «❗ Atención Inmediata», luego
  // «📅 Próximo Ciclo», luego «⏸️ Backlog», luego sin etiqueta.
  const PRIORITY_RANK: Record<string, number> = {
    ATENCION_INMEDIATA: 0,
    PROXIMO_CICLO: 1,
    BACKLOG: 2,
  };

  const projectCards: ProjectCardData[] = projects
    .map((p, i) => {
      const directAssignee: CardAssignee | null = p.assignee
        ? { id: p.assignee.id, name: p.assignee.name, color: p.assignee.color }
        : null;
      const seen = new Map<string, CardAssignee>();
      if (directAssignee) seen.set(directAssignee.id, directAssignee);
      for (const c of p.checklistItems) {
        if (c.assigneeId && !seen.has(c.assigneeId)) {
          const u = peopleById.get(c.assigneeId);
          seen.set(
            c.assigneeId,
            u
              ? { id: u.id, name: u.name, color: u.color }
              : { id: c.assigneeId, name: c.assignee ?? "—", color: null },
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
        assignee: directAssignee,
        tags: p.tags,
        assignees: [...seen.values()],
        sortIndex: i,
      };
    })
    // Orden por defecto: los que requieren atención más urgente primero; los
    // completados al final; el orden de planeación como desempate.
    .sort((a, b) => {
      const ca = a.status === "COMPLETADO" ? 1 : 0;
      const cb = b.status === "COMPLETADO" ? 1 : 0;
      if (ca !== cb) return ca - cb;
      const ra = PRIORITY_RANK[a.priorityTag ?? ""] ?? 3;
      const rb = PRIORITY_RANK[b.priorityTag ?? ""] ?? 3;
      return ra - rb || a.sortIndex - b.sortIndex;
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
        mentions: n.mentionIds.map((id) => peopleById.get(id)?.name).filter((x): x is string => !!x),
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

  const rosterMembers: RosterMember[] = [...roster]
    .sort(
      (a, b) => ROSTER_ROLES.indexOf(a.role) - ROSTER_ROLES.indexOf(b.role) || a.name.localeCompare(b.name, "es"),
    )
    .map((m) => ({ ...m, urgentCount: urgentByPerson.get(m.id) ?? 0 }));

  const commentAuthors = people.map((p) => ({ id: p.id, name: p.name, role: p.role }));
  const comments: TeamCommentData[] = teamComments;
  const profile: AreaProfileData | null = areaProfile
    ? { description: areaProfile.description, objectives: areaProfile.objectives }
    : null;

  return {
    stats,
    projectCards,
    feedItems,
    rosterMembers,
    comments,
    commentAuthors,
    director,
    profile,
    studyProjectsData,
    studyJuniorOptions,
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { sem?: string; focus?: string };
}) {
  const { tabs, selected, isSelectedCurrent } = await getSemesters(searchParams.sem);
  const {
    stats,
    projectCards,
    feedItems,
    rosterMembers,
    comments,
    commentAuthors,
    director,
    profile,
    studyProjectsData,
    studyJuniorOptions,
  } = await getHomeData(selected?.id ?? null, isSelectedCurrent);

  // ?focus=<id>: enfoca la grilla en los pendientes de atención de esa persona.
  const focusPerson = searchParams.focus
    ? commentAuthors.find((p) => p.id === searchParams.focus) ?? null
    : null;

  return (
    <div className="flex flex-col gap-8">
      <AreaOverview profile={profile} />

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

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <SemesterTabs semesters={tabs} selectedId={selected?.id ?? ""} />

          <SemesterObjectives
            semester={selected ? { id: selected.id, label: selected.label, objectives: selected.objectives } : null}
          />

          <TeamRoster people={rosterMembers} />

          <div
            id="proyectos"
            className="flex scroll-mt-20 flex-wrap items-center justify-between gap-2 border-t border-border pt-4"
          >
            <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Proyectos {selected ? `${selected.label} ` : ""}({projectCards.length})
              <InfoHint text="Una tarjeta por iniciativa del semestre seleccionado (pestañas de arriba). Por defecto se ordenan por urgencia (primero «❗ Atención Inmediata», luego «📅 Próximo Ciclo», luego «⏸️ Backlog»; los completados al final); el desplegable «Orden» permite volver al orden de planeación. Cómo se usa: busca por texto o filtra por categoría; el progreso cuenta subtareas hechas y la franja de color a la izquierda es la persona asignada — titila si el proyecto está en «❗ Atención Inmediata». Con perfil completo, «Nuevo proyecto» lo crea en el semestre visible. Ejemplo: elige «Eventos» para ver solo esos proyectos." />
            </h2>
            <NewProjectButton semesterId={selected?.id} semesterLabel={selected?.label} />
          </div>
          {projectCards.length === 0 ? (
            <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
              {selected ? `El semestre ${selected.label} todavía no tiene proyectos.` : "No hay proyectos."}
            </p>
          ) : (
            <ProjectsGrid
              projects={projectCards}
              focusPersonId={focusPerson?.id}
              focusPersonName={focusPerson?.name}
            />
          )}

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Proyectos de estudio {selected ? `${selected.label} ` : ""}
              <InfoHint text="Los proyectos de estudio de los monitores Junior del semestre seleccionado, agrupados por Junior, cada uno con su cronograma y sus 4 puntos de corte. Un Junior puede tener varios. Cómo se usa: con perfil completo, «Agregar proyecto de estudio» lo crea en el semestre visible; edita cada punto de corte (fecha y estado) y pega el enlace de la carpeta de Drive de entregables. Los Junior se definen en Equipo." />
            </h2>
            <StudyProjects
              juniors={studyProjectsData}
              juniorOptions={studyJuniorOptions}
              semesterId={selected?.id}
              semesterLabel={selected?.label}
            />
          </div>
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
