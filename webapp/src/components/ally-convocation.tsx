"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Check, MessageSquare, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  createConvocationEvent,
  deleteConvocationEvent,
  setFollowUp,
  updateConvocationEvent,
} from "@/lib/actions/academic-allies";
import {
  ASKS,
  ASK_LABEL,
  FOLLOW_STATUSES,
  FOLLOW_STATUS_LABEL,
  norm,
  rankCandidates,
  type Ask,
  type Candidate,
  type EventInfo,
  type FollowStatus,
  type FollowUpInfo,
  type AllySupportRow,
} from "@/lib/convocation";
import { PROGRAMS, PROGRAM_ORDER } from "@/lib/mallas-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { InfoHint } from "@/components/info-hint";
import { Fold } from "@/components/ally-fold";
import { Textarea } from "@/components/ui/textarea";
import { useCanEdit, useCanManageLeads } from "@/components/access-context";

const ROMAN = PROGRAMS.economia.roman;

const STATUS_STYLE: Record<FollowStatus, string> = {
  POR_CONTACTAR: "bg-muted text-foreground",
  CONTACTADO: "bg-[#E6E6FF] text-[#000066]",
  ACEPTO: "bg-brand-accent text-brand-accent-foreground font-semibold",
  SIN_RESPUESTA: "border border-border text-muted-foreground",
  NO_DISPONIBLE: "border border-dashed border-border text-muted-foreground",
};

function programsText(e: EventInfo) {
  const names = e.programs.map((p) => PROGRAMS[p].tab);
  const who = names.length === 0 ? "Sin programa definido" : names.length === 3 ? "Los tres programas" : names.join(" y ");
  const sems = e.semFrom === 1 && e.semTo === 10 ? "todos los semestres" : `semestres ${ROMAN[e.semFrom - 1]} a ${ROMAN[e.semTo - 1]}`;
  return `${who} · ${sems}`;
}

function dateText(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" }) : null;
}

