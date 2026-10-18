"use client";

import Link from "next/link";
import type { ProjectStatus } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PriorityTag } from "@/components/priority-tag";
import { cn, PROJECT_STATUS_LABEL } from "@/lib/utils";
import { personColor } from "@/lib/person-color";
import { useUnseenUpdate } from "@/lib/seen-updates";

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
  /** ISO de la nota de bitácora más reciente de OTRA persona (últimos 14 días). Solo se llena en los
   *  proyectos asignados a quien está en sesión; sirve para señalar «novedades». */
  lastUpdateAt: string | null;
};

// Etiqueta interna "Base #N": numeral del proyecto en la hoja de planeación
// inicial (ver PROJECT_BASE_NUMERALS en prisma/seed.ts). Se guarda como un tag
// más para no requerir una migración, pero se muestra aparte (no como badge
// libre) y le da a la tarjeta un borde algo más grueso.
const BASE_NUMERAL_TAG = /^Base #(\d+)$/;

/** Lo que comparten la tarjeta y la fila de la lista. */
function projectMeta(project: ProjectCardData) {
  // Franja de color: el acento del responsable del proyecto; si no hay, el de la única
  // persona con subtareas. Titila solo cuando el proyecto está en «❗ Atención Inmediata».
  const accentPerson = project.assignee ?? (project.assignees.length === 1 ? project.assignees[0] : null);
  const assigned = !!project.assignee || project.assignees.length > 0;
  const accent = accentPerson ? personColor(accentPerson) : null;
  const urgent = assigned && project.priorityTag === "ATENCION_INMEDIATA";

  const baseNumeralMatch = project.tags.map((t) => t.match(BASE_NUMERAL_TAG)).find((m): m is RegExpMatchArray => !!m);
  const baseNumeral = baseNumeralMatch?.[1] ?? null;
  const visibleTags = project.tags.filter((t) => !BASE_NUMERAL_TAG.test(t));
  const progress = project.checklistTotal > 0 ? (project.checklistDone / project.checklistTotal) * 100 : 0;
  return { assigned, accent, urgent, baseNumeral, visibleTags, progress };
}

/** Chip «Con novedades»: hay una nota nueva de la bitácora desde la última visita a este proyecto. */
function NoveltyBadge() {
  return (
    <span
      title="Hay notas nuevas en la bitácora desde la última vez que abriste este proyecto"
      className="animate-et-blink inline-flex items-center gap-1 rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-semibold text-brand-accent-foreground"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-brand-accent-foreground" aria-hidden />
      Con novedades
    </span>
  );
}

/** `mine`: resalta los proyectos asignados a la persona (vista de un Junior). `profileKey`: con él, un
 *  proyecto asignado con notas nuevas sin ver lleva el chip «Con novedades»; si además está en
 *  «Atención Inmediata», la tarjeta titila para llamar la atención. */
