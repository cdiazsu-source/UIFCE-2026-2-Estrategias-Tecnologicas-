import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { CollapseAllControls, CollapsibleCard } from "@/components/collapsible";
import { InfoHint } from "@/components/info-hint";
import { DriveLinkEditor } from "@/components/drive-link-editor";
import { ProjectStatusSelect } from "@/components/project-status-select";
import { ProjectPrioritySelect } from "@/components/project-priority-select";
import { ProjectAssigneeSelect } from "@/components/project-assignee-select";
import { ProjectRequesterSelect } from "@/components/project-requester-select";
import { requesterLabel } from "@/lib/requester";
import { PriorityTag } from "@/components/priority-tag";
import { ProjectControls } from "@/components/project-controls";
import { ProjectTitleEditor } from "@/components/project-title-editor";
import { ProjectEventControls } from "@/components/project-event-controls";
import { ProjectContextButton } from "@/components/project-context-button";
import type { ProjectContext } from "@/lib/project-context-prompt";
import { parseNoteLinks } from "@/lib/note-links";
import { Checklist } from "@/components/checklist";
import { NotesLog } from "@/components/notes-log";
import { ConsentPanel, type ConsentRow } from "@/components/consent-panel";
import { ExpensesPanel, type ExpenseRow } from "@/components/expenses-panel";
import { wipBlockedBy } from "@/lib/actions/projects";
import { CONSENT_PROJECT_ID } from "@/lib/consent";
import { EXPENSES_PROJECT_ID } from "@/lib/expenses";
import {
  formatDate,
  formatDateTime,
  formatDayHeader,
  formatTimeRange,
  PRIORITY_TAG_LABEL,
  PROJECT_STATUS_LABEL,
} from "@/lib/utils";

