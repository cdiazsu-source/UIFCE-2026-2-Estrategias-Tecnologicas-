"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { ChecklistItem } from "@prisma/client";

import { addChecklistItem, deleteChecklistItem, toggleChecklistItem, updateChecklistItem } from "@/lib/actions/checklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { cn, formatDate } from "@/lib/utils";

function ChecklistRow({ item, projectId }: { item: ChecklistItem; projectId: string }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateChecklistItem(item.id, projectId, formData);
          setEditing(false);
        }}
        className="flex flex-col gap-2 rounded-md border border-border p-3"
      >
        <Input name="text" defaultValue={item.text} />
        <div className="flex flex-wrap gap-2">
          <Input name="assignee" defaultValue={item.assignee ?? ""} placeholder="Responsable (opcional)" className="w-48" />
          <Input
            type="date"
            name="dueDate"
            defaultValue={item.dueDate ? item.dueDate.toISOString().slice(0, 10) : ""}
            className="w-40"
          />
        </div>
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
        disabled={isPending}
        onChange={(e) => {
          const done = e.target.checked;
          startTransition(() => {
            toggleChecklistItem(item.id, projectId, done);
          });
        }}
        className="mt-1 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
      />
      <div className="flex-1">
        <p className={cn("text-sm", item.done && "text-muted-foreground line-through")}>{item.text}</p>
        {(item.assignee || item.dueDate) && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.assignee}
            {item.assignee && item.dueDate && " · "}
            {item.dueDate && `vence ${formatDate(item.dueDate)}`}
          </p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button type="button" onClick={() => setEditing(true)} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Editar subtarea">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => startTransition(() => deleteChecklistItem(item.id, projectId))}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label="Eliminar subtarea"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

export function Checklist({ projectId, items }: { projectId: string; items: ChecklistItem[] }) {
  const [showForm, setShowForm] = useState(false);
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
          <InfoHint text="Las subtareas de este proyecto. Se sembraron una vez desde la columna Entregables del CSV de planeación; a partir de ahí viven aquí — puedes marcarlas, editarlas, borrarlas o agregar nuevas sin que se pierdan al resincronizar." />
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-3.5 w-3.5" />
          Agregar subtarea
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {showForm && (
          <form
            action={async (formData) => {
              await addChecklistItem(projectId, formData);
              (document.getElementById("checklist-add-form") as HTMLFormElement | null)?.reset();
            }}
            id="checklist-add-form"
            className="flex flex-col gap-2 rounded-md border border-dashed border-input p-3"
          >
            <Input name="text" placeholder="Descripción de la subtarea" required />
            <div className="flex flex-wrap gap-2">
              <Input name="assignee" placeholder="Responsable (opcional)" className="w-48" />
              <Input type="date" name="dueDate" className="w-40" />
              <Button type="submit" size="sm">
                Agregar
              </Button>
            </div>
          </form>
        )}

        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este proyecto todavía no tiene subtareas.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {sorted.map((item) => (
              <ChecklistRow key={item.id} item={item} projectId={projectId} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
