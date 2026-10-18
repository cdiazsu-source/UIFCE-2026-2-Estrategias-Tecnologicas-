"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";

import { updateProjectLinks } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { useCanEdit } from "@/components/access-context";
import { LinkChips, LinksField } from "@/components/links-field";
import type { NoteLink } from "@/lib/note-links";

/** Enlaces del proyecto en su encabezado: cada uno con el nombre que se le ponga (Drive, Canva,
 *  una página…) y tantos como haga falta. Quien puede editar los cambia con el lápiz; el resto
 *  solo los abre. */
export function ProjectLinks({ projectId, links }: { projectId: string; links: NoteLink[] }) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateProjectLinks(projectId, formData);
          setEditing(false);
        }}
        className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[30rem]"
      >
        <p className="text-xs text-muted-foreground">
          Enlaces del proyecto (Drive, Canva, una página…). Ponle a cada uno el nombre que quieras.
        </p>
        <LinksField defaultValue={links.length > 0 ? links : [{ label: "", url: "" }]} />
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

  if (!canEdit) return <LinkChips links={links} />;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <LinkChips links={links} />
      {links.length === 0 ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-input px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar enlace
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded p-1 text-muted-foreground hover:bg-accent"
          aria-label="Editar enlaces del proyecto"
          title="Editar enlaces"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
