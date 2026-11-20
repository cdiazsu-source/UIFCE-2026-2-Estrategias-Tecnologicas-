"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { createUnitEvent, deleteUnitEvent, updateUnitEvent } from "@/lib/actions/unit-events";
import {
  KINDS,
  KIND_LABEL,
  MODALITIES,
  MODALITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  dayOf,
  summarize,
  yearOf,
  type EventKind,
  type EventStatus,
  type UnitEventData,
} from "@/lib/unit-events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InfoHint } from "@/components/info-hint";
import { Fold } from "@/components/ally-fold";
import { useCanEdit, useCanManageLeads } from "@/components/access-context";

const STATUS_STYLE: Record<EventStatus, string> = {
  PLANEADO: "bg-[#E6E6FF] text-[#000066]",
  REALIZADO: "bg-primary text-primary-foreground",
  CANCELADO: "border border-dashed border-border text-muted-foreground",
};

const KIND_STYLE: Record<EventKind, string> = {
  MICROTALLER: "bg-muted text-foreground",
  EVENTO: "bg-brand-accent text-brand-accent-foreground",
};

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", timeZone: "America/Bogota" });
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1 text-xs font-medium text-muted-foreground", className)}>
      {label}
      {children}
    </label>
  );
}

function EventForm({
  event,
  year,
  projectOptions,
  onDone,
}: {
  event?: UnitEventData;
  year: number;
  projectOptions: { id: string; title: string }[];
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inp = "text-sm font-normal text-foreground";
  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border p-3"
      action={(fd) =>
        start(async () => {
          const r = event ? await updateUnitEvent(event.id, fd) : await createUnitEvent(fd);
          if (r.ok) onDone();
          else setError(r.error);
        })
      }
    >
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr_10rem]">
        <Field label="Tipo">
          <Select name="kind" defaultValue={event?.kind ?? "MICROTALLER"} className={inp}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nombre">
          <Input name="title" required defaultValue={event?.title ?? ""} className={inp} />
        </Field>
        <Field label="Fecha">
          <Input name="date" type="date" required defaultValue={event ? dayOf(event.date) : `${year}-01-01`} className={inp} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Estado">
          <Select name="status" defaultValue={event?.status ?? "PLANEADO"} className={inp}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Inscritos">
          <Input name="registered" type="number" min={0} defaultValue={event?.registered ?? ""} className={inp} />
        </Field>
        <Field label="Asistentes">
          <Input name="attended" type="number" min={0} defaultValue={event?.attended ?? ""} className={inp} />
        </Field>
      </div>
      <details className="rounded-md border border-border px-3 py-2 text-sm" open={Boolean(event && (event.speaker || event.place || event.audience || event.link || event.notes || event.projectId))}>
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Más datos (modalidad, lugar, tallerista, enlace, notas)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Modalidad">
            <Select name="modality" defaultValue={event?.modality ?? "PRESENCIAL"} className={inp}>
              {MODALITIES.map((m) => (
                <option key={m} value={m}>
                  {MODALITY_LABEL[m]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Lugar o plataforma">
            <Input name="place" defaultValue={event?.place ?? ""} placeholder="Sala 1, Teams…" className={inp} />
          </Field>
          <Field label="Tallerista o ponente">
            <Input name="speaker" defaultValue={event?.speaker ?? ""} className={inp} />
          </Field>
          <Field label="Dirigido a">
            <Input name="audience" defaultValue={event?.audience ?? ""} placeholder="Estudiantes de primer semestre…" className={inp} />
          </Field>
          <Field label="Enlace (carpeta de Drive, grabación, memorias)">
            <Input name="link" type="url" defaultValue={event?.link ?? ""} placeholder="https://…" className={inp} />
          </Field>
          <Field label="Proyecto del PMO">
            <Select name="projectId" defaultValue={event?.projectId ?? ""} className={inp}>
              <option value="">Sin proyecto</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notas" className="sm:col-span-2">
            <Textarea name="notes" rows={2} defaultValue={event?.notes ?? ""} className={inp} />
          </Field>
        </div>
      </details>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {event ? "Guardar cambios" : "Agregar"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function Row({
  e,
  projectTitle,
  onEdit,
}: {
  e: UnitEventData;
  projectTitle: string | null;
  onEdit: () => void;
}) {
  const canManage = useCanManageLeads();
  const canEdit = useCanEdit();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const detail = [MODALITY_LABEL[e.modality], e.place, e.speaker && `con ${e.speaker}`, e.audience && `para ${e.audience}`].filter(Boolean).join(" · ");
  const rate = e.registered && e.attended != null ? Math.round((e.attended / e.registered) * 100) : null;
  return (
    <tr className={cn("border-t border-border align-top", e.status === "CANCELADO" && "text-muted-foreground")}>
      <td className="whitespace-nowrap px-2 py-2 tabular-nums">{dateLabel(e.date)}</td>
      <td className="px-2 py-2">
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", KIND_STYLE[e.kind])}>{KIND_LABEL[e.kind]}</span>
      </td>
      <td className="px-2 py-2">
        <div className={cn("font-medium", e.status === "CANCELADO" && "line-through")}>{e.title}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
        {projectTitle && e.projectId && (
          <Link href={`/proyectos/${e.projectId}`} className="text-xs text-link underline-offset-2 hover:underline">
            {projectTitle}
          </Link>
        )}
        {e.notes && <div className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">{e.notes}</div>}
      </td>
      <td className="px-2 py-2">
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_STYLE[e.status])}>{STATUS_LABEL[e.status]}</span>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
        {e.registered != null || e.attended != null ? (
          <>
            {e.attended ?? "–"} <span className="text-muted-foreground">/ {e.registered ?? "–"}</span>
            {rate != null && <div className="text-[11px] text-muted-foreground">{rate} %</div>}
          </>
        ) : (
          <span className="text-muted-foreground/50">·</span>
        )}
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right">
        {e.link && (
          <a href={e.link} target="_blank" rel="noopener noreferrer" aria-label={`Abrir enlace de ${e.title}`} title="Abrir enlace" className="press mr-1 inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        {canManage && (
          <button type="button" onClick={onEdit} aria-label={`Editar ${e.title}`} title="Editar" className="press inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
            <Pencil className="h-4 w-4" />
          </button>
        )}
        {canEdit &&
          (confirm ? (
            <>
              <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => start(async () => void (await deleteUnitEvent(e.id)))}>
                Eliminar
              </Button>
              <button type="button" aria-label="Cancelar" onClick={() => setConfirm(false)} className="press ml-1 inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} aria-label={`Eliminar ${e.title}`} title="Eliminar" className="press inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          ))}
      </td>
    </tr>
  );
}

export function UnitEventsBoard({ events, projectOptions }: { events: UnitEventData[]; projectOptions: { id: string; title: string }[] }) {
  const canManage = useCanManageLeads();
  const thisYear = yearOf(new Date().toISOString());
  const years = useMemo(() => {
    const set = new Set(events.map((e) => yearOf(e.date)));
    set.add(thisYear);
    return [...set].sort((a, b) => b - a);
  }, [events, thisYear]);

  const [year, setYear] = useState(thisYear);
  const [kind, setKind] = useState<EventKind | "todos">("todos");
  const [status, setStatus] = useState<EventStatus | "todos">("todos");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<"new" | string | null>(null);

  const ofYear = useMemo(() => events.filter((e) => yearOf(e.date) === year), [events, year]);
  const s = summarize(ofYear);
  const nq = q.trim().toLowerCase();
  const list = ofYear
    .filter(
      (e) =>
        (kind === "todos" || e.kind === kind) &&
        (status === "todos" || e.status === status) &&
        (!nq || [e.title, e.speaker ?? "", e.place ?? "", e.audience ?? ""].some((f) => f.toLowerCase().includes(nq))),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const filtering = kind !== "todos" || status !== "todos" || nq !== "";
  const projectTitle = (id: string | null) => (id ? (projectOptions.find((p) => p.id === id)?.title ?? null) : null);
  const editing = form && form !== "new" ? events.find((e) => e.id === form) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={year} onChange={(e) => { setYear(Number(e.target.value)); setForm(null); }} className="w-auto text-sm font-semibold" aria-label="Año">
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, tallerista o lugar…" className="pl-8" aria-label="Buscar" />
        </div>
        <Select value={kind} onChange={(e) => setKind(e.target.value as EventKind | "todos")} className="w-auto text-sm" aria-label="Tipo">
          <option value="todos">Microtalleres y eventos</option>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k === "MICROTALLER" ? "Solo microtalleres" : "Solo eventos"}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value as EventStatus | "todos")} className="w-auto text-sm" aria-label="Estado">
          <option value="todos">Todos los estados</option>
          {STATUSES.map((st) => (
            <option key={st} value={st}>
              {STATUS_LABEL[st]}
            </option>
          ))}
        </Select>
        {filtering && (
          <button type="button" onClick={() => { setQ(""); setKind("todos"); setStatus("todos"); }} className="press text-xs text-primary underline underline-offset-2">
            Limpiar
          </button>
        )}
        {canManage && (
          <Button type="button" size="sm" onClick={() => setForm("new")}>
            <Plus className="h-3.5 w-3.5" />
            Agregar
          </Button>
        )}
      </div>

      <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
        <span>
          <b className="font-semibold text-foreground">{year}</b>: {s.microtalleres} {s.microtalleres === 1 ? "microtaller" : "microtalleres"} · {s.eventos} {s.eventos === 1 ? "evento" : "eventos"}
          {s.done > 0 && ` · ${s.done} realizados`}
          {s.registered > 0 && ` · ${s.attended} asistentes de ${s.registered} inscritos${s.rate != null ? ` (${s.rate} %)` : ""}`}
        </span>
        <InfoHint text="Aquí se lleva el histórico de microtalleres y eventos de la Unidad, año por año. Elige el año arriba; «Comparar años» resume cada uno. Los cancelados no suman en los totales; los inscritos y asistentes solo cuentan los realizados. Cada fila puede llevar un enlace a la evidencia (carpeta de Drive, grabación, memorias) y el proyecto del PMO al que pertenece." />
      </p>

      {form === "new" && <EventForm year={year} projectOptions={projectOptions} onDone={() => setForm(null)} />}
      {editing && <EventForm key={editing.id} event={editing} year={year} projectOptions={projectOptions} onDone={() => setForm(null)} />}

      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {ofYear.length === 0
            ? `Aún no hay microtalleres ni eventos en ${year}.${canManage ? " Agrega el primero con «Agregar»." : ""}`
            : "Ninguno coincide con ese filtro."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-2 py-1.5 font-medium">Fecha</th>
                <th className="px-2 py-1.5 font-medium">Tipo</th>
                <th className="px-2 py-1.5 font-medium">Nombre</th>
                <th className="px-2 py-1.5 font-medium">Estado</th>
                <th className="px-2 py-1.5 text-right font-medium">Asistentes / inscritos</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <Row key={e.id} e={e} projectTitle={projectTitle(e.projectId)} onEdit={() => setForm(e.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Fold title="Comparar años" hint={`${years.length} ${years.length === 1 ? "año" : "años"}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-2 py-1.5 font-medium">Año</th>
                <th className="px-2 py-1.5 text-right font-medium">Microtalleres</th>
                <th className="px-2 py-1.5 text-right font-medium">Eventos</th>
                <th className="px-2 py-1.5 text-right font-medium">Inscritos</th>
                <th className="px-2 py-1.5 text-right font-medium">Asistentes</th>
                <th className="px-2 py-1.5 text-right font-medium">Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {years.map((y) => {
                const t = summarize(events.filter((e) => yearOf(e.date) === y));
                return (
                  <tr key={y} className={cn("border-t border-border tabular-nums", y === year && "bg-muted/50 font-medium")}>
                    <td className="px-2 py-2">
                      <button type="button" onClick={() => setYear(y)} className="press text-primary underline underline-offset-2">
                        {y}
                      </button>
                    </td>
                    <td className="px-2 py-2 text-right">{t.microtalleres}</td>
                    <td className="px-2 py-2 text-right">{t.eventos}</td>
                    <td className="px-2 py-2 text-right">{t.registered || "·"}</td>
                    <td className="px-2 py-2 text-right">{t.attended || "·"}</td>
                    <td className="px-2 py-2 text-right">{t.rate != null ? `${t.rate} %` : "·"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Fold>
    </div>
  );
}
