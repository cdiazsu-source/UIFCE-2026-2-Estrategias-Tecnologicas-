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
import { PriorityTag } from "@/components/priority-tag";
import { ProjectControls } from "@/components/project-controls";
import { Checklist } from "@/components/checklist";
import { NotesLog } from "@/components/notes-log";
import { wipBlockedBy } from "@/lib/actions/projects";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, authors] = await Promise.all([
    prisma.project.findUnique({
      where: { id: params.id },
      include: {
        checklistItems: true,
        notes: { include: { checklistItem: { select: { id: true, text: true, done: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true, color: true },
    }),
  ]);

  if (!project) notFound();

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
            <InfoHint text="Cabecera editable del proyecto. El estado (Por iniciar / En curso / Completado) es la fase del proyecto; la urgencia (❗ Atención Inmediata / 📅 Próximo Ciclo / ⏸️ Backlog) es aparte y marca la prioridad temporal. Cómo se usa: con perfil completo cambias ambos, pegas el enlace de Drive, gestionas etiquetas y, con «Editar contenido», ajustas título, categoría y textos. El perfil junior ve la urgencia pero no la edita. Límite: nadie puede tener más de 3 proyectos activos en «❗ Atención Inmediata». Ejemplo: estado «En curso» + urgencia «📅 Próximo Ciclo»." />
          </span>
          <ProjectStatusSelect projectId={project.id} status={project.status} />
          <span className="text-sm text-muted-foreground">Urgencia:</span>
          <ProjectPrioritySelect
            projectId={project.id}
            priorityTag={project.priorityTag}
            wipBlocked={wipBlocked}
          />
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
