"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import type { Project } from "@prisma/client";

import { deleteManualProject, updateProjectContent, updateProjectTags } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";

function TagsEditor({ project }: { project: Project }) {
  const undo = useUndo();
  const [tags, setTags] = useState<string[]>(project.tags);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  function commit(next: string[]) {
    const clean = Array.from(new Set(next.map((t) => t.trim()).filter(Boolean))).slice(0, 12);
    setTags(clean);
    startTransition(async () => {
      const u = await updateProjectTags(project.id, clean);
      if (u) undo(u);
    });
  }

  function addDraft() {
    const parts = draft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    commit([...tags, ...parts]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Tag className="h-3.5 w-3.5" />
        Etiquetas
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
          >
            {t}
            <button
              type="button"
              onClick={() => commit(tags.filter((x) => x !== t))}
              disabled={isPending}
              className="rounded-full text-muted-foreground hover:text-destructive disabled:opacity-40"
              aria-label={`Quitar etiqueta ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addDraft();
              }
            }}
            placeholder="Nueva etiqueta"
            className="h-7 w-36 text-xs"
          />
          <button
            type="button"
            onClick={addDraft}
            disabled={isPending || draft.trim().length === 0}
            className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-40"
            aria-label="Agregar etiqueta"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>
    </div>
  );
}

export function ProjectControls({ project }: { project: Project }) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [editing, setEditing] = useState(false);

  if (!canEdit) return null;

  return (
    <div className="flex w-full flex-col gap-4">
      <TagsEditor key={project.tags.join("")} project={project} />

      {!editing ? (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Editar contenido
          </Button>
          {project.isManual && (
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
          )}
        </div>
      ) : (
        <form
          action={async (formData) => {
            const u = await updateProjectContent(project.id, formData);
            if (u) undo(u);
            setEditing(false);
          }}
          className="flex w-full flex-col gap-2 rounded-md border border-dashed border-input bg-card p-4"
        >
          <div className="flex flex-wrap gap-2">
            <Input name="title" defaultValue={project.title} placeholder="Título" className="min-w-[16rem] flex-1" />
            <Input
              name="category"
              defaultValue={project.category}
              placeholder="Categoría"
              className="min-w-[14rem] flex-1"
            />
            <Select name="priorityTag" defaultValue={project.priorityTag ?? ""} className="w-40">
              <option value="">Sin etiqueta</option>
              <option value="CRÍTICO">Crítico</option>
              <option value="PRIORITARIO">Prioritario</option>
              <option value="NUEVO">Nuevo</option>
            </Select>
          </div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Qué se debe hacer
          </label>
          <Textarea name="description" defaultValue={project.description} className="min-h-[70px]" />
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qué se espera</label>
          <Textarea name="expectedOutcome" defaultValue={project.expectedOutcome} className="min-h-[70px]" />
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fundamento</label>
          <Textarea name="rationale" defaultValue={project.rationale} className="min-h-[70px]" />
          {!project.isManual && (
            <p className="text-xs text-muted-foreground">
              Este proyecto viene del CSV de planeación. Al guardar, sus textos quedan marcados como editados en la app
              y el resync deja de sobrescribirlos.
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Guardar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
