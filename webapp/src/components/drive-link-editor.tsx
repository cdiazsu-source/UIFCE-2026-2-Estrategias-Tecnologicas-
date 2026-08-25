"use client";

import { useState } from "react";
import { FolderOpen, Pencil } from "lucide-react";

import { updateProjectDriveLink } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DriveLinkEditor({ projectId, driveFolderUrl }: { projectId: string; driveFolderUrl: string | null }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateProjectDriveLink(projectId, String(formData.get("driveFolderUrl") ?? ""));
          setEditing(false);
        }}
        className="flex items-center gap-2"
      >
        <Input
          name="driveFolderUrl"
          defaultValue={driveFolderUrl ?? ""}
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

  if (driveFolderUrl) {
    return (
      <div className="flex items-center gap-1">
        <a
          href={driveFolderUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-xs font-medium text-primary hover:bg-accent"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Abrir carpeta de Drive
        </a>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded p-1 text-muted-foreground hover:bg-accent"
          aria-label="Editar enlace de Drive"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-input px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
    >
      <Pencil className="h-3.5 w-3.5" />
      Agregar enlace de Drive
    </button>
  );
}
