"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Timer, Trash2 } from "lucide-react";

import { addLate, deleteLate } from "@/lib/actions/lateness";
import { LATE_MAX_MINUTES, LATE_NOTE_MAX, fmtMinutes, lateTotals, type LateData } from "@/lib/lateness";
import { bogotaDateKey, cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { HourPerson } from "@/components/hours-board";

function firstName(name: string) {
  return name.split(" ")[0];
}

function LateForm({ people, onDone }: { people: HourPerson[]; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = bogotaDateKey(new Date());
  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const r = await addLate(fd);
          if (r.ok) onDone();
          else setError(r.error);
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_9rem_7rem]">
        <label className="flex flex-col gap-1 text-xs font-medium">
          Persona
          <Select name="userId" defaultValue="" required>
            <option value="" disabled>
              Elegir…
            </option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {firstName(p.name)}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Día
          <Input type="date" name="date" defaultValue={today} max={today} required />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Minutos tarde
          <Input type="number" name="minutes" min={1} max={LATE_MAX_MINUTES} step={1} inputMode="numeric" placeholder="10" required />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs font-medium">
        Detalle (opcional)
        <Input name="note" maxLength={LATE_NOTE_MAX} placeholder="Llegó a su bloque de las 7:00 en el 310" />
      </label>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Guardando…" : "Registrar tardanza"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/** «Puntualidad»: tiempo tarde acumulado del equipo desde el inicio del semestre. El máster registra cada tardanza (persona, día y
 *  minutos); cada Junior ve solo la suya (el servidor filtra), y el acumulado de cada uno también aparece en su capa de bienvenida. */
export function LatenessBoard({
  canManage,
  people,
  entries,
  personal,
  since,
  ready,
}: {
  canManage: boolean;
  people: HourPerson[];
  entries: LateData[];
  personal: boolean;
  /** Fecha desde la que se acumula, «AAAA-MM-DD». */
  since: string;
  /** false = la tabla todavía no existe en la base (migración pendiente). */
  ready: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nameOf = useMemo(() => new Map(people.map((p) => [p.id, firstName(p.name)])), [people]);
  const team = lateTotals(entries);
  const rows = useMemo(
    () =>
      people
        .map((p) => {
          const mine = entries.filter((e) => e.userId === p.id);
          return { person: p, ...lateTotals(mine), last: mine[0]?.date ?? null };
        })
        .sort((a, b) => b.minutes - a.minutes || a.person.name.localeCompare(b.person.name, "es")),
    [people, entries],
  );

  if (!ready) {
    return <p className="text-sm text-muted-foreground">El registro de puntualidad se activa cuando se aplique la última migración de la base de datos.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Timer className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{personal ? "Tu tiempo tarde acumulado" : "Tiempo tarde acumulado del equipo"}</p>
          <p className="text-xl font-semibold">{fmtMinutes(team.minutes)}</p>
          <p className="text-xs text-muted-foreground">
            {team.count} {team.count === 1 ? "tardanza" : "tardanzas"} desde el {formatDate(`${since}T00:00:00Z`)}
          </p>
        </div>
        {canManage && !adding && (
          <Button type="button" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Registrar tardanza
          </Button>
        )}
      </div>

      {canManage && adding && <LateForm people={people} onDone={() => setAdding(false)} />}

      {!personal && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div key={r.person.id} className="rounded-xl border border-border bg-card p-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <span className="h-2 w-2 rounded-full" style={{ background: r.person.color ?? "#64748B" }} aria-hidden />
                {firstName(r.person.name)}
              </p>
              <p className={cn("text-lg font-semibold", r.minutes === 0 && "text-muted-foreground")}>{fmtMinutes(r.minutes)}</p>
              <p className="text-xs text-muted-foreground">
                {r.count === 0 ? "Sin tardanzas" : `${r.count} ${r.count === 1 ? "tardanza" : "tardanzas"} · última ${formatDate(`${r.last}T00:00:00Z`)}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <details className="rounded-xl border border-border bg-card text-sm">
          <summary className="cursor-pointer select-none px-4 py-2.5 text-muted-foreground">Ver los {entries.length} registros</summary>
          {error && (
            <p role="alert" className="px-4 pb-1 text-xs text-destructive">
              {error}
            </p>
          )}
          <ul className="divide-y divide-border border-t border-border">
            {entries.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{formatDate(`${e.date}T00:00:00Z`)}</span>
                {!personal && <span className="w-24 shrink-0 font-medium">{nameOf.get(e.userId) ?? "—"}</span>}
                <span className="w-20 shrink-0 font-medium">{fmtMinutes(e.minutes)}</span>
                <span className="min-w-0 flex-1 text-xs text-muted-foreground">{e.note ?? ""}</span>
                {canManage && (
                  <button
                    type="button"
                    aria-label="Eliminar este registro"
                    title="Eliminar"
                    disabled={pending}
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                    onClick={() => {
                      setError(null);
                      start(async () => {
                        const r = await deleteLate(e.id);
                        if (!r.ok) setError(r.error);
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
      {entries.length === 0 && <p className="text-sm text-muted-foreground">{canManage ? "Todavía no hay tardanzas registradas. Usa «Registrar tardanza» cuando alguien llegue tarde." : "No hay tardanzas registradas."}</p>}
    </div>
  );
}
