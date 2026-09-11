import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { DriveLinkEditor } from "@/components/drive-link-editor";
import { ProjectStatusSelect } from "@/components/project-status-select";
import { ProjectPrioritySelect } from "@/components/project-priority-select";
import { ProjectAssigneeSelect } from "@/components/project-assignee-select";
import { PriorityTag } from "@/components/priority-tag";
import { ProjectControls } from "@/components/project-controls";
import { ProjectTitleEditor } from "@/components/project-title-editor";
import { ProjectEventControls } from "@/components/project-event-controls";
import { Checklist } from "@/components/checklist";
import { NotesLog } from "@/components/notes-log";
import { ConsentPanel, type ConsentRow } from "@/components/consent-panel";
import { wipBlockedBy } from "@/lib/actions/projects";
import { CONSENT_PROJECT_ID } from "@/lib/consent";
import { formatDayHeader, formatTimeRange, PROJECT_STATUS_LABEL } from "@/lib/utils";

const STATUS_BADGE_VARIANT: Record<string, "secondary" | "warning" | "success"> = {
  POR_INICIAR: "secondary",
  EN_CURSO: "warning",
  COMPLETADO: "success",
};

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const isConsent = params.id === CONSENT_PROJECT_ID;

  const [project, authors, consentRows, candidateMains] = await Promise.all([
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

  const consentData: ConsentRow[] = consentRows.map((c) => ({
    id: c.id,
    name: c.name,
    signed: c.signed,
    signedAt: c.signedAt,
    driveAccess: c.driveAccess,
    driveAccessAt: c.driveAccessAt,
    driveFolderUrl: c.driveFolderUrl,
    active: c.active,
    isET: c.user?.area === "ET",
    photoUrl: c.user?.photoUrl ?? null,
    color: c.user?.color ?? null,
  }));

  // Para el bloqueo de WIP en el selector de urgencia (validación también en frontend).
  const wipBlocked =
    project.priorityTag === "ATENCION_INMEDIATA" ? false : Boolean(await wipBlockedBy(project.id));

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
            <InfoHint text="Cabecera editable del proyecto. El estado (Por iniciar / En curso / Completado) es la fase; la urgencia (❗ Atención Inmediata / 📅 Próximo Ciclo / ⏸️ Backlog) marca la prioridad temporal; el responsable es la persona a cargo del proyecto y su color identifica el proyecto en el panel. Cómo se usa: los roles distintos de Junior (perfil completo) cambian estado, urgencia y responsable, pegan el enlace de Drive, gestionan etiquetas y, con «Editar contenido», ajustan título, categoría y textos; el nombre se edita con un clic directo sobre el título. Límite: nadie puede tener más de 3 proyectos activos en «❗ Atención Inmediata». Ejemplo: «En curso · 📅 Próximo Ciclo · María Fernanda Celis»." />
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
        </div>
        <ProjectEventControls project={project} candidateMains={candidateMains} mainProject={project.mainProject} />
        <ProjectControls project={project} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Qué se debe hacer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm leading-relaxed">
          <p>{project.description}</p>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qué se espera</p>
            <p className="mt-1">{project.expectedOutcome}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fundamento</p>
            <p className="mt-1 text-muted-foreground">{project.rationale}</p>
          </div>
        </CardContent>
      </Card>

      {project.relatedProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              Actividades de este proyecto
              <InfoHint text="Proyectos que cuelgan de este como su «proyecto principal» — por ejemplo, cada actividad de la Semana UIFCE. Se vinculan desde el horario de cada actividad. En orden cronológico." />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
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
          </CardContent>
        </Card>
      )}

      {isConsent && <ConsentPanel signatories={consentData} />}

      <Checklist projectId={project.id} items={project.checklistItems} people={authors} />

      <NotesLog
        projectId={project.id}
        notes={project.notes}
        authors={authors}
        checklistItems={project.checklistItems}
      />
    </div>
  );
}