const STATUS_BADGE_VARIANT: Record<string, "secondary" | "warning" | "success"> = {
  POR_INICIAR: "secondary",
  EN_CURSO: "warning",
  COMPLETADO: "success",
};

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const isConsent = params.id === CONSENT_PROJECT_ID;
  const isExpenses = params.id === EXPENSES_PROJECT_ID;

  const [project, authors, consentRows, expenseRows, expenseProjects, candidateMains] = await Promise.all([
    prisma.project.findUnique({
      where: { id: params.id },
      include: {
        assignee: { select: { id: true, name: true, color: true } },
        mainProject: { select: { id: true, title: true } },
        relatedProjects: {
          select: { id: true, title: true, status: true, startAt: true, endAt: true, location: true },
          orderBy: [{ startAt: "asc" }, { title: "asc" }],
        },
        checklistItems: true,
        notes: { include: { checklistItem: { select: { id: true, text: true, done: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true, color: true },
    }),
    isConsent
      ? prisma.consentSignatory.findMany({
          orderBy: { order: "asc" },
          include: { user: { select: { photoUrl: true, color: true, area: true } } },
        })
      : Promise.resolve([]),
    isExpenses
      ? prisma.expense.findMany({
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          include: {
            responsible: { select: { id: true, name: true, photoUrl: true, color: true } },
            project: { select: { id: true, title: true } },
          },
        })
      : Promise.resolve([]),
    isExpenses
      ? prisma.project.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } })
      : Promise.resolve([]),
    // Proyectos elegibles como "principal": los que no son ya, a su vez, una
    // actividad de otro (un solo nivel de anidado, igual que las respuestas
    // a comentarios).
    prisma.project.findMany({
      where: { mainProjectId: null, id: { not: params.id } },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  if (!project) notFound();

  // Contexto de la Unidad para el botón «Contexto para IA».
  const [areaProfile, semester] = await Promise.all([
    prisma.areaProfile.findUnique({ where: { id: "area" }, select: { description: true } }),
    project.semesterId
      ? prisma.semester.findUnique({
          where: { id: project.semesterId },
          select: { label: true, objectives: true, etStrategies: true },
        })
      : Promise.resolve(null),
  ]);

  const consentData: ConsentRow[] = consentRows.map((c) => ({
    id: c.id,
    name: c.name,
    signed: c.signed,
    signedAt: c.signedAt,
    driveAccess: c.driveAccess,
    driveAccessAt: c.driveAccessAt,
    photoReady: c.photoReady,
    photoReadyAt: c.photoReadyAt,
    driveFolderUrl: c.driveFolderUrl,
    active: c.active,
    isET: c.user?.area === "ET",
    photoUrl: c.user?.photoUrl ?? null,
    color: c.user?.color ?? null,
  }));

  const expensesData: ExpenseRow[] = expenseRows.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    concept: e.concept,
    category: e.category,
    amount: e.amount,
    status: e.status,
    responsible: e.responsible,
    project: e.project,
    supportUrl: e.supportUrl,
    notes: e.notes,
  }));

  // Para el bloqueo de WIP en el selector de urgencia (validación también en frontend).
  const wipBlocked =
    project.priorityTag === "ATENCION_INMEDIATA" ? false : Boolean(await wipBlockedBy(project.id));

  // Contexto del proyecto para el prompt de «Semilla de checklist» (el checklist
  // actual lo agrega el componente, con su estado en vivo).
  const seedContext = {
    title: project.title,
    category: project.category,
    statusLabel: PROJECT_STATUS_LABEL[project.status],
    priorityLabel: project.priorityTag ? (PRIORITY_TAG_LABEL[project.priorityTag] ?? null) : null,
    assignee: project.assignee?.name ?? null,
    requester: requesterLabel(project.requesterArea),
    tags: project.tags,
    description: project.description,
    expectedOutcome: project.expectedOutcome,
    rationale: project.rationale,
    schedule: project.startAt
      ? [`${formatDayHeader(project.startAt)} · ${formatTimeRange(project.startAt, project.endAt)}`, project.location]
          .filter(Boolean)
          .join(" · ")
      : project.location,
    mainProjectTitle: project.mainProject?.title ?? null,
    notes: [...project.notes]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((n) => ({
        author: n.author,
        date: formatDateTime(n.createdAt),
        body: n.body.length > 400 ? `${n.body.slice(0, 400)}…` : n.body,
      })),
  };

  // Contexto completo (Unidad + proyecto + checklist + bitácora) para pegar en cualquier IA.
  const scheduleOf = (startAt: Date | null, endAt: Date | null, location: string | null) =>
    startAt
      ? [`${formatDayHeader(startAt)} · ${formatTimeRange(startAt, endAt)}`, location].filter(Boolean).join(" · ")
      : location;
  const NOTES_IN_CONTEXT = 20;
  const sortedNotes = [...project.notes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const aiContext: ProjectContext = {
    title: project.title,
    category: project.category,
    statusLabel: PROJECT_STATUS_LABEL[project.status],
    priorityLabel: project.priorityTag ? (PRIORITY_TAG_LABEL[project.priorityTag] ?? null) : null,
    assignee: project.assignee?.name ?? null,
    requester: requesterLabel(project.requesterArea),
    tags: project.tags,
    description: project.description,
    expectedOutcome: project.expectedOutcome,
    rationale: project.rationale,
    schedule: scheduleOf(project.startAt, project.endAt, project.location),
    mainProjectTitle: project.mainProject?.title ?? null,
    driveFolderUrl: project.driveFolderUrl,
    semesterLabel: semester?.label ?? null,
    semesterObjectives: semester?.objectives ?? [],
    etStrategies: semester?.etStrategies ?? [],
    areaDescription: areaProfile?.description ?? null,
    activities: project.relatedProjects.map((r) => ({
      title: r.title,
      statusLabel: PROJECT_STATUS_LABEL[r.status],
      schedule: scheduleOf(r.startAt, r.endAt, r.location),
    })),
    checklist: [...project.checklistItems]
      .sort((a, b) => a.order - b.order)
      .map((i) => ({
        text: i.text,
        done: i.done,
        assignee: (i.assigneeId ? authors.find((p) => p.id === i.assigneeId)?.name : null) ?? i.assignee ?? null,
        due: i.dueDate ? formatDate(i.dueDate) : null,
      })),
    notes: sortedNotes.slice(0, NOTES_IN_CONTEXT).map((n) => ({
      author: n.author,
      date: formatDateTime(n.createdAt),
      body: n.body.length > 600 ? `${n.body.slice(0, 600)}…` : n.body,
      item: n.checklistItem?.text ?? null,
      links: parseNoteLinks(n.links),
    })),
    notesTotal: sortedNotes.length,
  };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Volver al panel principal
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{project.category}</Badge>
          <PriorityTag tag={project.priorityTag} />
          {project.isManual && <Badge variant="secondary">Propio</Badge>}
          {project.editedInApp && <Badge variant="outline">Editado en la app</Badge>}
          {project.tags.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ProjectTitleEditor project={project} />
          <DriveLinkEditor projectId={project.id} driveFolderUrl={project.driveFolderUrl} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            Estado:
            <InfoHint text="Cabecera editable del proyecto. El estado (Por iniciar / En curso / Completado) es la fase; la urgencia (❗ Atención Inmediata / 📅 Próximo Ciclo / ⏸️ Backlog) marca la prioridad temporal; el responsable es la persona de ET a cargo del proyecto y su color identifica el proyecto en el panel; el solicitante es el área o instancia fuera de ET (AA, GC, DS, VA, CL, Coordinación o Dirección) que pidió el servicio o la iniciativa, si aplica; solo se elige el área, no personas. Cómo se usa: los roles distintos de Junior (perfil completo) cambian estado, urgencia, responsable y solicitante, pegan el enlace de Drive, gestionan etiquetas y, con «Editar contenido», ajustan título, categoría y textos; el nombre se edita con un clic directo sobre el título. Límite: nadie puede tener más de 3 proyectos activos en «❗ Atención Inmediata». Ejemplo: «En curso · 📅 Próximo Ciclo · Responsable: María Fernanda Celis · Solicitante: AA — Apoyos Académicos»." />
          </span>
          <ProjectStatusSelect projectId={project.id} status={project.status} />
          <span className="text-sm text-muted-foreground">Urgencia:</span>
          <ProjectPrioritySelect
            projectId={project.id}
            priorityTag={project.priorityTag}
            wipBlocked={wipBlocked}
          />
          <span className="text-sm text-muted-foreground">Responsable:</span>
          <ProjectAssigneeSelect projectId={project.id} assignee={project.assignee} people={authors} />
          <span className="text-sm text-muted-foreground">Solicitante:</span>
          <ProjectRequesterSelect projectId={project.id} requesterArea={project.requesterArea} />
        </div>
        <ProjectEventControls project={project} candidateMains={candidateMains} mainProject={project.mainProject} />
        <ProjectControls project={project} />
        <ProjectContextButton context={aiContext} />
      </div>

      <CollapseAllControls scope="project" className="-mb-3 justify-end" />

      <CollapsibleCard id="p-descripcion" scope="project:descripcion" label="«Qué se debe hacer»" title="Qué se debe hacer">
        <p className="whitespace-pre-line">{project.description}</p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qué se espera</p>
          <p className="mt-1 whitespace-pre-line">{project.expectedOutcome}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fundamento</p>
          <p className="mt-1 whitespace-pre-line text-muted-foreground">{project.rationale}</p>
        </div>
      </CollapsibleCard>

      {project.relatedProjects.length > 0 && (
        <CollapsibleCard
          id="p-actividades"
          scope="project:actividades"
          label="las actividades"
          title={
            <>
              Actividades de este proyecto
              <InfoHint text="Proyectos que cuelgan de este como su «proyecto principal» — por ejemplo, cada actividad de la Semana UIFCE. Se vinculan desde el horario de cada actividad. En orden cronológico." />
            </>
          }
        >
          <div className="flex flex-col gap-2">
            {project.relatedProjects.map((r) => (
              <Link
                key={r.id}
                href={`/proyectos/${r.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <span className="font-medium">{r.title}</span>
                <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {r.startAt && (
                    <span>
                      {formatDayHeader(r.startAt)} · {formatTimeRange(r.startAt, r.endAt)}
                    </span>
                  )}
                  {r.location && <span>{r.location}</span>}
                  <Badge variant={STATUS_BADGE_VARIANT[r.status]}>{PROJECT_STATUS_LABEL[r.status]}</Badge>
                </span>
              </Link>
            ))}
          </div>
        </CollapsibleCard>
      )}

      {isConsent && <ConsentPanel signatories={consentData} />}

      {isExpenses && <ExpensesPanel expenses={expensesData} people={authors} projects={expenseProjects} />}

      <Checklist projectId={project.id} items={project.checklistItems} people={authors}
        notes={project.notes.map((n) => ({
          id: n.id,
          checklistItemId: n.checklistItemId,
          author: n.author,
          body: n.body,
          createdAt: n.createdAt,
        }))}
        seedContext={seedContext}
      />

      <NotesLog
        projectId={project.id}
        notes={project.notes}
        authors={authors}
        checklistItems={project.checklistItems}
      />
    </div>
  );
}
