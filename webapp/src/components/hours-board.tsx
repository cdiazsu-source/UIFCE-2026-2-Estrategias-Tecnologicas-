"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { BarChart3, CalendarPlus, Copy, Pencil, Plus, Trash2 } from "lucide-react";

import {
  addEntry,
  addWeeks,
  deleteEntry,
  deleteWeek,
  duplicateWeek,
  setEntryStatus,
  updateEntry,
  updateWeek,
  type HoursResult,
} from "@/lib/actions/hours";
import {
  CL_COURSE_WEEKLY_HOURS,
  DEFAULT_FIRST_WEEK_START,
  HOUR_CATEGORIES,
  HOUR_CATEGORY_LABEL,
  HOUR_CATEGORY_PLACEHOLDER,
  HOUR_CATEGORY_SHORT,
  HOUR_STATUSES,
  HOUR_STATUS_LABEL,
  WEEKLY_HOURS_TARGET,
  addDays,
  categoryTargets,
  compliance,
  fmtHours,
  pickCurrentWeek,
  summarize,
  targetNote,
  weekLabel,
  weekMonth,
  type HourCategory,
  type HourEntryData,
  type HourStatus,
  type HourTotals,
  type HourWeekData,
} from "@/lib/hours";
import { USER_ROLE_LABEL, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CollapseToggle, useCollapse } from "@/components/collapsible";
import { PersonAvatar } from "@/components/person-avatar";

export type HourPerson = {
  id: string;
  name: string;
  role: string;
  photoUrl: string | null;
  color: string | null;
  /** true = es la persona que está viendo la página (su tarjeta arranca abierta). */
  isMe: boolean;
};
export type HourProject = { id: string; title: string };

const STATUS_VARIANT: Record<HourStatus, "secondary" | "warning" | "success"> = {
  POR_HACER: "secondary",
  EN_PROGRESO: "warning",
  TERMINADA: "success",
};

function todayKey() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Bogota" }).format(new Date());
}

/** Corre una acción y, si la rechaza, deja el motivo a la vista. */
function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(action: () => Promise<HoursResult>, onOk?: () => void) {
    setError(null);
    startTransition(async () => {
      const r = await action();
      if (r.ok) onOk?.();
      else setError(r.error);
    });
  }
  return { pending, error, run, setError };
}

/** Barra de horas de una persona: lo planeado (tono claro) y lo hecho (tono fuerte) sobre la meta semanal. */
function HoursMeter({ planned, done, target }: { planned: number; done: number; target: number }) {
  const pct = (n: number) => `${Math.min(100, (n / target) * 100)}%`;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={Math.min(done, target)}
      aria-label={`${fmtHours(done)} h hechas y ${fmtHours(planned)} h planeadas de ${fmtHours(target)} h`}
      className="relative h-2 w-full overflow-hidden rounded-full bg-accent"
    >
      <div className={cn("absolute inset-y-0 left-0 rounded-full", planned > target ? "bg-warning/60" : "bg-primary/30")} style={{ width: pct(planned) }} />
      <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: pct(done) }} />
    </div>
  );
}

