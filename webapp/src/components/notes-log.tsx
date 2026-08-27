"use client";

import type { ProjectNote } from "@prisma/client";

import { addProjectNote } from "@/lib/actions/notes";
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
          <InfoHint text="El historial de avance de este proyecto. Cada nota la deja alguien del equipo (se elige de la lista) y queda con su nombre, su cargo y la fecha, de la más reciente a la más antigua. Es lo que alimenta 'Últimas actualizaciones' del panel principal." />
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
              <li key={note.id} className="rounded-md bg-muted/40 p-3">
                <p className="whitespace-pre-line text-sm leading-snug">{note.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{noteMeta(note)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
