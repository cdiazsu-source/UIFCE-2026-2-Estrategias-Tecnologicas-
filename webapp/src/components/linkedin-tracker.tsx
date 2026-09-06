"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, ExternalLink, Linkedin, Pencil, Plus, Trash2 } from "lucide-react";

import {
  addLinkedInSnapshot,
  addLinkedInTrackee,
  deleteLinkedInSnapshot,
  deleteLinkedInTrackee,
  updateLinkedInSnapshot,
  updateLinkedInTrackee,
} from "@/lib/actions/linkedin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PersonAvatar } from "@/components/person-avatar";
import { useCanEdit, useCanRecordMetrics } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";
import { formatDate } from "@/lib/utils";

export type SnapshotData = {
  id: string;
  month: string;
  note: string | null;
  recordedByName: string | null;
  values: Record<string, number | boolean | null>;
};

export type TrackeeData = {
  id: string;
  name: string;
  linkedinUrl: string | null;
  area: string | null;
  level: string | null;
  active: boolean;
  /** true si es del área ET (para el anillo de color del avatar). */
  isET: boolean;
  photoUrl: string | null;
  color: string | null;
  snapshots: SnapshotData[];
};

type FieldDef = { key: string; label: string; max?: number };

const NUM_FIELDS: FieldDef[] = [
  { key: "profileScore", label: "Profile score (0–100)", max: 100 },
  { key: "connections", label: "Conexiones" },
  { key: "followers", label: "Seguidores" },
  { key: "ssi", label: "SSI (Sales Navigator)" },
  { key: "postsLast30", label: "Publicaciones (últimos 30 d)" },
  { key: "engagementLast30", label: "Interacciones (últimos 30 d)" },
  { key: "recommendations", label: "Recomendaciones" },
  { key: "certsPublished", label: "Certificados publicados" },
];
const BOOL_FIELDS: FieldDef[] = [
  { key: "uifceExperience", label: "Tiene a la UIFCE como experiencia" },
  { key: "creatorMode", label: "Modo creador activo" },
];

const LEVEL_LABEL: Record<string, string> = {
  direction: "Dirección",
  coordination: "Coordinación",
  lead: "Liderazgo",
  master: "Máster",
  junior: "Junior",
};
const LEVEL_OPTIONS = ["direction", "coordination", "lead", "master", "junior"];
/** Orden de aparición: Dirección → Coordinación → Liderazgo → Máster → resto. */
const LEVEL_RANK: Record<string, number> = {
  direction: 0,
  coordination: 1,
  lead: 2,
  master: 3,
  junior: 4,
};

export type OrgSummary = {
  handle: string | null;
  url: string | null;
  followers: number | null;
  metricAt: Date | null;
  metrics: { label: string; value: number | null }[];
} | null;

function num(v: number | boolean | null | undefined): string {
  if (typeof v === "number") return v.toLocaleString("es-CO");
  return "—";
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(m: string): string {
  const [y, mm] = m.split("-");
  const names = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const i = Number(mm) - 1;
  return names[i] ? `${names[i]} ${y}` : m;
}

/** Mini línea de tendencia sin librerías. */
function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 120;
  const h = 26;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * (w - 2) + 1;
      const y = h - 1 - ((v - min) / span) * (h - 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 text-primary" role="img" aria-label="Tendencia">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function SnapshotFields({ snapshot }: { snapshot?: SnapshotData }) {
  return (
    <>
      <Input
        name="month"
        type="month"
        defaultValue={snapshot?.month ?? currentMonth()}
        required
        className="w-44"
        aria-label="Mes de la medición"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {NUM_FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {f.label}
            <Input
              name={f.key}
              type="number"
              min={0}
              max={f.max}
              inputMode="numeric"
              defaultValue={(snapshot?.values[f.key] as number | undefined) ?? ""}
              placeholder="0"
              className="h-8"
            />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {BOOL_FIELDS.map((b) => (
          <label key={b.key} className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              name={b.key}
              defaultChecked={snapshot?.values[b.key] === true}
              className="h-3.5 w-3.5 rounded border-input accent-[hsl(var(--primary))]"
            />
            {b.label}
          </label>
        ))}
      </div>
      <Textarea name="note" defaultValue={snapshot?.note ?? ""} placeholder="Nota (opcional)" className="min-h-[42px]" />
    </>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color = pct >= 75 ? "hsl(var(--success))" : pct >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium">{pct}</span>
    </div>
  );
}

function HistoryRow({ trackee, snapshot }: { trackee: TrackeeData; snapshot: SnapshotData }) {
  const canRecord = useCanRecordMetrics();
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="rounded-md border border-border p-3">
        <form
          action={async (formData) => {
            const u = await updateLinkedInSnapshot(snapshot.id, formData);
            if (u) undo(u);
            setEditing(false);
          }}
          className="flex flex-col gap-2"
        >
          <SnapshotFields snapshot={snapshot} />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Guardar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-start justify-between gap-3 rounded-md border-l-2 border-primary/30 py-1.5 pl-3 pr-1 text-xs">
      <div className="min-w-0">
        <span className="font-medium text-muted-foreground">{monthLabel(snapshot.month)}</span>
        <span className="ml-2 flex flex-wrap gap-x-3 gap-y-0.5">
          {NUM_FIELDS.map((f) =>
            snapshot.values[f.key] != null ? (
              <span key={f.key}>
                <span className="text-muted-foreground">{f.label.split(" (")[0]}:</span>{" "}
                <span className="font-medium">{num(snapshot.values[f.key])}</span>
              </span>
            ) : null,
          )}
          {snapshot.values.uifceExperience === true && <span className="text-success">UIFCE en experiencia</span>}
          {snapshot.values.creatorMode === true && <span className="text-success">modo creador</span>}
        </span>
        {snapshot.recordedByName && <span className="ml-2 text-muted-foreground">· {snapshot.recordedByName}</span>}
        {snapshot.note && <p className="mt-0.5 text-muted-foreground">{snapshot.note}</p>}
      </div>
      {(canRecord || canEdit) && (
        <span className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {canRecord && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label="Editar medición"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm("¿Eliminar esta medición?")) return;
                startTransition(async () => {
                  const u = await deleteLinkedInSnapshot(snapshot.id);
                  if (u) undo(u);
                });
              }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              aria-label="Eliminar medición"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </span>
      )}
    </li>
  );
}

