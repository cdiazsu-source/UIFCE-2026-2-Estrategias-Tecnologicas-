"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { ProjectNote } from "@prisma/client";

import { addProjectNote, deleteProjectNote, updateProjectNote } from "@/lib/actions/notes";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { formatDateTime, USER_ROLE_LABEL } from "@/lib/utils";

export type NoteAuthorOption = { id: string; name: string; role: string };

function noteMeta(note: Pick<ProjectNote, "author" | "authorRole" | "createdAt">) {
  return [note.author, note.authorRole, formatDateTime(note.createdAt)].filter(Boolean).join(" · ");
}

function NoteRow({ note, projectId }: { note: ProjectNote; projectId: string }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="rounded-md bg-muted/40 p-3">
        <form
          action={async (formData) => {
            await updateProjectNote(note.id, projectId, formData);
            setEditing(false);
          }}
          className="flex flex-col gap-2"
        >
          <Textarea name="body" defaultValue={note.body} required />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Guardar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group relative rounded-md bg-muted/40 p-3">
      <p className="whitespace-pre-line break-words text-sm leading-snug">{note.body}</p>
      <p className="mt-1 text-xs text-muted-foreground">{noteMeta(note)}</p>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded p-1 text-muted-foreground hover:bg-accent"
          aria-label="Editar nota"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!window.confirm("¿Eliminar esta nota de la bitácora?")) return;
            startTransition(() => deleteProjectNote(note.id, projectId));
          }}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
          aria-label="Eliminar nota"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

export function NotesLog({
  projectId,
  notes,
  authors,
}: {
  projectId: string;
  notes: ProjectNote[];
  authors: NoteAuthorOption[];
}) {
  const sorted = [...notes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Bitácora
          <InfoHint text="El historial de avance de este proyecto. Cada nota la deja alguien del equipo (se elige de la lista) y queda con su nombre, su cargo y la fecha, de la más reciente a la más antigua. Se puede editar o borrar con los botones que aparecen al pasar el cursor. Es lo que alimenta 'Últimas actualizaciones' del panel principal." />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {authors.length === 0 ? (
          <p className="rounded-md border border-dashed border-input p-3 text-sm text-muted-foreground">
            Para dejar notas primero agrega personas en la sección{" "}
            <a href="/equipo" className="text-primary hover:underline">
              Equipo
            </a>
            .
          </p>
        ) : (
          <form
            action={async (formData) => {
              await addProjectNote(projectId, formData);
              (document.getElementById("notes-form") as HTMLFormElement | null)?.reset();
            }}
            id="notes-form"
            className="flex flex-col gap-2"
          >
            <Textarea
              name="body"
              placeholder="Escribe una nota nueva sobre el avance de este proyecto…"
              required
            />
            <div className="flex flex-wrap items-center gap-2">
              <Select name="authorId" defaultValue="" required className="w-64">
                <option value="" disabled>
                  ¿Quién deja la nota?
                </option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {USER_ROLE_LABEL[a.role] ?? a.role}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm">
                Publicar nota
              </Button>
            </div>
          </form>
        )}

        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay notas en la bitácora de este proyecto.</p>
        ) : (
          <ul className="flex flex-col gap-3 border-t border-border pt-3">
            {sorted.map((note) => (
              <NoteRow key={note.id} note={note} projectId={projectId} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