function WeekForm({
  week,
  weeks,
  onDone,
}: {
  week?: HourWeekData;
  weeks: HourWeekData[];
  onDone: (createdId?: string) => void;
}) {
  const { pending, error, run } = useAction();
  const last = weeks[weeks.length - 1];
  const start = week ? week.startDate.slice(0, 10) : last ? addDays(last.startDate, 7).slice(0, 10) : DEFAULT_FIRST_WEEK_START;
  const end = week ? week.endDate.slice(0, 10) : last ? addDays(last.endDate, 7).slice(0, 10) : addDays(`${DEFAULT_FIRST_WEEK_START}T00:00:00Z`, 5).slice(0, 10);

  return (
    <form
      action={(fd) => run(() => (week ? updateWeek(week.id, fd) : addWeeks(fd)), () => onDone())}
      className="flex flex-col gap-3 rounded-md border border-dashed border-input bg-card p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Número de semana
          <Input name="number" type="number" min={1} max={60} required defaultValue={week ? week.number : last ? last.number + 1 : 1} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Fecha de inicio
          <Input name="startDate" type="date" required defaultValue={start} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Fecha de fin
          <Input name="endDate" type="date" required defaultValue={end} />
        </label>
        {!week && (
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Semanas seguidas a crear
            <Input name="count" type="number" min={1} max={30} defaultValue={weeks.length === 0 ? 17 : 1} />
          </label>
        )}
      </div>
      {!week && weeks.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Para crear todo el semestre de una vez: semana 1, de lunes a sábado, y la cantidad de semanas (cada una empieza 7 días después de la anterior).
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {week ? "Guardar semana" : "Agregar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onDone()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function EntryForm({
  entry,
  weekId,
  person,
  planned,
  projects,
  onDone,
}: {
  entry?: HourEntryData;
  weekId: string;
  person: HourPerson;
  /** Horas ya planeadas de la persona esa semana por categoría, para proponer el primer valor. */
  planned: HourTotals["byCategory"];
  projects: HourProject[];
  onDone: () => void;
}) {
  const { pending, error, run } = useAction();
  // Al agregar, se propone la primera categoría fija (GC, PE, PI) a la que todavía le faltan horas, con las que faltan.
  const targets = categoryTargets(person.role);
  const missing = (c: HourCategory) => Math.max(0, (targets[c] ?? 0) - planned[c].planned);
  const [category, setCategory] = useState<HourCategory>(entry?.category ?? HOUR_CATEGORIES.find((c) => missing(c) > 0) ?? "PROYECTO");
  const suggested = entry
    ? String(entry.planned)
    : missing(category) > 0
      ? fmtHours(missing(category))
      : category === "CURSOS_LIBRES"
        ? fmtHours(CL_COURSE_WEEKLY_HOURS)
        : "";
  const options = entry?.project && !projects.some((p) => p.id === entry.project?.id) ? [entry.project, ...projects] : projects;

  return (
    <form
      key={category /* al cambiar de categoría se vuelve a proponer la hora sugerida */}
      action={(fd) => run(() => (entry ? updateEntry(entry.id, fd) : addEntry(weekId, person.id, fd)), onDone)}
      className="flex flex-col gap-3 rounded-md border border-dashed border-input bg-card p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground lg:col-span-2">
          Categoría
          <Select name="category" required value={category} onChange={(e) => setCategory(e.target.value as HourCategory)}>
            {HOUR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {HOUR_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Horas planeadas
          <Input name="plannedHours" inputMode="decimal" required defaultValue={suggested} placeholder="Ej. 4 o 1,5" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Horas hechas
          <Input name="doneHours" inputMode="decimal" defaultValue={entry ? String(entry.done) : "0"} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:col-span-2 lg:col-span-2">
          En qué se usan
          <Input name="title" defaultValue={entry?.title ?? ""} placeholder={HOUR_CATEGORY_PLACEHOLDER[category]} maxLength={200} />
        </label>
        {category === "PROYECTO" && (
          <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:col-span-2">
            Proyecto del tracker (opcional)
            <Select name="projectId" defaultValue={entry?.project?.id ?? ""}>
              <option value="">Ninguno</option>
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Estado
          <Select name="status" defaultValue={entry?.status ?? "POR_HACER"}>
            {HOUR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {HOUR_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {entry ? "Guardar" : "Agregar horas"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function EntryRow({
  entry,
  person,
  weekId,
  planned,
  projects,
  canManage,
}: {
  entry: HourEntryData;
  person: HourPerson;
  weekId: string;
  planned: HourTotals["byCategory"];
  projects: HourProject[];
  canManage: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const { pending, error, run } = useAction();

  if (editing) {
    return <EntryForm entry={entry} weekId={weekId} person={person} planned={planned} projects={projects} onDone={() => setEditing(false)} />;
  }
  const label = entry.title || entry.project?.title || HOUR_CATEGORY_LABEL[entry.category];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-2 last:border-0">
      <Badge variant="outline" className="shrink-0">
        {HOUR_CATEGORY_SHORT[entry.category]}
      </Badge>
      <div className="min-w-[10rem] flex-1 text-sm">
        {entry.project ? (
          <Link href={`/proyectos/${entry.project.id}`} className="text-link hover:underline">
            {label}
          </Link>
        ) : (
          label
        )}
        {entry.title && entry.project && <span className="text-muted-foreground"> · {entry.project.title}</span>}
        {error && <span className="ml-2 text-xs text-destructive">{error}</span>}
      </div>
      <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground" title="Horas hechas / planeadas">
        {fmtHours(entry.done)} / {fmtHours(entry.planned)} h
      </span>
      {canManage ? (
        <Select
          value={entry.status}
          disabled={pending}
          aria-label={`Estado de ${label}`}
          className="h-8 w-32 text-xs"
          onChange={(e) => run(() => setEntryStatus(entry.id, e.target.value))}
        >
          {HOUR_STATUSES.map((s) => (
            <option key={s} value={s}>
              {HOUR_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      ) : (
        <Badge variant={STATUS_VARIANT[entry.status]}>{HOUR_STATUS_LABEL[entry.status]}</Badge>
      )}
      {canManage && (
        <div className="flex gap-1">
          <button type="button" onClick={() => setEditing(true)} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label={`Editar ${label}`}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`¿Eliminar «${label}» (${fmtHours(entry.planned)} h)? No se puede deshacer.`)) run(() => deleteEntry(entry.id));
            }}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Eliminar ${label}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function PersonCard({
  person,
  weekId,
  entries,
  projects,
  canManage,
}: {
  person: HourPerson;
  weekId: string;
  entries: HourEntryData[];
  projects: HourProject[];
  canManage: boolean;
}) {
  const { open, toggle } = useCollapse(`horas:${person.id}`, person.isMe);
  const [adding, setAdding] = useState(false);
  const totals = useMemo(() => summarize(entries), [entries]);
  const notes = targetNote(totals.planned, totals.byCategory, person.role);
  const chips = HOUR_CATEGORIES.filter((c) => totals.byCategory[c].planned > 0);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-2">
          <CollapseToggle open={open} onToggle={toggle} label={`las horas de ${person.name}`} className="mt-3" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <PersonAvatar name={person.name} photoUrl={person.photoUrl} ringColor={person.color} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {person.name}
                  {person.isMe && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(tú)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{USER_ROLE_LABEL[person.role] ?? person.role}</p>
              </div>
              <p className="whitespace-nowrap text-sm tabular-nums" aria-live="polite">
                <span className="font-semibold">{fmtHours(totals.done)}</span>
                <span className="text-muted-foreground"> hechas · </span>
                <span className="font-semibold">{fmtHours(totals.planned)}</span>
                <span className="text-muted-foreground"> de {WEEKLY_HOURS_TARGET} h planeadas</span>
              </p>
            </div>
            <HoursMeter planned={totals.planned} done={totals.done} target={WEEKLY_HOURS_TARGET} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {notes.map((n) => (
                <span key={n.text} className="inline-flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", n.ok ? "bg-success" : "bg-warning")} aria-hidden />
                  {n.text}
                </span>
              ))}
              {chips.map((c) => (
                <span key={c} title={`${HOUR_CATEGORY_LABEL[c]}: ${fmtHours(totals.byCategory[c].done)} hechas de ${fmtHours(totals.byCategory[c].planned)} planeadas`}>
                  {HOUR_CATEGORY_SHORT[c]} {fmtHours(totals.byCategory[c].planned)} h
                </span>
              ))}
            </div>
          </div>
        </div>

        {open && (
          <div className="flex flex-col gap-2 border-t border-border pt-2">
            {entries.length === 0 && !adding && <p className="py-1 text-sm text-muted-foreground">Sin horas planeadas esta semana.</p>}
            {entries.map((e) => (
              <EntryRow key={e.id} entry={e} person={person} weekId={weekId} planned={totals.byCategory} projects={projects} canManage={canManage} />
            ))}
            {canManage &&
              (adding ? (
                <EntryForm weekId={weekId} person={person} planned={totals.byCategory} projects={projects} onDone={() => setAdding(false)} />
              ) : (
                <div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
                    <Plus className="h-4 w-4" aria-hidden />
                    Agregar horas
                  </Button>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type Period = "SEMESTRE" | "MES" | "SEMANA";

/** Estadísticas del equipo por semana, por mes o por todo el semestre (como la app de referencia): cuatro totales y el
 *  desglose por persona. Arranca contraído. */
function StatsPanel({ people, weeks, entries, initialWeekId, personal }: { people: HourPerson[]; weeks: HourWeekData[]; entries: HourEntryData[]; initialWeekId: string | null; personal: boolean }) {
  const { open, toggle } = useCollapse("horas:stats", false);
  const months = useMemo(() => {
    const seen = new Map<string, string>();
    for (const w of weeks) {
      const m = weekMonth(w);
      if (!seen.has(m.key)) seen.set(m.key, m.label);
    }
    return [...seen].map(([key, label]) => ({ key, label }));
  }, [weeks]);
  const [period, setPeriod] = useState<Period>("SEMANA");
  const [weekId, setWeekId] = useState(initialWeekId ?? weeks[0]?.id ?? "");
  const [monthKey, setMonthKey] = useState(months[0]?.key ?? "");

  const inPeriod = weeks.filter((w) => (period === "SEMESTRE" ? true : period === "MES" ? weekMonth(w).key === (monthKey || months[0]?.key) : w.id === weekId));
  const ids = new Set(inPeriod.map((w) => w.id));
  const scoped = entries.filter((e) => ids.has(e.weekId));
  const all = summarize(scoped);
  const target = WEEKLY_HOURS_TARGET * inPeriod.length;

  const tile = (label: string, value: string, sub?: string, tone?: string) => (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-bold tabular-nums", tone)}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-1.5">
          <CollapseToggle open={open} onToggle={toggle} label="las estadísticas del equipo" />
          <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-semibold">{personal ? "Mis estadísticas" : "Estadísticas del equipo"}</h2>
        </div>
        {open && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Período
                <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
                  <option value="SEMANA">Por semana</option>
                  <option value="MES">Por mes</option>
                  <option value="SEMESTRE">Todo el semestre</option>
                </Select>
              </label>
              {period === "SEMANA" && (
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  Semana
                  <Select value={weekId} onChange={(e) => setWeekId(e.target.value)}>
                    {weeks.map((w) => (
                      <option key={w.id} value={w.id}>
                        {weekLabel(w)}
                      </option>
                    ))}
                  </Select>
                </label>
              )}
              {period === "MES" && (
                <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                  Mes
                  <Select value={monthKey || months[0]?.key} onChange={(e) => setMonthKey(e.target.value)}>
                    {months.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {tile("Horas planeadas", `${fmtHours(all.planned)} h`, `meta ${fmtHours(target * people.length)} h`, "text-primary")}
              {tile("Horas hechas", `${fmtHours(all.done)} h`, undefined, "text-success")}
              {tile("Cumplimiento", `${compliance(all)} %`, "hechas / planeadas")}
              {!personal && tile("Integrantes", String(people.length))}
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{personal ? "Mi desglose" : "Desglose individual"}</h3>
              {people.map((p) => {
                const t = summarize(scoped.filter((e) => e.userId === p.id));
                return (
                  <div key={p.id} className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <PersonAvatar name={p.name} photoUrl={p.photoUrl} ringColor={p.color} />
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</p>
                      <p className="whitespace-nowrap text-sm tabular-nums">
                        <span className="font-semibold">{fmtHours(t.done)}</span> hechas · <span className="font-semibold">{fmtHours(t.planned)}</span> de {fmtHours(target)} h
                        <span className="text-muted-foreground"> ({compliance(t)} %)</span>
                      </p>
                    </div>
                    <HoursMeter planned={t.planned} done={t.done} target={Math.max(target, 1)} />
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>Por hacer: {t.counts.POR_HACER}</span>
                      <span>En progreso: {t.counts.EN_PROGRESO}</span>
                      <span>Terminadas: {t.counts.TERMINADA}</span>
                      <span>Total registros: {t.counts.total}</span>
                      {HOUR_CATEGORIES.filter((c) => t.byCategory[c].planned > 0).map((c) => (
                        <span key={c}>
                          {HOUR_CATEGORY_SHORT[c]} {fmtHours(t.byCategory[c].done)}/{fmtHours(t.byCategory[c].planned)} h
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Pantalla de /horas: elegir semana, ver el contador de cada persona y (solo el máster) planear y registrar horas. */
export function HoursBoard({
  canManage,
  people,
  projects,
  weeks,
  entries,
  personal = false,
}: {
  canManage: boolean;
  /** true = la persona ve solo lo suyo (cada Junior). */
  personal?: boolean;
  people: HourPerson[];
  projects: HourProject[];
  weeks: HourWeekData[];
  entries: HourEntryData[];
}) {
  const initial = useMemo(() => pickCurrentWeek(weeks, todayKey())?.id ?? null, [weeks]);
  const [chosen, setChosen] = useState<string | null>(initial);
  const [form, setForm] = useState<"add" | "edit" | null>(null);
  const { pending, error, run } = useAction();

  // Si la semana elegida se borró, se vuelve a la vigente.
  const week = weeks.find((w) => w.id === chosen) ?? weeks.find((w) => w.id === initial) ?? weeks[0] ?? null;
  const weekEntries = week ? entries.filter((e) => e.weekId === week.id) : [];
  const teamTotals = summarize(weekEntries);

  if (weeks.length === 0 || !week) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Todavía no hay semanas creadas para este semestre.</p>
        {canManage ? <WeekForm weeks={weeks} onDone={() => setForm(null)} /> : <p className="text-sm text-muted-foreground">El máster las crea desde esta misma página.</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-[14rem] flex-col gap-1 text-xs text-muted-foreground">
          Semana
          <Select
            value={week.id}
            onChange={(e) => {
              setChosen(e.target.value);
              setForm(null);
            }}
          >
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                {weekLabel(w)}
              </option>
            ))}
          </Select>
        </label>
        {canManage && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setForm(form === "add" ? null : "add")}>
              <CalendarPlus className="h-4 w-4" aria-hidden />
              Agregar semana
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              title="Crea la semana siguiente con las mismas horas planeadas"
              onClick={() => run(() => duplicateWeek(week.id), () => undefined)}
            >
              <Copy className="h-4 w-4" aria-hidden />
              Copiar a la semana siguiente
            </Button>
            <button type="button" onClick={() => setForm(form === "edit" ? null : "edit")} className="rounded p-1.5 text-muted-foreground hover:bg-accent" aria-label="Editar fechas de la semana" title="Editar fechas de la semana">
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Eliminar la semana ${week.number} con todas sus horas? No se puede deshacer.`)) run(() => deleteWeek(week.id), () => setChosen(null));
              }}
              className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Eliminar semana"
              title="Eliminar semana"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {form === "add" && <WeekForm weeks={weeks} onDone={() => setForm(null)} />}
      {form === "edit" && <WeekForm key={week.id} week={week} weeks={weeks} onDone={() => setForm(null)} />}

      <p className="text-xs text-muted-foreground">
        {personal ? "Tú" : "Equipo"} esta semana: {fmtHours(teamTotals.done)} h hechas de {fmtHours(teamTotals.planned)} h planeadas
        {teamTotals.planned > 0 ? ` (${compliance(teamTotals)} %)` : ""} · meta {fmtHours(WEEKLY_HOURS_TARGET * people.length)} h.
      </p>

      <div className="flex flex-col gap-3">
        {people.map((p) => (
          <PersonCard key={`${week.id}:${p.id}`} person={p} weekId={week.id} entries={weekEntries.filter((e) => e.userId === p.id)} projects={projects} canManage={canManage} />
        ))}
        {people.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {personal ? "No encuentro tu perfil en el equipo de ET. Pídele al máster que lo revise." : "No hay personas activas del área ET con rol de máster o Junior."}
          </p>
        )}
      </div>

      <StatsPanel people={people} weeks={weeks} entries={entries} initialWeekId={week.id} personal={personal} />
    </div>
  );
}
