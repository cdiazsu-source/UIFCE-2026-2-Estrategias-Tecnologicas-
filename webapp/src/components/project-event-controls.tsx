"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock, MapPin, Pencil } from "lucide-react";

import { updateProjectMainProject, updateProjectSchedule } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";
import { formatDayHeader, formatTimeRange, toBogotaInputValue } from "@/lib/utils";

export type MainProjectOption = { id: string; title: string };

export type EventProject = {
  id: string;
  startAt: Date | null;
  endAt: Date | null;
  location: string | null;
  mainProjectId: string | null;
};

/** Fecha/hora/lugar del proyecto-evento y a qué proyecto principal pertenece
 *  (ej. una actividad de la Semana UIFCE). Una sola edición, un solo botón. */
export function ProjectEventControls({
  project,
  candidateMains,
  mainProject,
}: {
  project: EventProject;
  candidateMains: MainProjectOption[];
  mainProject: MainProjectOption | null;
}) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [editing, setEditing] = useState(false);
  const [startAt, setStartAt] = useState(toBogotaInputValue(project.startAt));
  const [endAt, setEndAt] = useState(toBogotaInputValue(project.endAt));
  const [location, setLocation] = useState(project.location ?? "");
  const [mainProjectId, setMainProjectId] = useState(project.mainProjectId ?? "");
  const [isPending, startTransition] = useTransition();

  const hasAnything = project.startAt || project.location || mainProject;

  if (!canEdit && !hasAnything) return null;

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {project.startAt && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDayHeader(project.startAt)} · {formatTimeRange(project.startAt, project.endAt)}
          </span>
        )}
        {project.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {project.location}
          </span>
        )}
        {mainProject && (
          <span>
            Parte de:{" "}
            <Link href={`/proyectos/${mainProject.id}`} className="text-primary hover:underline">
              {mainProject.title}
            </Link>
          </span>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-accent hover:text-accent-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
            {hasAnything ? "Editar horario" : "+ Agregar horario / proyecto principal"}
          </button>
        )}
      </div>
    );
  }

  function save() {
    setEditing(false);
    startTransition(async () => {
      const [u1, u2] = await Promise.all([
        updateProjectSchedule(project.id, { startAt, endAt, location }),
        mainProjectId !== (project.mainProjectId ?? "")
          ? updateProjectMainProject(project.id, mainProjectId)
          : Promise.resolve(undefined),
      ]);
      if (u1) undo(u1);
      if (u2) undo(u2);
    });
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-md border border-dashed border-input bg-card p-3">
      <div className="flex flex-wrap gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Inicio
          <Input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="w-56"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Fin
          <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="w-56" />
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs text-muted-foreground">
          Lugar
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Sala, edificio, aforo…"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Proyecto principal
        <Select value={mainProjectId} onChange={(e) => setMainProjectId(e.target.value)} className="w-full sm:w-80">
          <option value="">Ninguno (proyecto independiente)</option>
          {candidateMains.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </Select>
      </label>
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={isPending} onClick={save}>
          Guardar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
