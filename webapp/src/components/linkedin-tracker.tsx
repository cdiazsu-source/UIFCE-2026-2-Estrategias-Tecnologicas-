"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, ExternalLink, Linkedin, Pencil, Plus, Trash2 } from "lucide-react";

import {
  addLinkedInSnapshot,
  addLinkedInTrackee,
  deleteLinkedInSnapshot,
  deleteLinkedInTrackee,
  setLinkedInTrackeeUrl,
  updateLinkedInSnapshot,
  updateLinkedInTrackee,
} from "@/lib/actions/linkedin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PersonAvatar } from "@/components/person-avatar";
import { InfoHint } from "@/components/info-hint";
import { LinkedInProfileTemplate } from "@/components/linkedin-profile-template";
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
  /** Respuestas ya guardadas de la plantilla de perfil, por clave de pregunta. */
  profileAnswers: Record<string, string>;
};

type FieldDef = { key: string; label: string; max?: number; hint: string };

/** Las 4 tarjetas de "Supervisa el rendimiento" en Analíticas de la app de
 *  LinkedIn — lo único que hace falta mirar en el celular de la persona para
 *  una captura rápida. Van primero y destacadas en el formulario. */
const QUICK_FIELDS: FieldDef[] = [
  {
    key: "impressions",
    label: "Impresiones (7 días)",
    hint: "Qué mide: cuántas veces se mostraron tus publicaciones en la pantalla de otras personas en los últimos 7 días (no son clics, solo que aparecieron en su feed). Dónde se ve: en la app, toca tu foto de perfil → «Analíticas» → tarjeta «Supervisa el rendimiento» → «Impresiones de la publicación en 7 días».",
  },
  {
    key: "followers",
    label: "Total de seguidores",
    hint: "Qué mide: el total acumulado de personas que siguen tu perfil y ven lo que publicas — incluye gente que no es tu conexión directa (a diferencia de «Conexiones»). Dónde se ve: foto de perfil → «Analíticas» → «Supervisa el rendimiento» → «Total de seguidores».",
  },
  {
    key: "profileViews",
    label: "Visualizaciones del perfil (90 días)",
    hint: "Qué mide: cuántas veces entraron a ver tu perfil completo (no solo una publicación) en los últimos 90 días. Dónde se ve: foto de perfil → «Analíticas» → «Supervisa el rendimiento» → «Visualizaciones de tu perfil en 90 días».",
  },
  {
    key: "searchAppearances",
    label: "Apariciones en búsquedas (7 días)",
    hint: "Qué mide: cuántas veces tu perfil salió como resultado cuando alguien buscó en LinkedIn, en los últimos 7 días. Dónde se ve: foto de perfil → «Analíticas» → «Supervisa el rendimiento» → «Apariciones en búsquedas».",
  },
];
/** Métricas opcionales, plegadas: se llenan si hay tiempo de seguir mirando
 *  el perfil, no son necesarias para una captura ágil. */
