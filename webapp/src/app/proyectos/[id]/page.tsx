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
import { Checklist } from "@/components/checklist";
import { NotesLog } from "@/components/notes-log";
import { ConsentPanel, type ConsentRow } from "@/components/consent-panel";
import { wipBlockedBy } from "@/lib/actions/projects";
import { CONSENT_PROJECT_ID } from "@/lib/consent";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const isConsent = params.id === CONSENT_PROJECT_ID;

  const [project, authors, consentRows] = await Promise.all([
    prisma.project.findUnique({
      where: { id: params.id },
      include: {
        assignee: { select: { id: true, name: true, color: true } },
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
          <h1 className="text-2xl font-bold leading-tight">{project.title}</h1>
          <DriveLinkEditor projectId={project.id} driveFolderUrl={project.driveFolderUrl} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            Estado:
            <InfoHint text="Cabecera editable del proyecto. El estado (Por iniciar / En curso / Completado) es la fase; la urgencia (❗ Atención Inmediata / 📅 Próximo Ciclo / ⏸️ Backlog) marca la prioridad temporal; el responsable es la persona a cargo del proyecto y su color identifica el proyecto en el panel. Cómo se usa: los roles distintos de Junior (perfil completo) cambian estado, urgencia y responsable, pegan el enlace de Drive, gestionan etiquetas y, con «Editar contenido», ajustan título, categoría y textos. Límite: nadie puede tener más de 3 proyectos activos en «❗ Atención Inmediata». Ejemplo: «En curso · 📅 Próximo Ciclo · María Fernanda Celis»." />
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
