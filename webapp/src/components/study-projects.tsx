"use client";

import { useState, useTransition } from "react";
import { CalendarClock, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import type { CheckpointStatus, StudyCheckpoint, StudyProject } from "@prisma/client";

import {
  createStudyProject,
  deleteStudyProject,
  setCheckpointStatus,
  updateCheckpoint,
  updateStudyProject,
  updateStudyProjectDrive,
} from "@/lib/actions/study";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { PersonAvatar } from "@/components/person-avatar";
import { useCanEdit } from "@/components/access-context";
import { CHECKPOINT_STATUS_LABEL, formatDate, USER_ROLE_LABEL } from "@/lib/utils";
import { personColor } from "@/lib/person-color";

const STATUS_OPTIONS: CheckpointStatus[] = ["PENDIENTE", "EN_CURSO", "CUMPLIDO", "ATRASADO"];

const STATUS_BADGE_VARIANT: Record<CheckpointStatus, "secondary" | "warning" | "success" | "destructive"> = {
  PENDIENTE: "secondary",
  EN_CURSO: "warning",
  CUMPLIDO: "success",
  ATRASADO: "destructive",
};

export type StudyProjectFull = StudyProject & { checkpoints: StudyCheckpoint[] };
export type JuniorWithStudy = {
  id: string;
  name: string;
  role: string;
  color?: string | null;
  photoUrl?: string | null;
  studyProjects: StudyProjectFull[];
};
export type JuniorOption = { id: string; name: string };

/** Enlace a la carpeta de Drive donde el Junior sube los entregables. */
function StudyDriveLink({ project }: { project: StudyProjectFull }) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);

  const link = project.driveFolderUrl ? (
    <a
      href={project.driveFolderUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-xs font-medium text-primary hover:bg-accent"
    >
      <FolderOpen className="h-3.5 w-3.5" />
      Abrir carpeta de entregables
    </a>
  ) : null;

  if (!canEdit) return link;

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateStudyProjectDrive(project.id, String(formData.get("driveFolderUrl") ?? ""));
          setEditing(false);
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <Input
          name="driveFolderUrl"
          defaultValue={project.driveFolderUrl ?? ""}
          placeholder="https://drive.google.com/..."
          className="h-8 w-64 text-sm"
          autoFocus
        />
        <Button type="submit" size="sm">
          Guardar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {link ?? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-input px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          <Pencil className="h-3.5 w-3.5" />
          Agregar enlace de Drive (entregables)
        </button>
      )}
      {link && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded p-1 text-muted-foreground hover:bg-accent"
          aria-label="Editar enlace de Drive"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function CheckpointRow({ checkpoint }: { checkpoint: StudyCheckpoint }) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing && canEdit) {
    return (
      <form
        action={async (formData) => {
          await updateCheckpoint(checkpoint.id, formData);
          setEditing(false);
        }}
        className="flex flex-col gap-2 rounded-md border border-border p-3"
      >
        <div className="flex flex-wrap gap-2">
          <Input name="label" defaultValue={checkpoint.label} placeholder="Nombre del corte" className="w-44" />
          <Input
            type="date"
            name="dueDate"
            defaultValue={checkpoint.dueDate ? checkpoint.dueDate.toISOString().slice(0, 10) : ""}
            className="w-40"
          />
          <Select name="status" defaultValue={checkpoint.status} className="w-36">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {CHECKPOINT_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <Input name="notes" defaultValue={checkpoint.notes ?? ""} placeholder="Notas / observaciones del corte" />
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            Guardar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <li className="group flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {checkpoint.number}
      </span>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{checkpoint.label}</span>
          <Badge variant={STATUS_BADGE_VARIANT[checkpoint.status]}>{CHECKPOINT_STATUS_LABEL[checkpoint.status]}</Badge>
          {checkpoint.dueDate && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              {formatDate(checkpoint.dueDate)}
            </span>
          )}
        </div>
        {checkpoint.notes && <p className="mt-0.5 text-xs text-muted-foreground">{checkpoint.notes}</p>}
        {canEdit && (
          <div className="mt-1 flex flex-wrap gap-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => startTransition(() => setCheckpointStatus(checkpoint.id, s))}
                className={
                  "rounded border px-1.5 py-0.5 text-[11px] transition-colors " +
                  (s === checkpoint.status
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent")
                }
              >
                {CHECKPOINT_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
          aria-label="Editar punto de corte"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

function StudyProjectCard({ project }: { project: StudyProjectFull }) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();
  const checkpoints = [...project.checkpoints].sort((a, b) => a.number - b.number);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        {editing && canEdit ? (
          <form
            action={async (formData) => {
              await updateStudyProject(project.id, formData);
              setEditing(false);
            }}
            className="flex w-full flex-col gap-2"
          >
            <Input name="title" defaultValue={project.title} placeholder="Título del proyecto de estudio" />
            <Textarea name="description" defaultValue={project.description ?? ""} placeholder="Descripción" className="min-h-[60px]" />
            <Textarea
              name="schedule"
              defaultValue={project.schedule ?? ""}
              placeholder="Cronograma: hitos, fechas y entregas parciales"
              className="min-h-[70px]"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Guardar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <>
            <CardTitle className="text-base leading-snug">{project.title}</CardTitle>
            {canEdit && (
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded p-1 text-muted-foreground hover:bg-accent"
                  aria-label="Editar proyecto de estudio"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => startTransition(() => deleteStudyProject(project.id))}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Eliminar proyecto de estudio"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </CardHeader>
      {!(editing && canEdit) && (
        <CardContent className="flex flex-col gap-4">
          {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cronograma</p>
            {project.schedule ? (
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{project.schedule}</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Sin cronograma definido todavía.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Puntos de corte ({checkpoints.filter((c) => c.status === "CUMPLIDO").length}/{checkpoints.length})
            </p>
            <ul className="mt-1 flex flex-col divide-y divide-border">
              {checkpoints.map((c) => (
                <CheckpointRow key={c.id} checkpoint={c} />
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entregables</p>
            <div className="mt-1">
              <StudyDriveLink project={project} />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function StudyProjects({
  juniors,
  juniorOptions,
}: {
  juniors: JuniorWithStudy[];
  juniorOptions: JuniorOption[];
}) {
  const canEdit = useCanEdit();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-3.5 w-3.5" />
            Agregar proyecto de estudio
          </Button>
        </div>
      )}

      {canEdit && showForm && (
        <form
          action={async (formData) => {
            await createStudyProject(formData);
            (document.getElementById("study-add-form") as HTMLFormElement | null)?.reset();
            setShowForm(false);
          }}
          id="study-add-form"
          className="flex flex-col gap-2 rounded-md border border-dashed border-input p-4"
        >
          <div className="flex flex-wrap gap-2">
            <Select name="ownerId" defaultValue="" required className="w-52">
              <option value="" disabled>
                ¿De qué Junior?
              </option>
              {juniorOptions.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </Select>
            <Input name="title" placeholder="Título del proyecto de estudio" required className="min-w-[18rem] flex-1" />
          </div>
          <Textarea name="description" placeholder="Descripción (opcional)" className="min-h-[60px]" />
          <Textarea name="schedule" placeholder="Cronograma (opcional): hitos, fechas y entregas parciales" className="min-h-[70px]" />
          <div>
            <Button type="submit" size="sm">
              Crear (con sus 4 puntos de corte)
            </Button>
          </div>
        </form>
      )}

      {juniorOptions.length === 0 && (
        <p className="rounded-md border border-dashed border-input p-4 text-sm text-muted-foreground">
          Todavía no hay monitores Junior en el <a href="/equipo" className="text-primary hover:underline">Equipo</a>.
          Agrégalos allí (rol Junior — Artes o Junior — Auxiliar) para poder registrar sus proyectos de estudio.
        </p>
      )}

      {juniors.map((junior) => {
        const color = personColor(junior);
        return (
          <section
            key={junior.id}
            className="flex flex-col gap-3 border-l-2 pl-4"
            style={{ borderColor: color }}
          >
            <div className="flex items-center gap-2.5">
              <PersonAvatar name={junior.name} photoUrl={junior.photoUrl ?? null} />
              <h2 className="text-lg font-semibold">{junior.name}</h2>
              <Badge variant="outline">{USER_ROLE_LABEL[junior.role]}</Badge>
              {junior.studyProjects.length !== 1 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {junior.studyProjects.length} de 1 proyecto
                  <InfoHint text="Cada Junior expone un proyecto de estudio por semestre. Este número no coincide con 1 — revísalo." />
                </span>
              )}
            </div>
            {junior.studyProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin proyecto de estudio todavía.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {junior.studyProjects.map((p) => (
                  <StudyProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