function EventForm({
  event,
  projectOptions,
  onDone,
}: {
  event?: EventInfo;
  projectOptions: { id: string; title: string }[];
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-border p-3"
      action={(fd) =>
        start(async () => {
          if (event) await updateConvocationEvent(event.id, fd);
          else await createConvocationEvent(fd);
          onDone();
        })
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Nombre del evento
          <Input name="name" required defaultValue={event?.name ?? ""} className="text-sm font-normal text-foreground" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Fecha (opcional)
          <Input name="eventDate" type="date" defaultValue={event?.eventDate?.slice(0, 10) ?? ""} className="text-sm font-normal text-foreground" />
        </label>
      </div>
      <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <legend className="mb-1 text-xs font-medium text-muted-foreground">Programas a los que va dirigido</legend>
        {PROGRAM_ORDER.map((k) => (
          <label key={k} className="inline-flex items-center gap-1.5">
            <input type="checkbox" name="programs" value={k} defaultChecked={event ? event.programs.includes(k) : true} />
            {PROGRAMS[k].tab}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Desde el semestre
          <Select name="semFrom" defaultValue={String(event?.semFrom ?? 1)} className="text-sm font-normal text-foreground">
            {ROMAN.map((r, i) => (
              <option key={r} value={i + 1}>
                {r}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Hasta el semestre
          <Select name="semTo" defaultValue={String(event?.semTo ?? 10)} className="text-sm font-normal text-foreground">
            {ROMAN.map((r, i) => (
              <option key={r} value={i + 1}>
                {r}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Proyecto del PMO
          <Select name="projectId" defaultValue={event?.projectId ?? ""} className="text-sm font-normal text-foreground">
            <option value="">Sin proyecto</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        Temas (software o asignatura, separados por coma; sirven para priorizar a quien ya trabaja con ellos)
        <Input name="topics" defaultValue={event?.topics.join(", ") ?? ""} placeholder="Power BI, Excel" className="text-sm font-normal text-foreground" />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        Notas
        <Textarea name="notes" rows={2} defaultValue={event?.notes ?? ""} className="text-sm font-normal text-foreground" />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {event ? "Guardar evento" : "Crear evento"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function CandidateRow({ eventId, c, follow }: { eventId: string; c: Candidate; follow?: FollowUpInfo }) {
  const canManage = useCanManageLeads();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<FollowStatus>(follow?.status ?? "POR_CONTACTAR");
  const [ask, setAsk] = useState<Ask>(follow?.ask ?? c.ask);
  const [note, setNote] = useState(follow?.note ?? "");
  const [saved, setSaved] = useState(false);
  const [showNote, setShowNote] = useState(Boolean(follow?.note));
  const dirty = status !== (follow?.status ?? "POR_CONTACTAR") || ask !== (follow?.ask ?? c.ask) || note !== (follow?.note ?? "");

  return (
    <tr className="border-t border-border align-top">
      <td className="px-2 py-2">
        <div className="font-medium">{c.name}</div>
        <ul className="text-xs text-muted-foreground">
          {c.courses.slice(0, 3).map((k, i) => (
            <li key={i}>
              {k.course}
              {k.semester > 0 ? ` · ${ROMAN[k.semester - 1]}` : ""}
              {k.software.length ? ` · ${k.software.join(", ")}` : ""}
            </li>
          ))}
          {c.courses.length > 3 && <li>y {c.courses.length - 3} más</li>}
        </ul>
      </td>
      <td className="px-2 py-2 text-xs text-muted-foreground">{c.reason}</td>
      <td className="px-2 py-2">
        <Select
          value={ask}
          onChange={(e) => {
            setAsk(e.target.value as Ask);
            setSaved(false);
          }}
          disabled={!canManage}
          className="h-8 min-w-[10.5rem] text-xs"
          aria-label={`Qué pedirle a ${c.name}`}
        >
          {ASKS.map((a) => (
            <option key={a} value={a}>
              {ASK_LABEL[a]}
              {a === c.ask ? " (sugerido)" : ""}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-2 py-2">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as FollowStatus);
            setSaved(false);
          }}
          disabled={!canManage}
          className={cn("h-8 min-w-[8.5rem] text-xs", STATUS_STYLE[status])}
          aria-label={`Estado de ${c.name}`}
        >
          {FOLLOW_STATUSES.map((s) => (
            <option key={s} value={s}>
              {FOLLOW_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        {follow?.contactedAt && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {dateText(follow.contactedAt)}
            {follow.updatedBy ? ` · ${follow.updatedBy}` : ""}
          </div>
        )}
      </td>
      <td className="px-2 py-2">
        {showNote ? (
          <Input
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
            disabled={!canManage}
            placeholder="Nota"
            autoFocus={!follow?.note}
            className="h-8 min-w-[11rem] text-xs"
            aria-label={`Nota sobre ${c.name}`}
          />
        ) : (
          canManage && (
            <button
              type="button"
              onClick={() => setShowNote(true)}
              aria-label={`Agregar nota sobre ${c.name}`}
              title="Agregar nota"
              className="press inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          )
        )}
      </td>
      <td className="px-2 py-2">
        {canManage && (
          <Button
            type="button"
            size="sm"
            variant={dirty ? "default" : "outline"}
            disabled={pending || !dirty}
            onClick={() =>
              start(async () => {
                await setFollowUp(eventId, c.allyId, { status, ask, note });
                setSaved(true);
              })
            }
          >
            {saved && !dirty ? <Check className="h-3.5 w-3.5" aria-label="Guardado" /> : "Guardar"}
          </Button>
        )}
      </td>
    </tr>
  );
}

/** Vista «Convocatoria»: elige un evento y ve a qué profesores conviene contactar, con la petición sugerida y el seguimiento. */
export function ConvocationView({
  events,
  supports,
  followUps,
  projectOptions,
}: {
  events: EventInfo[];
  supports: AllySupportRow[];
  followUps: FollowUpInfo[];
  projectOptions: { id: string; title: string }[];
}) {
  const canEdit = useCanEdit();
  const [selected, setSelected] = useState(events[0]?.id ?? "");
  const [form, setForm] = useState<"new" | "edit" | null>(null);
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FollowStatus | "todos">("todos");
  const [q, setQ] = useState("");

  const event = events.find((e) => e.id === selected) ?? events[0];
  const candidates = useMemo(() => (event ? rankCandidates(event, supports) : []), [event, supports]);
  const followMap = new Map(followUps.filter((f) => f.eventId === event?.id).map((f) => [f.allyId, f]));
  const count = (s: FollowStatus) => candidates.filter((c) => (followMap.get(c.allyId)?.status ?? "POR_CONTACTAR") === s).length;
  const nq = norm(q.trim());
  const visible = candidates.filter(
    (c) =>
      (statusFilter === "todos" || (followMap.get(c.allyId)?.status ?? "POR_CONTACTAR") === statusFilter) &&
      (!nq || norm(c.name).includes(nq)),
  );
  const project = event?.projectId ? projectOptions.find((p) => p.id === event.projectId) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {events.length > 0 && (
          <Select
            value={event?.id ?? ""}
            onChange={(e) => {
              setSelected(e.target.value);
              setForm(null);
              setConfirmDelete(false);
              setStatusFilter("todos");
            }}
            className="w-auto min-w-[14rem] text-sm font-medium"
            aria-label="Evento"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        )}
        {canEdit && (
          <Button type="button" size="sm" variant="outline" onClick={() => setForm("new")}>
            <Plus className="h-3.5 w-3.5" />
            Nuevo evento
          </Button>
        )}
        <InfoHint text="Elige un evento: la lista ordena a los profesores que conviene contactar según el programa y los semestres a los que va dirigido y su apoyo reciente, y sugiere qué pedirle: una sesión en su clase (apoyo en 2026-2 con el mismo tema del evento), anunciarlo en clase (apoyo en 2026-1 o 2026-2) o reenviar la invitación (el resto). La petición se puede cambiar en cada fila." />
      </div>

      {form === "new" && <EventForm projectOptions={projectOptions} onDone={() => setForm(null)} />}

      {!event && <p className="text-sm text-muted-foreground">Todavía no hay eventos. {canEdit ? "Crea el primero con «Nuevo evento»." : ""}</p>}

      {event && form !== "new" && (
        <>
          {form === "edit" ? (
            <EventForm event={event} projectOptions={projectOptions} onDone={() => setForm(null)} />
          ) : (
            <Fold title="Detalles del evento" hint={programsText(event)}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5 text-sm">
                  {event.topics.length > 0 && <span className="text-muted-foreground">Temas: {event.topics.join(", ")}</span>}
                  {event.eventDate && <span className="text-muted-foreground">Fecha: {dateText(event.eventDate)}</span>}
                  {event.notes && <span className="whitespace-pre-wrap text-muted-foreground">{event.notes}</span>}
                  {project && (
                    <Link href={`/proyectos/${project.id}`} className="text-link underline-offset-2 hover:underline">
                      Proyecto: {project.title}
                    </Link>
                  )}
                  {event.topics.length === 0 && !event.eventDate && !event.notes && !project && (
                    <span className="text-muted-foreground">Sin temas, fecha ni proyecto todavía.</span>
                  )}
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1.5">
                    <Button type="button" size="sm" variant="outline" onClick={() => setForm("edit")}>
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    {confirmDelete ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={pending}
                          onClick={() =>
                            start(async () => {
                              await deleteConvocationEvent(event.id);
                              setConfirmDelete(false);
                              setSelected("");
                            })
                          }
                        >
                          Eliminar con su seguimiento
                        </Button>
                        <Button type="button" size="sm" variant="ghost" aria-label="Cancelar" onClick={() => setConfirmDelete(false)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button type="button" size="sm" variant="ghost" aria-label="Eliminar evento" onClick={() => setConfirmDelete(true)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Fold>
          )}

          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ningún profesor aliado coincide con ese programa y esos semestres. Amplía el rango del evento.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[12rem] flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar profesor…" className="pl-8" aria-label="Buscar profesor" />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as FollowStatus | "todos")}
                  className="w-auto text-sm"
                  aria-label="Estado del seguimiento"
                >
                  <option value="todos">Todos ({candidates.length})</option>
                  {FOLLOW_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {FOLLOW_STATUS_LABEL[s]} ({count(s)})
                    </option>
                  ))}
                </Select>
                {(q || statusFilter !== "todos") && (
                  <button
                    type="button"
                    onClick={() => {
                      setQ("");
                      setStatusFilter("todos");
                    }}
                    className="press text-xs text-primary underline underline-offset-2"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              {visible.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ningún profesor coincide con ese filtro.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[48rem] border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="px-2 py-1.5 font-medium">Profesor</th>
                        <th className="px-2 py-1.5 font-medium">Por qué</th>
                        <th className="px-2 py-1.5 font-medium">Pedirle</th>
                        <th className="px-2 py-1.5 font-medium">Estado</th>
                        <th className="px-2 py-1.5 font-medium">Nota</th>
                        <th className="px-2 py-1.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((c) => (
                        <CandidateRow key={`${event.id}-${c.allyId}`} eventId={event.id} c={c} follow={followMap.get(c.allyId)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
