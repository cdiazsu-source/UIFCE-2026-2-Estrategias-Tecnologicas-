"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Building2, Check, Clock, ExternalLink, GraduationCap, Linkedin, Pencil, Search, Trash2, UserPlus, X } from "lucide-react";

import { addAlumniBulk, deleteAlumnus, markAlumnusChecked, setAlumnusStatus, updateAlumnus } from "@/lib/actions/alumni";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCanEdit, useCanManageLeads } from "@/components/access-context";
import {
  ALUMNI_COHORT_SUGGESTIONS,
  ALUMNI_STATUSES,
  alumniProgress,
  alumniSearchUrl,
  foldName,
  parseAlumniRows,
} from "@/lib/alumni";
import { cn, formatDateTime } from "@/lib/utils";

export type AlumnusData = {
  id: string;
  name: string;
  cohort: string | null;
  area: string | null;
  degree: string | null;
  currentCompany: string | null;
  currentRole: string | null;
  linkedinUrl: string | null;
  status: string;
  notes: string | null;
  lastCheckedAt: string | null;
};

export type SourceLink = { label: string; url: string };

const STATUS_VARIANT: Record<string, "secondary" | "warning" | "success" | "outline"> = {
  POR_RASTREAR: "secondary",
  VERIFICADO: "warning",
  CONTACTADO: "warning",
  CONECTADO: "success",
  SIN_RESPUESTA: "outline",
};

