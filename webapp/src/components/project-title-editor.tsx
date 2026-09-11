"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";

import { renameProject } from "@/lib/actions/projects";
import { Input } from "@/components/ui/input";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";

/** Título del proyecto: un clic para renombrar, sin abrir «Editar contenido».
 *  Cualquier sesión que no sea el perfil Junior puede usarlo. Enter o salir del
 *  campo guarda; Escape cancela. */
export function ProjectTitleEditor({ project }: { project: { id: string; title: string } }) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(project.title);
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    return <h1 className="text-2xl font-bold leading-tight">{project.title}</h1>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(project.title);
          setEditing(true);
        }}
        className="group flex items-center gap-2 text-left"
        aria-label="Renombrar proyecto"
      >
        <h1 className="text-2xl font-bold leading-tight">{project.title}</h1>
        <Pencil className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }

  function save() {
    setEditing(false);
    const next = value.trim();
    if (!next || next === project.title) return;
    startTransition(async () => {
      const u = await renameProject(project.id, next);
      if (u) undo(u);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex max-w-xl items-center gap-2"
    >
      <Input
        autoFocus
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Nombre del proyecto"
        className="h-auto py-1 text-2xl font-bold"
      />
    </form>
  );
}