const MORE_FIELDS: FieldDef[] = [
  {
    key: "profileScore",
    label: "Profile score (0–100)",
    max: 100,
    hint: "Qué es: no es un número que LinkedIn muestre — es una nota manual de 0 a 100 que le pones al perfil a tu propio criterio (foto, banner, titular, extracto, experiencia, habilidades…), mirándolo de arriba a abajo. Sirve para comparar mes a mes qué tan trabajado está.",
  },
  {
    key: "connections",
    label: "Conexiones",
    hint: "Qué mide: personas con las que tienes conexión directa (aceptaron tu invitación o tú la de ellas) — distinto de «seguidores», que puede incluir gente sin conexión directa. Dónde se ve: en tu propio perfil, justo debajo de tu nombre («500+ contactos» o el número exacto si son menos).",
  },
  {
    key: "ssi",
    label: "SSI (Sales Navigator)",
    hint: "Qué es: el Social Selling Index, un puntaje de 0 a 100 que mide qué tan bien usas LinkedIn para construir marca y relaciones (no viene en la pestaña «Analíticas» del celular). Dónde se ve: entrando desde el navegador a linkedin.com/sales/ssi con la cuenta de la persona.",
  },
  {
    key: "postsLast30",
    label: "Publicaciones (últimos 30 d)",
    hint: "Qué mide: cuántas publicaciones propias hizo la persona en el último mes (conteo manual, LinkedIn no da este número directo). Dónde se ve: en su perfil → «Actividad» → pestaña «Publicaciones», contando las que tienen fecha dentro de los últimos 30 días.",
  },
  {
    key: "engagementLast30",
    label: "Interacciones (últimos 30 d)",
    hint: "Qué mide: la suma de reacciones + comentarios + veces compartido que recibieron sus publicaciones del último mes. Dónde se ve: foto de perfil → «Analíticas» → «Análisis de contenido» → sección «Interacción» de cada publicación (o el acumulado del período).",
  },
  {
    key: "recommendations",
    label: "Recomendaciones",
    hint: "Qué mide: cuántas recomendaciones escritas por otras personas tiene visibles en su perfil (no autoevaluaciones ni aptitudes avaladas, son textos que alguien más escribió sobre ella). Dónde se ve: bajando en su propio perfil hasta la sección «Recomendaciones».",
  },
  {
    key: "certsPublished",
    label: "Certificados publicados",
    hint: "Qué mide: cuántos cursos o certificaciones tiene agregados en su perfil. Dónde se ve: bajando en su propio perfil hasta la sección «Licencias y certificaciones».",
  },
];
const NUM_FIELDS: FieldDef[] = [...QUICK_FIELDS, ...MORE_FIELDS];
const BOOL_FIELDS: FieldDef[] = [
  {
    key: "uifceExperience",
    label: "Tiene a la UIFCE como experiencia",
    hint: "Qué mide: si la persona agregó su paso por la UIFCE como experiencia laboral en su perfil — clave para que el paso por la Unidad quede como marca empleadora visible. Dónde se ve: en su perfil, sección «Experiencia»: ¿aparece la UIFCE listada ahí?",
  },
  {
    key: "creatorMode",
    label: "Modo creador activo",
    hint: "Qué es: un interruptor del perfil que, cuando está activo, agrega hashtags/temas destacados debajo del titular y cambia el botón principal de «Conectar» a «Seguir». Dónde se ve: entrando a su propio perfil — si ve esos temas destacados y el botón «Seguir», está activo.",
  },
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
  const hasMoreValues = MORE_FIELDS.some((f) => snapshot?.values[f.key] != null);

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

      <div className="rounded-lg border border-primary/25 bg-primary/5 p-2.5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
          Lo que se ve en «Analíticas» de LinkedIn
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-0.5 rounded-md bg-background p-2 text-xs text-muted-foreground shadow-sm">
              <span className="inline-flex items-center gap-1">
                {f.label}
                <InfoHint text={f.hint} />
              </span>
              <Input
                name={f.key}
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={(snapshot?.values[f.key] as number | undefined) ?? ""}
                placeholder="0"
                className="h-10 border-0 bg-transparent p-0 text-lg font-bold text-foreground placeholder:font-normal placeholder:text-muted-foreground/50 focus-visible:ring-0"
              />
            </label>
          ))}
        </div>
      </div>

      <details className="group" open={hasMoreValues}>
        <summary className="cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground">
          Más métricas (opcional)
        </summary>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MORE_FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                {f.label}
                <InfoHint text={f.hint} />
              </span>
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
        <div className="mt-3 flex flex-wrap gap-4">
          {BOOL_FIELDS.map((b) => (
            <label key={b.key} className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                name={b.key}
                defaultChecked={snapshot?.values[b.key] === true}
                className="h-3.5 w-3.5 rounded border-input accent-[hsl(var(--primary))]"
              />
              {b.label}
              <InfoHint text={b.hint} />
            </label>
          ))}
        </div>
      </details>

      <Textarea name="note" defaultValue={snapshot?.note ?? ""} placeholder="Nota (opcional)" className="min-h-[42px]" />
    </>
  );
}

/** Variación vs. la medición anterior registrada, al estilo de las flechitas
 *  "▲ 8 % vs. últimos 7 días" que muestra la propia app de LinkedIn. */