/** Agregar egresados: se pegan los nombres (o las filas) que se copian del directorio y se guardan de una vez. */
function QuickAddAlumni({ onClose }: { onClose: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const parsed = useMemo(() => parseAlumniRows(text), [text]);
  const n = parsed.rows.length;

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setSaving(true);
        setError(null);
        setDone(null);
        try {
          const r = await addAlumniBulk(formData);
          if (r.ok) {
            setDone(r.message);
            setText("");
            formRef.current?.reset();
          } else {
            setError(r.error);
          }
        } catch {
          setError("No se pudo guardar. Revisa tu conexión (si usas la red del campus, prueba con WARP) e inténtalo de nuevo.");
        } finally {
          setSaving(false);
        }
      }}
      className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4"
    >
      <p className="text-sm font-semibold">Agregar egresados</p>
      <ol className="list-decimal space-y-0.5 pl-5 text-xs text-muted-foreground">
        <li>Abre un directorio con los botones «Directorios de origen» de arriba.</li>
        <li>Copia los nombres de la hoja (una columna) o las filas completas (Nombre, Carrera, Empresa, Cargo).</li>
        <li>Pégalos aquí, escribe el semestre del directorio y guarda. Luego completas el resto con el lápiz de cada fila.</li>
      </ol>

      <label className="flex flex-col gap-1 text-xs font-medium">
        Nombres o filas copiadas
        <Textarea
          name="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
            setDone(null);
          }}
          rows={5}
          placeholder={"Un egresado por línea, por ejemplo:\nMaría Pérez\nJuan Gómez\nAna Rodríguez"}
          className="bg-background text-sm font-normal"
        />
      </label>

      <div aria-live="polite" className="flex flex-col gap-0.5 text-xs">
        {n > 0 && (
          <p className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-success" aria-hidden />
            {n} {n === 1 ? "egresado detectado" : "egresados detectados"}
            {n <= 3 ? `: ${parsed.rows.map((r) => r.name).join(", ")}` : `, entre ellos ${parsed.rows[0].name}`}
          </p>
        )}
        {parsed.problems.slice(0, 3).map((p) => (
          <p key={p} className="text-warning">
            {p}.
          </p>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          name="cohort"
          list="alumni-cohorts"
          placeholder="Semestre del directorio (ej. 2025-2)"
          className="w-64 bg-background"
          aria-label="Semestre del directorio"
        />
        <datalist id="alumni-cohorts">
          {ALUMNI_COHORT_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Input name="area" placeholder="Área en la que fue monitor (opcional)" className="w-72 bg-background" aria-label="Área" />
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="rounded-md border border-success/40 bg-success/10 px-2.5 py-1.5 text-xs">
          {done} Puedes pegar más.
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Guardando…" : n > 1 ? `Guardar ${n} egresados` : "Guardar egresado"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Listo
        </Button>
      </div>
    </form>
  );
}

function AlumnusRow({ alumnus, interest }: { alumnus: AlumnusData; interest: boolean }) {
  const canEdit = useCanEdit();
  const canTrack = useCanManageLeads();
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(alumnus.status);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          const r = await updateAlumnus(alumnus.id, formData);
          if (r.ok) {
            setError(null);
            setEditing(false);
          } else {
            setError(r.error);
          }
        }}
        className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-input p-3"
      >
        <Input name="name" defaultValue={alumnus.name} required placeholder="Nombre" className="w-56" aria-label="Nombre" />
        <Input name="cohort" defaultValue={alumnus.cohort ?? ""} list="alumni-cohorts" placeholder="Semestre" className="w-36" aria-label="Semestre" />
        <Input name="area" defaultValue={alumnus.area ?? ""} placeholder="Área" className="w-32" aria-label="Área" />
        <Input name="degree" defaultValue={alumnus.degree ?? ""} placeholder="Carrera de graduación" className="w-56" aria-label="Carrera de graduación" />
        <Input name="currentCompany" defaultValue={alumnus.currentCompany ?? ""} placeholder="Empresa actual" className="w-52" aria-label="Empresa actual" />
        <Input name="currentRole" defaultValue={alumnus.currentRole ?? ""} placeholder="Cargo actual" className="w-52" aria-label="Cargo actual" />
        <Input
          name="linkedinUrl"
          inputMode="url"
          defaultValue={alumnus.linkedinUrl ?? ""}
          placeholder="Enlace de LinkedIn (linkedin.com/in/…)"
          className="w-72"
          aria-label="Enlace de LinkedIn"
        />
        <Select name="status" defaultValue={alumnus.status} className="w-48" aria-label="Estado">
          {ALUMNI_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
        <Input name="notes" defaultValue={alumnus.notes ?? ""} placeholder="Notas" className="w-64" aria-label="Notas" />
        {error && (
          <p role="alert" className="basis-full rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="sm">
          Guardar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </form>
    );
  }

  const current = [alumnus.currentRole, alumnus.currentCompany].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 font-medium">
          {alumnus.linkedinUrl ? (
            <a href={alumnus.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-link hover:underline">
              {alumnus.name}
              <Linkedin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            </a>
          ) : (
            <>
              <span>{alumnus.name}</span>
              <a
                href={alumniSearchUrl(alumnus.name)}
                target="_blank"
                rel="noopener noreferrer"
                title="Busca su perfil en LinkedIn para ver dónde trabaja hoy"
                className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-link hover:bg-accent"
              >
                <Search className="h-3 w-3" aria-hidden />
                Buscar su perfil
                <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
              </a>
            </>
          )}
          {alumnus.cohort && <Badge variant="outline">{alumnus.cohort}</Badge>}
          {alumnus.area && <Badge variant="secondary">{alumnus.area}</Badge>}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {alumnus.degree ? (
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3 w-3" aria-hidden />
              {alumnus.degree}
            </span>
          ) : (
            <span className="italic">Carrera sin registrar</span>
          )}
          {" · "}
          {current ? (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" aria-hidden />
              {current}
              {interest && (
                <span
                  title="Su empresa está entre las empresas de interés de Aliados"
                  className="ml-1 rounded-full border border-primary/40 px-1.5 text-[10px] font-semibold text-primary"
                >
                  empresa de interés
                </span>
              )}
            </span>
          ) : (
            <span className="italic">Trabajo actual sin registrar</span>
          )}
          {alumnus.notes ? ` · ${alumnus.notes}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {canTrack ? (
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              startTransition(() => setAlumnusStatus(alumnus.id, e.target.value));
            }}
            aria-label={`Estado de ${alumnus.name}`}
            className="h-8 w-44 text-xs"
          >
            {ALUMNI_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        ) : (
          <Badge variant={STATUS_VARIANT[alumnus.status] ?? "secondary"}>
            {ALUMNI_STATUSES.find((s) => s.id === alumnus.status)?.label ?? alumnus.status}
          </Badge>
        )}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden />
          {alumnus.lastCheckedAt ? `Revisado: ${formatDateTime(alumnus.lastCheckedAt)}` : "Sin revisar aún"}
        </span>
        {canTrack && (
          <>
            <Button type="button" size="sm" variant="outline" onClick={() => startTransition(() => markAlumnusChecked(alumnus.id))}>
              <Check className="h-3.5 w-3.5" />
              Revisado hoy
            </Button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label={`Editar a ${alumnus.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => startTransition(() => deleteAlumnus(alumnus.id))}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Eliminar a ${alumnus.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function AlumniTracker({
  alumni,
  interestCompanies,
  sourceLinks,
}: {
  alumni: AlumnusData[];
  /** Nombres de las empresas de interés de Aliados, para señalar a quienes trabajan en una. */
  interestCompanies: string[];
  /** Directorios UIFCE de origen (enlaces del proyecto). */
  sourceLinks: SourceLink[];
}) {
  const canTrack = useCanManageLeads();
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [cohort, setCohort] = useState("");
  const [status, setStatus] = useState("");

  const interestSet = useMemo(() => new Set(interestCompanies.map(foldName)), [interestCompanies]);
  const isInterest = (a: AlumnusData) => {
    const c = a.currentCompany ? foldName(a.currentCompany) : "";
    return !!c && [...interestSet].some((n) => c === n || c.includes(n) || n.includes(c));
  };

  const cohorts = useMemo(
    () => Array.from(new Set(alumni.flatMap((a) => (a.cohort ?? "").split(",").map((c) => c.trim()).filter(Boolean)))).sort().reverse(),
    [alumni],
  );
  const nq = foldName(q);
  const filtered = alumni.filter(
    (a) =>
      (!cohort || (a.cohort ?? "").split(",").map((c) => c.trim()).includes(cohort)) &&
      (!status || a.status === status) &&
      (!nq || [a.name, a.degree ?? "", a.currentCompany ?? "", a.currentRole ?? "", a.area ?? ""].some((f) => foldName(f).includes(nq))),
  );
  const prog = alumniProgress(alumni.map((a) => a.status));
  const interestCount = alumni.filter(isInterest).length;

  return (
    <div className="flex flex-col gap-4">
      {sourceLinks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Directorios de origen:</span>
          {sourceLinks.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-link hover:bg-accent"
            >
              {l.label}
              <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
            </a>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">
            {prog.verified} de {prog.total} {prog.total === 1 ? "egresado con su situación verificada" : "egresados con su situación verificada"}
          </p>
          <p className="text-2xl font-bold tabular-nums">{prog.percent}%</p>
        </div>
        <Progress value={prog.percent} className="mt-2 h-3" aria-label="Egresados con su situación actual verificada" />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {prog.contacted} {prog.contacted === 1 ? "contactado" : "contactados"}
          {interestCount > 0 ? ` · ${interestCount} ${interestCount === 1 ? "trabaja" : "trabajan"} en una empresa de interés` : ""}
        </p>
      </div>

      {canTrack &&
        (adding ? (
          <QuickAddAlumni onClose={() => setAdding(false)} />
        ) : (
          <Button size="lg" className="h-12 self-start px-6 text-base" onClick={() => setAdding(true)}>
            <UserPlus className="h-5 w-5" aria-hidden />
            Agregar egresados
          </Button>
        ))}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[13rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, carrera, empresa o cargo…" className="pl-8" aria-label="Buscar egresado" />
        </div>
        {cohorts.length > 0 && (
          <Select value={cohort} onChange={(e) => setCohort(e.target.value)} className="w-44" aria-label="Filtrar por semestre">
            <option value="">Todos los semestres</option>
            {cohorts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        )}
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-52" aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {ALUMNI_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
        {(q || cohort || status) && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setCohort("");
              setStatus("");
            }}
            className={cn("inline-flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent")}
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {alumni.length === 0 ? (
        <div className="rounded-lg border border-dashed border-input p-8 text-center">
          <p className="font-medium">Aún no hay egresados registrados</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Empieza abriendo un directorio, copiando los nombres de los antiguos monitores y pegándolos en «Agregar egresados».
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          Ningún egresado coincide con la búsqueda.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.length !== alumni.length && (
            <p className="text-xs text-muted-foreground">
              {filtered.length} de {alumni.length} egresados
            </p>
          )}
          {filtered.map((a) => (
            <AlumnusRow key={a.id} alumnus={a} interest={isInterest(a)} />
          ))}
        </div>
      )}
    </div>
  );
}
