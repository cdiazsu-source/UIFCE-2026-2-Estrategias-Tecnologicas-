"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";

import { deleteShift, saveShift } from "@/lib/actions/office-schedule";
import {
  DEFAULT_BUILDING,
  OFFICE_BUILDINGS,
  SCHEDULE_DAYS,
  SCHEDULE_END_HOUR,
  SCHEDULE_START_HOUR,
  SHIFT_CATEGORIES,
  SHIFT_CATEGORY_LABEL,
  SHIFT_CATEGORY_SHORT,
  activeNow,
  bogotaNow,
  fmtTime,
  fmtRemaining,
  layoutDay,
  nextShift,
  timeOptions,
  type ShiftData,
} from "@/lib/office-schedule";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { HourPerson } from "@/components/hours-board";

const ROW = 40; // alto en px de cada hora
const TEAM_COLOR = "#000066";
const FALLBACK_COLOR = "#64748B";

function firstName(name: string) {
  return name.split(" ")[0];
}

function ShiftForm({
  shift,
  people,
  onDone,
}: {
  shift: ShiftData | null;
  people: HourPerson[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const times = useMemo(timeOptions, []);

  return (
    <form
      key={shift?.id ?? "new"}
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const r = await saveShift(shift?.id ?? null, fd);
          if (r.ok) onDone();
          else setError(r.error);
        });
      }}
      className="flex flex-col gap-3 rounded-md border border-dashed border-input bg-card p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Persona
          <Select name="userId" defaultValue={shift ? (shift.userId ?? "TEAM") : (people[0]?.id ?? "TEAM")}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value="TEAM">Todo el equipo</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Día
          <Select name="day" defaultValue={shift?.day ?? 1}>
            {SCHEDULE_DAYS.map((d) => (
              <option key={d.n} value={d.n}>
                {d.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Desde
          <Select name="start" defaultValue={shift?.start ?? 8 * 60}>
            {times.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Hasta
          <Select name="end" defaultValue={shift?.end ?? 10 * 60}>
            {times.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Edificio
          <Select name="location" defaultValue={shift?.location ?? DEFAULT_BUILDING}>
            {OFFICE_BUILDINGS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Tipo de bloque
          <Select name="category" defaultValue={shift?.category ?? "PUNTO_INFORMACION"}>
            {SHIFT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SHIFT_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:col-span-2">
          Detalle (opcional)
          <Input name="label" defaultValue={shift?.label ?? ""} maxLength={80} placeholder="Ej. Capacitación de IA Generativa, con Camilo Lagos" />
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {shift ? "Guardar bloque" : "Agregar bloque"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
        {shift && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto text-destructive hover:text-destructive"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("¿Eliminar este bloque del horario?")) return;
              startTransition(async () => {
                const r = await deleteShift(shift.id);
                if (r.ok) onDone();
                else setError(r.error);
              });
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Eliminar
          </Button>
        )}
      </div>
    </form>
  );
}

/** Hora actual en Bogotá, que se refresca sola cada 30 segundos. Se lee en el navegador tras montar (antes es null), para que
 *  servidor y cliente coincidan al hidratar. */
export function useNow() {
  const [now, setNow] = useState<{ day: number; minutes: number } | null>(null);
  useEffect(() => {
    setNow(bogotaNow());
    const t = setInterval(() => setNow(bogotaNow()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/** «Ahora»: en qué bloque del horario está la persona en este momento, hasta cuándo y dónde (edificio); si no tiene uno, cuál
 *  sigue. Es lo que ve cada Junior arriba de su página, en tiempo real. */
export function NowCard({ shifts }: { shifts: ShiftData[] }) {
  const now = useNow();
  if (!now) return <div className="h-[4.5rem] rounded-xl border border-border bg-card" aria-hidden />;

  const active = activeNow(shifts, now);
  const next = nextShift(shifts, now);
  const when = (daysAhead: number, day: number) => (daysAhead === 0 ? "hoy" : daysAhead === 1 ? "mañana" : (SCHEDULE_DAYS.find((d) => d.n === day)?.name ?? "").toLowerCase());
  const title = (s: ShiftData) => (s.label ? `${SHIFT_CATEGORY_LABEL[s.category]} · ${s.label}` : SHIFT_CATEGORY_LABEL[s.category]);

  return (
    <div role="status" aria-live="polite" className={cn("rounded-xl border bg-card p-4", active.length > 0 ? "border-primary/40" : "border-border")}>
      {active.length > 0 ? (
        <div className="flex flex-col gap-2">
          {active.map((s) => (
            <div key={s.id} className="flex items-start gap-3">
              <span className="relative mt-1.5 flex h-2.5 w-2.5 shrink-0" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
              </span>
              <div>
                <p className="text-sm font-semibold">Ahora: {title(s)}</p>
                <p className="text-xs text-muted-foreground">
                  Edificio {s.location} · {fmtTime(s.start)}–{fmtTime(s.end)} · faltan {fmtRemaining(s.end - now.minutes)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden />
          <div>
            <p className="text-sm font-semibold">Ahora no tienes un bloque del horario</p>
            <p className="text-xs text-muted-foreground">
              {next
                ? `Sigue ${when(next.daysAhead, next.shift.day)}, ${fmtTime(next.shift.start)}–${fmtTime(next.shift.end)}: ${title(next.shift)} · edificio ${next.shift.location}`
                : "Todavía no hay bloques en tu horario."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Horario semanal de oficina de lunes a sábado: cada bloque lleva el color de la persona (o el azul de la marca si es de
 *  todo el equipo) y la sigla del tipo. Solo el máster lo edita; los demás lo consultan. */
export function ScheduleBoard({ canManage, people, shifts, personal = false }: { canManage: boolean; people: HourPerson[]; shifts: ShiftData[]; personal?: boolean }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [editing, setEditing] = useState<ShiftData | "new" | null>(null);
  const now = useNow();

  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const colorOf = (s: ShiftData) => (s.userId ? (personById.get(s.userId)?.color ?? FALLBACK_COLOR) : TEAM_COLOR);
  const nameOf = (s: ShiftData) => (s.userId ? firstName(personById.get(s.userId)?.name ?? "—") : "Equipo");

  const visible = shifts.filter((s) => s.userId === null || !hidden.has(s.userId));
  const startHour = Math.min(SCHEDULE_START_HOUR, ...shifts.map((s) => Math.floor(s.start / 60)));
  const endHour = Math.max(SCHEDULE_END_HOUR, ...shifts.map((s) => Math.ceil(s.end / 60)));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const here = now ? activeNow(shifts, now) : [];
  const toggle = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const usedCategories = SHIFT_CATEGORIES.filter((c) => shifts.some((s) => s.category === c));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {!personal && <span className="text-xs text-muted-foreground">Ver a:</span>}
        {(personal ? [] : people).map((p) => {
          const on = !hidden.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(p.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                on ? "border-input bg-card" : "border-input bg-muted/40 text-muted-foreground opacity-60",
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? FALLBACK_COLOR }} aria-hidden />
              {firstName(p.name)}
            </button>
          );
        })}
        {canManage && (
          <div className="ml-auto flex gap-1.5">
            {editMode && (
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing("new")}>
                <Plus className="h-4 w-4" aria-hidden />
                Agregar bloque
              </Button>
            )}
            <Button
              type="button"
              variant={editMode ? "default" : "outline"}
              size="sm"
              aria-pressed={editMode}
              onClick={() => {
                setEditMode((v) => !v);
                setEditing(null);
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              {editMode ? "Terminar de editar" : "Editar horario"}
            </Button>
          </div>
        )}
      </div>

      {now && !personal && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {here.length > 0 ? (
            <>Ahora en la oficina: {here.map((s) => `${nameOf(s)} en ${s.label ?? SHIFT_CATEGORY_SHORT[s.category]} (edificio ${s.location})`).join(" · ")}</>
          ) : (
            <>Ahora no hay nadie programado en la oficina.</>
          )}
        </p>
      )}

      {editMode && editing && <ShiftForm shift={editing === "new" ? null : editing} people={people} onDone={() => setEditing(null)} />}
      {editMode && !editing && <p className="text-xs text-muted-foreground">Toca un bloque para editarlo o eliminarlo, o agrega uno nuevo.</p>}

      {shifts.length === 0 && !editMode && (
        <p className="text-sm text-muted-foreground">
          {canManage ? "Todavía no hay bloques. Pulsa «Editar horario» para armar la semana." : "El máster aún no ha configurado el horario."}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <div className="grid min-w-[560px]" style={{ gridTemplateColumns: "40px repeat(6, minmax(0, 1fr))" }}>
          <div className="border-b border-border" />
          {SCHEDULE_DAYS.map((d) => (
            <div
              key={d.n}
              className={cn("border-b border-l border-border px-1 py-1.5 text-center text-xs font-semibold", now?.day === d.n && "bg-accent text-primary")}
            >
              {d.short}
            </div>
          ))}
          <div>
            {hours.map((h) => (
              <div key={h} className="pr-1 text-right text-[11px] text-muted-foreground" style={{ height: ROW }}>
                <span className="relative -top-1.5">{h}:00</span>
              </div>
            ))}
          </div>
          {SCHEDULE_DAYS.map((d) => {
            const laid = layoutDay(visible.filter((s) => s.day === d.n));
            return (
              <div
                key={d.n}
                className={cn("relative border-l border-border", now?.day === d.n && "bg-accent/30")}
                style={{
                  height: hours.length * ROW,
                  backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px)",
                  backgroundSize: `100% ${ROW}px`,
                }}
              >
                {laid.map((s) => {
                  const color = colorOf(s);
                  const w = 100 / s.lanes;
                  const style = {
                    top: ((s.start - startHour * 60) / 60) * ROW,
                    height: ((s.end - s.start) / 60) * ROW - 2,
                    left: `calc(${s.lane * w}% + 1px)`,
                    width: `calc(${w}% - 2px)`,
                    background: `${color}22`,
                    borderColor: color,
                  };
                  const title = `${nameOf(s)} · ${SHIFT_CATEGORY_LABEL[s.category]}${s.label ? ` · ${s.label}` : ""} · edificio ${s.location} · ${fmtTime(s.start)}–${fmtTime(s.end)}`;
                  const body = (
                    <>
                      <span className="font-semibold">{SHIFT_CATEGORY_SHORT[s.category]}</span>
                      {s.location !== DEFAULT_BUILDING && <span className="ml-1 rounded bg-foreground/10 px-1 text-[10px] font-semibold">{s.location}</span>}
                      <br />
                      {nameOf(s)}
                      {s.label && s.lanes === 1 && s.end - s.start >= 90 && <span className="block truncate text-muted-foreground">{s.label}</span>}
                    </>
                  );
                  const live = now !== null && s.day === now.day && s.start <= now.minutes && now.minutes < s.end;
                  const cls = cn("absolute overflow-hidden rounded border-l-[3px] px-1 py-0.5 text-left text-[11px] leading-tight text-foreground", live && "z-[5] ring-2 ring-primary");
                  return editMode ? (
                    <button
                      key={s.id}
                      type="button"
                      title={title}
                      aria-label={`Editar: ${title}`}
                      onClick={() => setEditing(shifts.find((x) => x.id === s.id) ?? null)}
                      className={cn(cls, "hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring", editing !== "new" && editing?.id === s.id && "ring-2 ring-ring")}
                      style={style}
                    >
                      {body}
                    </button>
                  ) : (
                    <div key={s.id} title={title} className={cls} style={style}>
                      {body}
                    </div>
                  );
                })}
                {now?.day === d.n && now.minutes >= startHour * 60 && now.minutes <= endHour * 60 && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: ((now.minutes - startHour * 60) / 60) * ROW }} aria-hidden>
                    <span className="-ml-1 h-2 w-2 rounded-full bg-destructive" />
                    <span className="h-px flex-1 bg-destructive" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {usedCategories.length > 0 && (
        <p className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          {usedCategories.map((c) => (
            <span key={c}>
              {SHIFT_CATEGORY_LABEL[c].startsWith(SHIFT_CATEGORY_SHORT[c]) ? (
                <span className="font-semibold text-foreground">{SHIFT_CATEGORY_LABEL[c]}</span>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{SHIFT_CATEGORY_SHORT[c]}</span> {SHIFT_CATEGORY_LABEL[c]}
                </>
              )}
            </span>
          ))}
          <span>
            <span className="font-semibold" style={{ color: TEAM_COLOR }}>
              Azul oscuro
            </span>{" "}
            = todo el equipo
          </span>
          <span>Sin marca = edificio {DEFAULT_BUILDING}</span>
        </p>
      )}
    </div>
  );
}
