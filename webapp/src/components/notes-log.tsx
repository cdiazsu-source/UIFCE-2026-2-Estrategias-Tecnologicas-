"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ExternalLink, Link2, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import type { ChecklistItem, ProjectNote } from "@prisma/client";

import { addProjectNote, deleteProjectNote, updateProjectNote } from "@/lib/actions/notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { CollapseToggle, useCollapse } from "@/components/collapsible";
import { MentionPicker, MentionTags } from "@/components/mention-picker";
import { useUndo } from "@/components/undo-banner";
import { BITACORA_FOCUS_NOTE_EVENT, BITACORA_TARGET_EVENT } from "@/lib/events";
import { linkDisplay, NOTE_LINKS_MAX, parseNoteLinks, type NoteLink } from "@/lib/note-links";
import { formatDateTime, USER_ROLE_LABEL } from "@/lib/utils";

export type NoteAuthorOption = { id: string; name: string; role: string; color?: string | null };
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

/** Apartado «Enlaces»: filas de nombre (opcional) + URL. Los campos paralelos
 *  linkLabel / linkUrl los lee el servidor; las filas sin URL válida se descartan. */
function LinksField({ defaultValue = [] }: { defaultValue?: NoteLink[] }) {
  const seq = useRef(0);
  const [rows, setRows] = useState(() => defaultValue.map((l) => ({ key: seq.current++, ...l })));

  return (
    <div className="flex flex-col gap-2">
      {rows.length > 0 && (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.key} className="flex flex-wrap items-center gap-2">
              <Input
                name="linkLabel"
                defaultValue={r.label}
                placeholder="Nombre (ej. Carpeta de Drive)"
                aria-label="Nombre del enlace"
                maxLength={80}
                className="w-full sm:w-56"
              />
              <Input
                name="linkUrl"
                type="url"
                defaultValue={r.url}
                placeholder="https://…"
                aria-label="Dirección del enlace"
                className="min-w-[14rem] flex-1"
              />
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Quitar enlace"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {rows.length < NOTE_LINKS_MAX && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => setRows((rs) => [...rs, { key: seq.current++, label: "", url: "" }])}
        >
          <Plus className="h-3.5 w-3.5" />
          {rows.length === 0 ? "Agregar enlace" : "Agregar otro enlace"}
        </Button>
      )}
    </div>
  );
}

function NoteLinks({ links }: { links: NoteLink[] }) {
  if (links.length === 0) return null;
  return (
    <ul className="mt-1.5 flex flex-wrap gap-1.5">
      {links.map((l, i) => (
        <li key={i} className="max-w-full">
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            title={l.url}
            className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-link hover:bg-accent"
          >
            <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="min-w-0 truncate">{linkDisplay(l)}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
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
  authors,
}: {
  note: NoteWithLink;
  projectId: string;
  checklistItems: ChecklistItemLite[];
  authors: NoteAuthorOption[];
}) {
  const undo = useUndo();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li id={`nota-${note.id}`} className="rounded-md bg-muted/40 p-3">
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
          <LinksField defaultValue={parseNoteLinks(note.links)} />
          <MentionPicker name="mentionIds" people={authors} defaultValue={note.mentionIds} />
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

  const mentioned = authors.filter((a) => note.mentionIds.includes(a.id));

  return (
    <li id={`nota-${note.id}`} className="group relative rounded-md bg-muted/40 p-3 transition-shadow">
      <p className="whitespace-pre-line break-words text-sm leading-snug">{note.body}</p>
      <NoteLinks links={parseNoteLinks(note.links)} />
      {note.checklistItem && <LinkedItemTag item={note.checklistItem} />}
      {mentioned.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          <MentionTags people={mentioned} />
        </p>
      )}
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
  const [addKey, setAddKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const { open, setOpen, toggle } = useCollapse("project:bitacora");

  useEffect(() => {
    function onTarget(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      if (typeof id !== "string") return;
      setTargetItemId(id);
      // Si la sección estaba contraída, se abre y se espera a que pinte el formulario.
      setOpen(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        bodyRef.current?.focus();
      }, 50);
    }
    // Desde la tarjeta de entradas de una subtarea: abre la bitácora, va a la nota y la resalta.
    function onFocusNote(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      if (typeof id !== "string") return;
      setOpen(true);
      setTimeout(() => {
        const el = document.getElementById(`nota-${id}`);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary/60");
        setTimeout(() => el.classList.remove("ring-2", "ring-primary/60"), 1800);
      }, 60);
    }
    window.addEventListener(BITACORA_TARGET_EVENT, onTarget);
    window.addEventListener(BITACORA_FOCUS_NOTE_EVENT, onFocusNote);
    return () => {
      window.removeEventListener(BITACORA_TARGET_EVENT, onTarget);
      window.removeEventListener(BITACORA_FOCUS_NOTE_EVENT, onFocusNote);
    };
  }, [setOpen]);

  return (
    <Card>
      <CardHeader className={open ? "" : "py-3"}>
        <CardTitle className="flex items-center gap-1.5">
          <CollapseToggle open={open} onToggle={toggle} label="la bitácora" />
          Bitácora
          <InfoHint text="El historial de avance del proyecto, de la nota más reciente a la más antigua. Cómo se usa: escribe la nota, elige quién la deja (lista de Equipo), si aplica la subtarea relacionada, y con «Etiquetar a…» marca a quién involucra; «Agregar enlace» guarda carpetas de Drive, documentos o formularios como vínculos con nombre que se abren en otra pestaña (mejor que pegar la URL dentro del texto); al pasar el cursor sobre una nota aparecen editar y borrar. Alimenta «Últimas actualizaciones» del panel. Ejemplo: «Confirmado que la licencia de Adobe sigue vigente hasta diciembre. @ Maria Fernanda Celis», con el enlace «Correo de confirmación»." />
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="flex flex-col gap-4">
        {authors.length === 0 ? (
          <p className="rounded-md border border-dashed border-input p-3 text-sm text-muted-foreground">
            Para dejar notas primero agrega personas en la sección{" "}
            <a href="/equipo" className="text-link hover:underline">
              Equipo
            </a>
            .
          </p>
        ) : (
          <form
            key={addKey}
            ref={formRef}
            action={async (formData) => {
              await addProjectNote(projectId, formData);
              setTargetItemId("");
              setAddKey((k) => k + 1);
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
            </div>
            <LinksField />
            <MentionPicker name="mentionIds" people={authors} />
            <Button type="submit" size="sm" className="self-start">
              Publicar nota
            </Button>
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
                authors={authors}
              />
            ))}
          </ul>
        )}
      </CardContent>}
    </Card>
  );
}
