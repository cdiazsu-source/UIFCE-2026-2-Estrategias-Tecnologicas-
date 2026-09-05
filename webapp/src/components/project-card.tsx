import Link from "next/link";
import type { ProjectStatus } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PriorityTag } from "@/components/priority-tag";
import { PROJECT_STATUS_LABEL } from "@/lib/utils";
import { personColor } from "@/lib/person-color";

export type CardAssignee = { id: string; name: string; color?: string | null };

const STATUS_BADGE_VARIANT: Record<ProjectStatus, "secondary" | "warning" | "success"> = {
  POR_INICIAR: "secondary",
  EN_CURSO: "warning",
  COMPLETADO: "success",
};

export type ProjectCardData = {
  id: string;
  title: string;
  category: string;
  priorityTag: string | null;
  status: ProjectStatus;
  checklistDone: number;
  checklistTotal: number;
  isManual: boolean;
  /** Solo para búsqueda, no se muestra. */
  description: string;
  /** Etiquetas libres del proyecto. */
  tags: string[];
  /** Personas con al menos una subtarea en el proyecto. */
  assignees: CardAssignee[];
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const progress = project.checklistTotal > 0 ? (project.checklistDone / project.checklistTotal) * 100 : 0;

  return (
    <Link href={`/proyectos/${project.id}`} className="block h-full">
      <Card className="group h-full cursor-pointer transition-[transform,box-shadow,border-color] duration-200 ease-out-strong [@media(hover:hover)]:hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover active:translate-y-0 active:scale-[0.99] active:shadow-card">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{project.category}</Badge>
            <PriorityTag tag={project.priorityTag} />
            {project.isManual && <Badge variant="secondary">Propio</Badge>}
            {project.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{project.tags.length - 3}</span>
            )}
          </div>
          <CardTitle className="mt-1 transition-colors group-hover:text-primary">{project.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Subtareas: {project.checklistDone}/{project.checklistTotal}
            </span>
            <Badge variant={STATUS_BADGE_VARIANT[project.status]}>{PROJECT_STATUS_LABEL[project.status]}</Badge>
          </div>
          <Progress value={progress} />
          {project.assignees.length > 0 && (
            <div className="flex flex-wrap items-center gap-1" aria-label="Responsables">
              {project.assignees.slice(0, 6).map((a) => (
                <span
                  key={a.id}
                  title={a.name}
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: personColor(a) }}
                />
              ))}
              {project.assignees.length > 6 && (
                <span className="text-[10px] text-muted-foreground">+{project.assignees.length - 6}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
