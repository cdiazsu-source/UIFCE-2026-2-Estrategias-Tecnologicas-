"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { ProjectStatus } from "@prisma/client";
import { CalendarClock, Flag, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";

import { addEvent, deleteEvent, updateEvent } from "@/lib/actions/calendar-events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";
import { bogotaDateKey, formatDayHeader, formatTimeRange, PROJECT_STATUS_LABEL, toBogotaInputValue } from "@/lib/utils";

const STATUS_BADGE_VARIANT: Record<ProjectStatus, "secondary" | "warning" | "success"> = {
  POR_INICIAR: "secondary",
  EN_CURSO: "warning",
  COMPLETADO: "success",
};

export type CalendarProjectItem = {
  kind: "project";
  id: string;
  title: string;
  status: ProjectStatus;
  startAt: string;
  endAt: string | null;
  location: string | null;
  mainProjectTitle: string | null;
};

export type CalendarDeadlineItem = {
  kind: "deadline";
  id: string;
  text: string;
  done: boolean;
  startAt: string;
  projectId: string;
  projectTitle: string;
};

export type CalendarEventItem = {
  kind: "event";
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
};

export type CalendarItem = CalendarProjectItem | CalendarDeadlineItem | CalendarEventItem;

function ProjectRow({ item }: { item: CalendarProjectItem }) {
  return (
    <Link
      href={`/proyectos/${item.id}`}
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-border p-3 text-sm transition-colors hover:border-primary/40 hover:bg-accent"
    >
      <span className="inline-flex w-36 shrink-0 items-center gap-1.5 font-medium tabular-nums">
        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        {formatTimeRange(item.startAt, item.endAt)}
      </span>
      <span className="flex-1 font-medium">{item.title}</span>
      {item.location && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {item.location}
        </span>
      )}
      {item.mainProjectTitle && <span className="text-xs text-muted-foreground">Parte de: {item.mainProjectTitle}</span>}
      <Badge variant={STATUS_BADGE_VARIANT[item.status]}>{PROJECT_STATUS_LABEL[item.status]}</Badge>
    </Link>
  );
}

function DeadlineRow({ item }: { item: CalendarDeadlineItem }) {
  const overdue = !item.done && item.startAt < new Date().toISOString();
  return (
    <Link
      href={`/proyectos/${item.projectId}`}
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-dashed border-border p-3 text-sm transition-colors hover:border-primary/40 hover:bg-accent"
    >
      <span className="inline-flex w-36 shrink-0 items-center gap-1.5 font-medium tabular-nums text-muted-foreground">
        <Flag className="h-3.5 w-3.5 shrink-0" />
        Vence
      </span>
      <span className={`flex-1 font-medium ${item.done ? "text-muted-foreground line-through" : ""}`}>{item.text}</span>
      <span className="text-xs text-muted-foreground">{item.projectTitle}</span>
      {item.done ? (
        <Badge variant="success">Cumplida</Badge>
      ) : overdue ? (
        <Badge variant="destructive">Atrasada</Badge>
      ) : null}
    </Link>
  );
}

function EventFields({ e }: { e?: CalendarEventItem }) {
  return (
    <>
      <Input name="title" defaultValue={e?.title ?? ""} placeholder="Título del evento" required className="min-w-[14rem] flex-1" />
      <div className="flex flex-wrap gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Inicio
          <Input type="datetime-local" name="startAt" defaultValue={toBogotaInputValue(e?.startAt ?? null)} required className="w-56" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Fin (opcional)
          <Input type="datetime-local" name="endAt" defaultValue={toBogotaInputValue(e?.endAt ?? null)} className="w-56" />
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs text-muted-foreground">
          Lugar
          <Input name="location" defaultValue={e?.location ?? ""} placeholder="Sala, edificio, enlace de reunión…" />
        </label>
      </div>
      <Textarea name="description" defaultValue={e?.description ?? ""} placeholder="Descripción (opcional)" className="min-h-[56px]" />
    </>
  );
}

function EventRow({ item }: { item: CalendarEventItem }) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-4">
          <form
            action={async (formData) => {
              const u = await updateEvent(item.id, formData);
              if (u) undo(u);
              setEditing(false);
            }}
            className="flex flex-col gap-2"
          >
            <EventFields e={item} />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Guardar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
      <span className="inline-flex w-36 shrink-0 items-center gap-1.5 font-medium tabular-nums">
        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-primary" />
        {formatTimeRange(item.startAt, item.endAt)}
      </span>
      <span className="flex-1 font-medium">{item.title}</span>
      {item.location && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {item.location}
        </span>
      )}
      {item.description && <span className="w-full text-xs text-muted-foreground">{item.description}</span>}
      {canEdit && (
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded p-1 text-muted-foreground hover:bg-accent"
            aria-label="Editar evento"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!window.confirm(`¿Eliminar el evento "${item.title}"?`)) return;
              startTransition(async () => {
                const u = await deleteEvent(item.id);
                if (u) undo(u);
              });
            }}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            aria-label="Eliminar evento"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function NewEventForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        Nuevo evento
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form
          action={async (formData) => {
            await addEvent(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-2"
        >
          <EventFields />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Crear evento
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CalendarPanel({ items }: { items: CalendarItem[] }) {
  const canEdit = useCanEdit();
  const today = bogotaDateKey(new Date());

  const groups = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const key = bogotaDateKey(item.startAt);
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <div className="flex flex-col gap-4">
      {canEdit && <NewEventForm />}

      {groups.length === 0 ? (
        <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          Todavía no hay nada en el calendario. Se agrega desde la ficha de un proyecto, desde una subtarea con fecha
          límite, o con «Nuevo evento».
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(([key, dayItems]) => (
            <section key={key} className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {formatDayHeader(dayItems[0].startAt)}
                {key === today && <Badge variant="warning">Hoy</Badge>}
              </h2>
              <div className="flex flex-col gap-2">
                {dayItems.map((item) => {
                  if (item.kind === "project") return <ProjectRow key={`p-${item.id}`} item={item} />;
                  if (item.kind === "deadline") return <DeadlineRow key={`d-${item.id}`} item={item} />;
                  return <EventRow key={`e-${item.id}`} item={item} />;
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
