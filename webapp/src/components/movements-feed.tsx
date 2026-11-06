"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilePenLine, ListChecks, MessageSquareText, MousePointerClick, PanelTop, Pencil, Save } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CHANGE_TYPES, type Movement, type MovementType, type Movements } from "@/lib/movements-types";
import { bogotaDateKey, cn } from "@/lib/utils";

const TYPE_META: Record<MovementType, { label: string; icon: LucideIcon; cls: string }> = {
  CAMBIO: { label: "Cambio", icon: Save, cls: "bg-primary/10 text-primary" },
  NOTA: { label: "Nota", icon: FilePenLine, cls: "bg-primary/10 text-primary" },
  COMENTARIO: { label: "Comentario", icon: MessageSquareText, cls: "bg-primary/10 text-primary" },
  SUBTAREA: { label: "Subtarea", icon: ListChecks, cls: "bg-primary/10 text-primary" },
  ENTRADA: { label: "Entrada", icon: PanelTop, cls: "bg-muted text-muted-foreground" },
  PROYECTO: { label: "Proyecto", icon: Pencil, cls: "bg-muted text-muted-foreground" },
  CLIC: { label: "Clic", icon: MousePointerClick, cls: "bg-muted text-muted-foreground" },
};

const TIME = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Bogota" });
const DAY = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" });

function dayLabel(key: string, sample: Date): string {
  const today = bogotaDateKey(new Date());
  const yesterday = bogotaDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  if (key === today) return "Hoy";
  if (key === yesterday) return "Ayer";
  const t = DAY.format(sample);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

type Level = "cambios" | "todo";

/** Línea de tiempo de lo que hicieron los monitores Junior: por defecto solo las modificaciones (guardados, notas, comentarios,
 *  subtareas); «Todo el movimiento» suma entradas a pantallas y proyectos y clics. Filtro por persona. */
export function MovementsFeed({ data }: { data: Movements }) {
  const [who, setWho] = useState<string>("todos");
  const [level, setLevel] = useState<Level>("cambios");

  const person = useMemo(() => new Map(data.people.map((p) => [p.id, p])), [data.people]);
  const shown = useMemo(
    () => data.items.filter((m) => (who === "todos" || m.userId === who) && (level === "todo" || CHANGE_TYPES.includes(m.type))),
    [data.items, who, level],
  );

  const groups = useMemo(() => {
    const out: { key: string; label: string; items: Movement[] }[] = [];
    for (const m of shown) {
      const d = new Date(m.at);
      const key = bogotaDateKey(d);
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(m);
      else out.push({ key, label: dayLabel(key, d), items: [m] });
    }
    return out;
  }, [shown]);

  const chip = (active: boolean) =>
    cn("rounded-full border px-3 py-1 text-xs font-semibold transition-colors", active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Persona">
          <button type="button" onClick={() => setWho("todos")} aria-pressed={who === "todos"} className={chip(who === "todos")}>
            Todos
          </button>
          {data.people.map((p) => (
            <button key={p.id} type="button" onClick={() => setWho(p.id)} aria-pressed={who === p.id} className={chip(who === p.id)}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Qué mostrar">
          <button type="button" onClick={() => setLevel("cambios")} aria-pressed={level === "cambios"} className={chip(level === "cambios")}>
            Solo modificaciones
          </button>
          <button type="button" onClick={() => setLevel("todo")} aria-pressed={level === "todo"} className={chip(level === "todo")}>
            Todo el movimiento
          </button>
        </div>
      </div>

      {!data.trackingReady && (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          La huella digital todavía no está disponible (falta la migración de actividad). Se muestran solo notas, comentarios y subtareas.
        </p>
      )}

      {groups.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          Aún no hay movimientos con este filtro. Aparecen cuando un monitor Junior entra con su credencial propia y guarda cambios o escribe notas.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</h2>
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
              {g.items.map((m) => {
                const meta = TYPE_META[m.type];
                const Icon = meta.icon;
                const p = person.get(m.userId);
                return (
                  <li key={m.id} className="flex items-start gap-3 p-3">
                    <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", meta.cls)}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold" style={p?.color ? { color: p.color } : undefined}>
                          {p?.name ?? "—"}
                        </span>{" "}
                        {m.text}
                        {m.where && <span className="text-muted-foreground"> · {m.where}</span>}
                      </p>
                      {m.detail && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">«{m.detail}»</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">{TIME.format(new Date(m.at)).replace(/\s+/g, " ")}</span>
                      {m.href && (
                        <Link href={m.href} className="text-xs font-medium text-secondary hover:underline">
                          Ver
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
