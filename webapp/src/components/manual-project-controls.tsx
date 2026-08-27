"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Project } from "@prisma/client";

import { deleteManualProject, updateProjectContent } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ManualProjectControls({ project }: { project: Project }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Editar contenido
        </Button>
        <form action={deleteManualProject.bind(null, project.id)}>
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </Button>
        </form>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await updateProjectContent(project.id, formData);
        setEditing(false);
      }}
      className="flex w-full flex-col gap-2 rounded-md border border-dashed border-input bg-card p-4"
    >
      <div className="flex flex-wrap gap-2">
        <Input name="title" defaultValue={project.title} placeholder="Título" className="min-w-[16rem] flex-1" />
        <Input name="category" defaultValue={project.category} placeholder="Categoría" className="min-w-[14rem] flex-1" />
        <Select name="priorityTag" defaultValue={project.priorityTag ?? ""} className="w-40">
          <option value="">Sin etiqueta</option>
          <option value="CRÍTICO">Crítico</option>
          <option value="PRIORITARIO">Prioritario</option>
          <option value="NUEVO">Nuevo</option>
        </Select>
      </div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qué se debe hacer</label>
      <Textarea name="description" defaultValue={project.description} className="min-h-[70px]" />
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qué se espera</label>
      <Textarea name="expectedOutcome" defaultValue={project.expectedOutcome} className="min-h-[70px]" />
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fundamento</label>
      <Textarea name="rationale" defaultValue={project.rationale} className="min-h-[70px]" />
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
