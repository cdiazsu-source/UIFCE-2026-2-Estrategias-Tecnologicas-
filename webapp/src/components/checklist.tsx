"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, MessageSquarePlus, Pencil, Plus, Trash2 } from "lucide-react";
import type { ChecklistItem } from "@prisma/client";

import {
  addChecklistItem,
  deleteChecklistItem,
  moveChecklistItem,
  toggleChecklistItem,
  updateChecklistItem,
} from "@/lib/actions/checklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { MentionPicker, MentionTags } from "@/components/mention-picker";
import { cn, formatDate } from "@/lib/utils";
import { personColor } from "@/lib/person-color";
import { BITACORA_TARGET_EVENT } from "@/lib/events";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";

export type PersonOption = { id: string; name: string; color?: string | null };

function AssigneeSelect({ people, defaultValue }: { people: PersonOption[]; defaultValue?: string | null }) {
  return (
    <Select name="assigneeId" defaultValue={defaultValue ?? ""} className="w-52">
      <option value="">Sin responsable</option>
      {people.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </Select>
  );
}

function AssigneeTag({ item, people }: { item: ChecklistItem; people: PersonOption[] }) {
  if (!item.assignee && !item.assigneeId) return null;
  const person = item.assigneeId ? people.find((p) => p.id === item.assigneeId) : undefined;
  const color = person ? personColor(person) : "hsl(var(--muted-foreground))";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span style={person ? { color } : undefined}>{person?.name ?? item.assignee}</span>
    </span>
  );
}

function ChecklistRow({
  item,
  projectId,
  people,
  isFirst,
  isLast,
}: {
  item: ChecklistItem;
  projectId: string;
  people: PersonOption[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing && canEdit) {
    return (
      <form
        action={async (formData) => {
          const u = await updateChecklistItem(item.id, projectId, formData);
          if (u) undo(u);
          setEditing(false);
        }}
        className="flex flex-col gap-2 rounded-md border border-border p-3"
      >
        <Input name="text" defaultValue={item.text} />
        <div className="flex flex-wrap gap-2">
          <AssigneeSelect people={people} defaultValue={item.assigneeId} />
          <Input
            type="date"
            name="dueDate"
            defaultValue={item.dueDate ? item.dueDate.toISOString().slice(0, 10) : ""}
            className="w-40"
          />
        </div>
        <MentionPicker name="mentionIds" people={people} defaultValue={item.mentionIds} />
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

  return (
    <li className="group flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
      <input
        type="checkbox"
        checked={item.done}
        disabled={isPending || !canEdit}
        onChange={(e) => {
          if (!canEdit) return;
          const done = e.target.checked;
          startTransition(async () => {
            const u = await toggleChecklistItem(item.id, projectId, done);
            if (u) undo(u);
          });
        }}
        className="mt-1 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
      />
      <div className="flex-1">
        <p className={cn("whitespace-pre-line break-words text-sm", item.done && "text-muted-foreground line-through")}>
          {item.text}
        </p>
        {(item.assignee || item.assigneeId || item.dueDate || item.mentionIds.length > 0) && (
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
            <AssigneeTag item={item} people={people} />
            {(item.assignee || item.assigneeId) && item.dueDate && <span>·</span>}
            {item.dueDate && <span>vence {formatDate(item.dueDate)}</span>}
            {item.mentionIds.length > 0 && (item.assignee || item.assigneeId || item.dueDate) && <span>·</span>}
            <MentionTags people={people.filter((p) => item.mentionIds.includes(p.id))} />
          </p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent(BITACORA_TARGET_EVENT, { detail: item.id }))
          }
          className="rounded p-1 text-muted-foreground hover:bg-accent"
          aria-label="Dar una actualización de esta subtarea en la bitácora"
          title="Actualizar en bitácora"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
        </button>
        {canEdit && (
          <>
            <button
              type="button"
              disabled={isFirst}
              onClick={() => startTransition(() => moveChecklistItem(item.id, projectId, "up"))}
              className="rounded p-1 text-muted-foreground hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
              aria-label="Subir subtarea"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => startTransition(() => moveChecklistItem(item.id, projectId, "down"))}
              className="rounded p-1 text-muted-foreground hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
              aria-label="Bajar subtarea"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setEditing(true)} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Editar subtarea">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  const u = await deleteChecklistItem(item.id, projectId);
                  if (u) undo(u);
                })
              }
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Eliminar subtarea"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export function Checklist({
  projectId,
  items,
  people,
}: {
  projectId: string;
  items: ChecklistItem[];
  people: PersonOption[];
}) {
  const canEdit = useCanEdit();
  const [showForm, setShowForm] = useState(false);
  const [addKey, setAddKey] = useState(0);
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const done = sorted.filter((i) => i.done).length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-1.5">
          Checklist{" "}
          <span className="font-normal text-muted-foreground">
            ({done}/{sorted.length})
          </span>
          <InfoHint text="Las subtareas de este proyecto. Cómo se usa: la casilla marca hecho, las flechas ▲▼ reordenan, el lápiz edita (texto, responsable del Equipo, vencimiento y personas etiquetadas) y el globo abre la bitácora ligada a esa subtarea. «Agregar subtarea» suma una nueva. Ejemplo: «Calendario editorial 2026-2 · Maria Fernanda Celis · vence 20 sep · @ Cesar Diaz»." />
        </CardTitle>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-3.5 w-3.5" />
            Agregar subtarea
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {canEdit && showForm && (
          <form
            key={addKey}
            action={async (formData) => {
              await addChecklistItem(projectId, formData);
              setAddKey((k) => k + 1);
            }}
            className="flex flex-col gap-2 rounded-md border border-dashed border-input p-3"
          >
            <Input name="text" placeholder="Descripción de la subtarea" required />
            <div className="flex flex-wrap gap-2">
              <AssigneeSelect people={people} />
              <Input type="date" name="dueDate" className="w-40" />
            </div>
            <MentionPicker name="mentionIds" people={people} />
            <Button type="submit" size="sm" className="self-start">
              Agregar
            </Button>
          </form>
        )}

        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este proyecto todavía no tiene subtareas.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {sorted.map((item, i) => (
              <ChecklistRow
                key={item.id}
                item={item}
                projectId={projectId}
                people={people}
                isFirst={i === 0}
                isLast={i === sorted.length - 1}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
