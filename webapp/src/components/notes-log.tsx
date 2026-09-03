"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ListChecks, Pencil, Trash2 } from "lucide-react";
import type { ChecklistItem, ProjectNote } from "@prisma/client";

import { addProjectNote, deleteProjectNote, updateProjectNote } from "@/lib/actions/notes";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { useUndo } from "@/components/undo-banner";
import { BITACORA_TARGET_EVENT } from "@/lib/events";
import { formatDateTime, USER_ROLE_LABEL } from "@/lib/utils";

export type NoteAuthorOption = { id: string; name: string; role: string };
export type ChecklistItemLite = Pick<ChecklistItem, "id" | "text" | "done" | "order">;
export type NoteWithLink = ProjectNote & {
  checklistItem: { id: string; text: string; done: boolean } | null;
};

function noteMeta(note: Pick<ProjectNote, "author" | "authorRole" | "createdAt">) {
  return [note.author, note.authorRole, formatDateTime(note.createdAt)].filter(Boolean).join(" · ");
}

function shorten(text: string, max = 70) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function ChecklistItemSelect({
  items,
  name,
  controlledValue,
  defaultValue,
  onChange,
}: {
  items: ChecklistItemLite[];
  name: string;
  /** Modo controlado (formulario de alta): el estado vive en el padre. */
  controlledValue?: string;
  onChange?: (v: string) => void;
  /** Modo no controlado (formulario de edición): valor inicial y ya. */
  defaultValue?: string;
}) {
  if (items.length === 0) return null;
  const ordered = [...items].sort((a, b) => a.order - b.order);
  const controlled = onChange !== undefined;
  return (
    <Select
      name={name}
      className="w-full sm:w-72"
      aria-label="Subtarea relacionada"
      {...(controlled
        ? { value: controlledValue ?? "", onChange: (e) => onChange!(e.target.value) }
        : { defaultValue: defaultValue ?? "" })}
    >
      <option value="">Sin subtarea (nota general)</option>
      {ordered.map((it) => (
        <option key={it.id} value={it.id}>
          {it.done ? "✓ " : ""}
          {shorten(it.text)}
        </option>
      ))}
    </Select>
  );
}

function LinkedItemTag({ item }: { item: { text: string; done: boolean } }) {
  return (
    <span className="mt-1.5 inline-flex max-w-full items-start gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs text-primary">
      {item.done ? (
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      ) : (
        <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      <span className="min-w-0 break-words">
        Subtarea: <span className={item.done ? "line-through" : undefined}>{item.text}</span>
      </span>
    </span>
  );
}

function NoteRow({
  note,
  projectId,
  checklistItems,
}: {
  note: NoteWithLink;
  projectId: string;
  checklistItems: ChecklistItemLite[];
}) {
  const undo = useUndo();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="rounded-md bg-muted/40 p-3">
        <form
          action={async (formData) => {
            const u = await updateProjectNote(note.id, projectId, formData);
            if (u) undo(u);
            setEditing(false);
          }}
          className="flex flex-col gap-2"
        >
          <Textarea name="body" defaultValue={note.body} required />
          <ChecklistItemSelect
            name="checklistItemId"
            items={checklistItems}
            defaultValue={note.checklistItemId ?? ""}
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
      </li>
    );
  }

  return (
    <li className="group relative rounded-md bg-muted/40 p-3">
      <p className="whitespace-pre-line break-words text-sm leading-snug">{note.body}</p>
      {note.checklistItem && <LinkedItemTag item={note.checklistItem} />}
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
            startTransition(async () => {
              const u = await deleteProjectNote(note.id, projectId);
              if (u) undo(u);
            });
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
  checklistItems,
}: {
  projectId: string;
  notes: NoteWithLink[];
  authors: NoteAuthorOption[];
  checklistItems: ChecklistItemLite[];
}) {
  const sorted = [...notes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const [targetItemId, setTargetItemId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function onTarget(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      if (typeof id !== "string") return;
      setTargetItemId(id);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      bodyRef.current?.focus();
    }
    window.addEventListener(BITACORA_TARGET_EVENT, onTarget);
    return () => window.removeEventListener(BITACORA_TARGET_EVENT, onTarget);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Bitácora
          <InfoHint text="El historial de avance de este proyecto. Cada nota la deja alguien del equipo (se elige de la lista) y queda con su nombre, su cargo y la fecha, de la más reciente a la más antigua. Se puede vincular a una subtarea del checklist para seguirla ordenada, y editar o borrar con los botones que aparecen al pasar el cursor. Es lo que alimenta 'Últimas actualizaciones' del panel principal." />
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
            ref={formRef}
            action={async (formData) => {
              await addProjectNote(projectId, formData);
              formRef.current?.reset();
              setTargetItemId("");
            }}
            className="flex flex-col gap-2"
          >
            <Textarea
              ref={bodyRef}
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
              <ChecklistItemSelect
                name="checklistItemId"
                items={checklistItems}
                controlledValue={targetItemId}
                onChange={setTargetItemId}
              />
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
              <NoteRow
                key={note.id}
                note={note}
                projectId={projectId}
                checklistItems={checklistItems}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
