import Link from "next/link";
import type { ProjectStatus } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PROJECT_STATUS_LABEL } from "@/lib/utils";

const STATUS_BADGE_VARIANT: Record<ProjectStatus, "secondary" | "warning" | "success"> = {
  POR_INICIAR: "secondary",
  EN_CURSO: "warning",
  COMPLETADO: "success",
};

const PRIORITY_BADGE_VARIANT: Record<string, "destructive" | "warning" | "outline"> = {
  CRÍTICO: "destructive",
  PRIORITARIO: "warning",
  NUEVO: "outline",
};

export type ProjectCardData = {
  id: string;
  title: string;
  category: string;
  priorityTag: string | null;
  status: ProjectStatus;
  checklistDone: number;
  checklistTotal: number;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const progress = project.checklistTotal > 0 ? (project.checklistDone / project.checklistTotal) * 100 : 0;

  return (
    <Link href={`/proyectos/${project.id}`} className="block h-full">
      <Card className="group h-full cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg active:translate-y-0 active:scale-[0.99] active:shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{project.category}</Badge>
            {project.priorityTag && (
              <Badge variant={PRIORITY_BADGE_VARIANT[project.priorityTag] ?? "outline"}>{project.priorityTag}</Badge>
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
        </CardContent>
      </Card>
    </Link>
  );
}
