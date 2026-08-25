import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DriveLinkEditor } from "@/components/drive-link-editor";
import { ProjectStatusSelect } from "@/components/project-status-select";
import { Checklist } from "@/components/checklist";
import { NotesLog } from "@/components/notes-log";

export const dynamic = "force-dynamic";

const PRIORITY_BADGE_VARIANT: Record<string, "destructive" | "warning" | "outline"> = {
  CRÍTICO: "destructive",
  PRIORITARIO: "warning",
  NUEVO: "outline",
};

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      checklistItems: true,
      notes: true,
    },
  });

  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Volver al panel principal
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{project.category}</Badge>
          {project.priorityTag && (
            <Badge variant={PRIORITY_BADGE_VARIANT[project.priorityTag] ?? "outline"}>{project.priorityTag}</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold leading-tight">{project.title}</h1>
          <DriveLinkEditor projectId={project.id} driveFolderUrl={project.driveFolderUrl} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Estado:</span>
          <ProjectStatusSelect projectId={project.id} status={project.status} />
        </div>
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

      <Checklist projectId={project.id} items={project.checklistItems} />

      <NotesLog projectId={project.id} notes={project.notes} />
    </div>
  );
}
