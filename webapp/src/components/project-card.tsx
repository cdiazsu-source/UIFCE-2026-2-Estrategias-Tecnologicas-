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
  /** Personas con al menos una subtarea en el proyecto (incluye al responsable). */
  assignees: CardAssignee[];
  /** Responsable del proyecto (asignación a nivel de proyecto), si hay. Da el
   *  color de la franja de la tarjeta. */
  assignee: CardAssignee | null;
  /** Posición en el orden de planeación (CSV / creación). Para el modo de orden
   *  «Orden de planeación» y como desempate estable en «Por urgencia». */
  sortIndex: number;
};

// Etiqueta interna "Base #N": numeral del proyecto en la hoja de planeación
// inicial (ver PROJECT_BASE_NUMERALS en prisma/seed.ts). Se guarda como un tag
// más para no requerir una migración, pero se muestra aparte (no como badge
// libre) y le da a la tarjeta un borde algo más grueso.
const BASE_NUMERAL_TAG = /^Base #(\d+)$/;

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const progress = project.checklistTotal > 0 ? (project.checklistDone / project.checklistTotal) * 100 : 0;

  // Franja de color de la tarjeta: el acento del responsable del proyecto; si no
  // hay, el de la única persona con subtareas. Titila solo cuando el proyecto
  // está en «❗ Atención Inmediata».
  const accentPerson =
    project.assignee ?? (project.assignees.length === 1 ? project.assignees[0] : null);
  const assigned = !!project.assignee || project.assignees.length > 0;
  const accent = accentPerson ? personColor(accentPerson) : null;
  const urgent = assigned && project.priorityTag === "ATENCION_INMEDIATA";

  const baseNumeralMatch = project.tags.map((t) => t.match(BASE_NUMERAL_TAG)).find((m): m is RegExpMatchArray => !!m);
  const baseNumeral = baseNumeralMatch?.[1] ?? null;
  const visibleTags = project.tags.filter((t) => !BASE_NUMERAL_TAG.test(t));

  return (
    <Link href={`/proyectos/${project.id}`} className="block h-full">
      <Card
        className={`group relative h-full cursor-pointer transition-[transform,box-shadow,border-color] duration-200 ease-out-strong [@media(hover:hover)]:hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover active:translate-y-0 active:scale-[0.99] active:shadow-card ${
          baseNumeral ? "border-[1.5px] border-foreground/25" : ""
        }`}
      >
        {assigned && (
          <span
            aria-hidden
            className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${urgent ? "animate-et-blink" : ""}`}
            style={{ backgroundColor: accent ?? "hsl(var(--primary))" }}
          />
        )}
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{project.category}</Badge>
            <PriorityTag tag={project.priorityTag} className={urgent ? "animate-et-blink" : ""} />
            {project.isManual && <Badge variant="secondary">Propio</Badge>}
            {visibleTags.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
            {visibleTags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{visibleTags.length - 3}</span>
            )}
            {baseNumeral && (
              <span
                title="Numeral en la planeación inicial de ET 2026-2"
                className="ml-auto shrink-0 rounded-full border border-foreground/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                Base #{baseNumeral}
              </span>
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