export function ProjectCard({
  project,
  mine = false,
  profileKey = null,
}: {
  project: ProjectCardData;
  mine?: boolean;
  profileKey?: string | null;
}) {
  const { assigned, accent, urgent, baseNumeral, visibleTags, progress } = projectMeta(project);
  const unseen = useUnseenUpdate(profileKey, project.id, project.lastUpdateAt) && project.status !== "COMPLETADO";
  const attention = urgent && unseen;

  return (
    <Link href={`/proyectos/${project.id}`} className="block h-full">
      <Card
        className={cn(
          "group relative h-full cursor-pointer transition-[transform,box-shadow,border-color] duration-200 ease-out-strong [@media(hover:hover)]:hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover active:translate-y-0 active:scale-[0.99] active:shadow-card",
          mine && "ring-2 ring-primary",
          baseNumeral && "border-[1.5px] border-foreground/25",
          attention && "animate-et-attention",
        )}
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
            {mine && (
              <span className="rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-semibold text-brand-accent-foreground">
                Asignado a ti
              </span>
            )}
            {unseen && <NoveltyBadge />}
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

/** Lista alternativa a la cuadrícula: un proyecto por fila (título, etiquetas, avance, estado y
 *  responsables), más compacta para recorrer muchos proyectos. Las filas son enlaces de
 *  mínimo 56 px de alto. En pantallas angostas el avance y el estado pasan debajo del título. */
export function ProjectList({
  projects,
  mine = false,
  profileKey = null,
}: {
  projects: ProjectCardData[];
  mine?: boolean;
  profileKey?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div
        aria-hidden
        className="hidden items-center gap-4 border-b border-border bg-accent/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:flex"
      >
        <span className="flex-1">Proyecto</span>
        <span className="w-40">Avance</span>
        <span className="w-28">Estado</span>
        <span className="w-16 text-right">Equipo</span>
      </div>
      <ul className="divide-y divide-border">
        {projects.map((p) => (
          <ProjectRow key={p.id} project={p} mine={mine} profileKey={profileKey} />
        ))}
      </ul>
    </div>
  );
}

function ProjectRow({
  project,
  mine,
  profileKey,
}: {
  project: ProjectCardData;
  mine: boolean;
  profileKey: string | null;
}) {
  const { assigned, accent, urgent, baseNumeral, visibleTags, progress } = projectMeta(project);
  const unseen = useUnseenUpdate(profileKey, project.id, project.lastUpdateAt) && project.status !== "COMPLETADO";
  const attention = urgent && unseen;

  return (
    <li>
      <Link
        href={`/proyectos/${project.id}`}
        className={cn(
          "group relative flex min-h-14 flex-col gap-2 py-3 pl-5 pr-4 outline-none transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-4",
          mine && "bg-primary/5",
          attention && "animate-et-attention [--attn-offset:-3px]",
        )}
      >
        {assigned && (
          <span
            aria-hidden
            className={`absolute bottom-2 left-0 top-2 w-1 rounded-r-full ${urgent ? "animate-et-blink" : ""}`}
            style={{ backgroundColor: accent ?? "hsl(var(--primary))" }}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-medium leading-snug transition-colors group-hover:text-primary">{project.title}</span>
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{project.category}</Badge>
            <PriorityTag tag={project.priorityTag} className={urgent ? "animate-et-blink" : ""} />
            {mine && (
              <span className="rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-semibold text-brand-accent-foreground">
                Asignado a ti
              </span>
            )}
            {unseen && <NoveltyBadge />}
            {project.isManual && <Badge variant="secondary">Propio</Badge>}
            {visibleTags.slice(0, 2).map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
            {visibleTags.length > 2 && <span className="text-[10px] text-muted-foreground">+{visibleTags.length - 2}</span>}
            {baseNumeral && (
              <span
                title="Numeral en la planeación inicial de ET 2026-2"
                className="rounded-full border border-foreground/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                Base #{baseNumeral}
              </span>
            )}
          </span>
        </div>
        <div className="flex flex-col gap-1 sm:w-40">
          <span className="text-xs text-muted-foreground">
            Subtareas: {project.checklistDone}/{project.checklistTotal}
          </span>
          <Progress value={progress} />
        </div>
        <div className="sm:w-28">
          <Badge variant={STATUS_BADGE_VARIANT[project.status]}>{PROJECT_STATUS_LABEL[project.status]}</Badge>
        </div>
        <div className="flex items-center gap-1 sm:w-16 sm:justify-end" aria-label="Responsables">
          {project.assignees.slice(0, 4).map((a) => (
            <span
              key={a.id}
              title={a.name}
              className="h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-black/10"
              style={{ backgroundColor: personColor(a) }}
            />
          ))}
          {project.assignees.length > 4 && (
            <span className="text-[10px] text-muted-foreground">+{project.assignees.length - 4}</span>
          )}
        </div>
      </Link>
    </li>
  );
}