function Delta({ current, previous }: { current: number | null | undefined; previous: number | null | undefined }) {
  if (typeof current !== "number" || typeof previous !== "number") return null;
  const diff = current - previous;
  if (diff === 0) return <span className="text-muted-foreground">sin cambio</span>;
  if (previous === 0) {
    return <span className="text-success">▲ nuevo</span>;
  }
  const pct = Math.round((Math.abs(diff) / previous) * 100);
  return (
    <span className={diff > 0 ? "text-success" : "text-destructive"}>
      {diff > 0 ? "▲" : "▼"} {pct}%
    </span>
  );
}

/** Tarjeta grande al estilo "Supervisa el rendimiento" de LinkedIn: número
 *  destacado + variación vs. la medición anterior. */
function QuickStatCard({
  label,
  hint,
  value,
  previous,
}: {
  label: string;
  hint: string;
  value: number | boolean | null | undefined;
  previous: number | boolean | null | undefined;
}) {
  const v = typeof value === "number" ? value : null;
  const p = typeof previous === "number" ? previous : null;
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2">
      <p className="inline-flex items-center gap-1 text-[10px] leading-tight text-muted-foreground">
        {label}
        <InfoHint text={hint} />
      </p>
      <p className="text-lg font-bold leading-tight">{v != null ? num(v) : "—"}</p>
      <p className="text-[10px] leading-tight">
        <Delta current={v} previous={p} />
      </p>
    </div>
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

/** Editor solo del enlace de LinkedIn. Lo puede usar cualquiera con sesión
 *  (perfil completo o junior), no solo el perfil completo. */
function LinkedInUrlEdit({ trackee }: { trackee: TrackeeData }) {
  const canRecord = useCanRecordMetrics();
  const [editing, setEditing] = useState(false);

  if (!canRecord) return null;

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await setLinkedInTrackeeUrl(trackee.id, String(formData.get("linkedinUrl") ?? ""));
          setEditing(false);
        }}
        className="mt-1 flex items-center gap-1"
      >
        <Input
          name="linkedinUrl"
          type="url"
          defaultValue={trackee.linkedinUrl ?? ""}
          placeholder="https://www.linkedin.com/in/…"
          className="h-7 w-64 text-xs"
          autoFocus
        />
        <Button type="submit" size="sm">
          Guardar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
    >
      {trackee.linkedinUrl ? (
        <>
          <Pencil className="h-3 w-3" />
          Editar LinkedIn
        </>
      ) : (
        <>
          <Plus className="h-3 w-3" />
          Agregar LinkedIn
        </>
      )}
    </button>
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
  const forMonthIdx = asc.findIndex((s) => s.month === month);
  const forMonth = forMonthIdx >= 0 ? asc[forMonthIdx] : null;
  const prevSnapshot = forMonthIdx > 0 ? asc[forMonthIdx - 1] : null;
  const trend = asc.map((s) => s.values.profileScore).filter((v): v is number => typeof v === "number");
  const hasQuickData = forMonth ? QUICK_FIELDS.some((f) => forMonth.values[f.key] != null) : false;

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
            <LinkedInUrlEdit trackee={trackee} />
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
        {forMonth && hasQuickData && (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {QUICK_FIELDS.map((f) => (
              <QuickStatCard
                key={f.key}
                label={f.label}
                hint={f.hint}
                value={forMonth.values[f.key]}
                previous={prevSnapshot?.values[f.key]}
              />
            ))}
          </div>
        )}

        {forMonth ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {typeof forMonth.values.profileScore === "number" && <ScoreBar score={forMonth.values.profileScore} />}
            {MORE_FIELDS.filter((f) => f.key !== "profileScore" && forMonth.values[f.key] != null).map((f) => (
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
          <LinkedInProfileTemplate trackeeId={trackee.id} trackeeName={trackee.name} answers={trackee.profileAnswers} />
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
 *  la última medición registrada en Difusión digital. Ocupa el ancho de dos
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
          href="/difusion/digital"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-accent"
        >
          Editar en Difusión digital
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
              Aún no hay métricas de la página. Se registran en la tarjeta de LinkedIn de Difusión digital.
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