function TrackeeCard({
  trackee,
  month,
  people,
}: {
  trackee: TrackeeData;
  month: string;
  people: { id: string; name: string }[];
}) {
  const canRecord = useCanRecordMetrics();
  const canEdit = useCanEdit();
  const [adding, setAdding] = useState(false);
  const [editingCard, setEditingCard] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const asc = [...trackee.snapshots].sort((a, b) => a.month.localeCompare(b.month));
  const desc = [...asc].reverse();
  const forMonth = asc.find((s) => s.month === month) ?? null;
  const trend = asc.map((s) => s.values.profileScore).filter((v): v is number => typeof v === "number");

  if (editingCard) {
    return (
      <Card>
        <CardContent className="pt-5">
          <form
            action={async (formData) => {
              await updateLinkedInTrackee(trackee.id, formData);
              setEditingCard(false);
            }}
            className="flex flex-col gap-2"
          >
            <div className="flex flex-wrap gap-2">
              <Input name="name" defaultValue={trackee.name} placeholder="Nombre" className="min-w-[14rem] flex-1" />
              <Input name="area" defaultValue={trackee.area ?? ""} placeholder="Área (ET, CL…)" className="w-32" />
              <Select name="level" defaultValue={trackee.level ?? ""} className="w-40">
                <option value="">Sin nivel</option>
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {LEVEL_LABEL[l]}
                  </option>
                ))}
              </Select>
            </div>
            <Input name="linkedinUrl" type="url" defaultValue={trackee.linkedinUrl ?? ""} placeholder="URL de LinkedIn" />
            <Select name="active" defaultValue={String(trackee.active)} className="w-32">
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Guardar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCard(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <PersonAvatar
            name={trackee.name}
            photoUrl={trackee.photoUrl}
            size="md"
            ringColor={trackee.isET ? trackee.color : null}
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-semibold">
              {trackee.linkedinUrl ? (
                <a
                  href={trackee.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate hover:text-primary hover:underline"
                >
                  {trackee.name}
                </a>
              ) : (
                <span className="truncate">{trackee.name}</span>
              )}
              {trackee.linkedinUrl && <Linkedin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {trackee.level && <span>{LEVEL_LABEL[trackee.level] ?? trackee.level}</span>}
              {trackee.area && <span>· {trackee.area}</span>}
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setEditingCard(true)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label="Editar ficha"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm(`¿Quitar a ${trackee.name} del tracker? Se borran sus mediciones.`)) return;
                startTransition(() => deleteLinkedInTrackee(trackee.id));
              }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              aria-label="Quitar del tracker"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {forMonth ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {typeof forMonth.values.profileScore === "number" && <ScoreBar score={forMonth.values.profileScore} />}
            {NUM_FIELDS.filter((f) => f.key !== "profileScore" && forMonth.values[f.key] != null).map((f) => (
              <span key={f.key} className="text-xs">
                <span className="text-muted-foreground">{f.label.split(" (")[0]}:</span>{" "}
                <span className="font-medium">{num(forMonth.values[f.key])}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Sin medición para {monthLabel(month)}.</p>
        )}

        {trend.length >= 2 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Spark points={trend} />
            <span>
              Profile score: {num(trend[0])} → {num(trend[trend.length - 1])}
            </span>
          </div>
        )}

        {justSaved && (
          <p className="flex items-center gap-1 text-xs font-medium text-success" role="status">
            <Check className="h-3.5 w-3.5" />
            Medición registrada.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {canRecord && !adding && (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5" />
              Registrar medición
            </Button>
          )}
          {trackee.snapshots.length > 0 && (
            <button
              type="button"
              onClick={() => setOpenHistory((o) => !o)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openHistory ? "rotate-180" : ""}`} />
              Historial ({trackee.snapshots.length})
            </button>
          )}
        </div>

        {canRecord && adding && (
          <form
            key={formKey}
            action={async (formData) => {
              await addLinkedInSnapshot(trackee.id, formData);
              setAdding(false);
              setJustSaved(true);
              setFormKey((k) => k + 1);
              setTimeout(() => setJustSaved(false), 4000);
            }}
            className="flex flex-col gap-2 rounded-md border border-dashed border-input p-3"
          >
            <SnapshotFields snapshot={forMonth ?? undefined} />
            <Select name="recordedById" defaultValue="" required className="w-full sm:w-60" aria-label="Quién registra">
              <option value="" disabled>
                ¿Quién registra?
              </option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Guardar medición
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {openHistory && (
          <ul className="mt-1 flex flex-col gap-1.5">
            {desc.map((s) => (
              <HistoryRow key={s.id} trackee={trackee} snapshot={s} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Tarjeta de la página institucional de LinkedIn: resumen de solo lectura de
 *  la última medición registrada en Redes sociales. Ocupa el ancho de dos
 *  tarjetas y va primera. */
function OrgCard({ org }: { org: NonNullable<OrgSummary> }) {
  return (
    <Card className="border-primary/30 lg:col-span-2">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Linkedin className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">LinkedIn de la Unidad de Informática (UIFCE)</p>
            <p className="text-xs text-muted-foreground">
              {org.url ? (
                <a
                  href={org.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                >
                  {org.handle ?? "Página institucional"}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                org.handle ?? "Página institucional"
              )}
              {org.metricAt ? ` · última medición ${formatDate(org.metricAt)}` : " · sin mediciones aún"}
            </p>
          </div>
        </div>
        <Link
          href="/redes"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-accent"
        >
          Editar en Redes sociales
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {org.followers != null && (
            <span className="text-sm">
              <span className="text-muted-foreground">Seguidores:</span>{" "}
              <span className="font-medium">{num(org.followers)}</span>
            </span>
          )}
          {org.metrics
            .filter((m) => m.value != null)
            .map((m) => (
              <span key={m.label} className="text-sm">
                <span className="text-muted-foreground">{m.label}:</span>{" "}
                <span className="font-medium">{num(m.value)}</span>
              </span>
            ))}
          {org.followers == null && org.metrics.every((m) => m.value == null) && (
            <span className="text-sm text-muted-foreground">
              Aún no hay métricas de la página. Se registran en la tarjeta de LinkedIn de Redes sociales.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function LinkedInTracker({
  trackees,
  people,
  org,
}: {
  trackees: TrackeeData[];
  people: { id: string; name: string }[];
  org: OrgSummary;
}) {
  const canEdit = useCanEdit();
  const [adding, setAdding] = useState(false);
  const [area, setArea] = useState("");

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const t of trackees) for (const s of t.snapshots) set.add(s.month);
    set.add(currentMonth());
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [trackees]);

  const [month, setMonth] = useState(months[0]);

  const areas = useMemo(
    () => [...new Set(trackees.map((t) => t.area).filter((a): a is string => !!a))].sort(),
    [trackees],
  );

  // Orden: Dirección → Coordinación → Liderazgo → Máster → resto; luego por nombre.
  const ordered = useMemo(
    () =>
      [...trackees].sort(
        (a, b) =>
          (LEVEL_RANK[a.level ?? ""] ?? 9) - (LEVEL_RANK[b.level ?? ""] ?? 9) ||
          a.name.localeCompare(b.name, "es"),
      ),
    [trackees],
  );

  const shown = area ? ordered.filter((t) => t.area === area) : ordered;
  const active = shown.filter((t) => t.active !== false);
  const inactive = shown.filter((t) => t.active === false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Mes:</span>
        <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" aria-label="Mes">
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </Select>
        <Select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-44"
          aria-label="Filtrar por área"
        >
          <option value="">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
        <span className="text-xs text-muted-foreground">
          {shown.length} personas · datos manuales, sin API.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {org && !area && <OrgCard org={org} />}
        {active.map((t) => (
          <TrackeeCard key={t.id} trackee={t} month={month} people={people} />
        ))}
      </div>

      {inactive.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">Inactivos ({inactive.length})</summary>
          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {inactive.map((t) => (
              <TrackeeCard key={t.id} trackee={t} month={month} people={people} />
            ))}
          </div>
        </details>
      )}

      {canEdit && (
        <div>
          {adding ? (
            <form
              action={async (formData) => {
                await addLinkedInTrackee(formData);
                setAdding(false);
              }}
              className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-input p-3"
            >
              <Input name="name" placeholder="Nombre" required className="w-48" />
              <Input name="area" placeholder="Área" className="w-24" />
              <Select name="level" defaultValue="" className="w-36">
                <option value="">Sin nivel</option>
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {LEVEL_LABEL[l]}
                  </option>
                ))}
              </Select>
              <Input name="linkedinUrl" type="url" placeholder="URL de LinkedIn" className="w-56" />
              <Button type="submit" size="sm">
                Agregar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                Cancelar
              </Button>
            </form>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5" />
              Agregar persona al tracker
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
