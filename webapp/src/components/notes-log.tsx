"use client";

import type { ProjectNote } from "@prisma/client";

import { addProjectNote } from "@/lib/actions/notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { formatDateTime } from "@/lib/utils";

export function NotesLog({ projectId, notes }: { projectId: string; notes: ProjectNote[] }) {
  const sorted = [...notes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Bitácora
          <InfoHint text="El historial de avance de este proyecto, en texto libre. Cada nota queda con fecha y quién la escribió, de la más reciente a la más antigua — es lo que alimenta el feed de 'Actividad' del panel principal." />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          action={async (formData) => {
            await addProjectNote(projectId, formData);
            (document.getElementById("notes-form") as HTMLFormElement | null)?.reset();
          }}
          id="notes-form"
          className="flex flex-col gap-2"
        >
          <Textarea name="body" placeholder="Escribe una nota nueva sobre el avance de este proyecto…" required />
          <div className="flex items-center gap-2">
            <Input name="author" placeholder="Tu nombre" required className="w-48" />
            <Button type="submit" size="sm">
              Publicar nota
            </Button>
          </div>
        </form>

        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay notas en la bitácora de este proyecto.</p>
        ) : (
          <ul className="flex flex-col gap-3 border-t border-border pt-3">
            {sorted.map((note) => (
              <li key={note.id} className="rounded-md bg-muted/40 p-3">
                <p className="text-sm leading-snug">{note.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.author} · {formatDateTime(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
