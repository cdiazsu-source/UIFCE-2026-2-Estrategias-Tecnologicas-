"use client";

import { useEffect, useState, useTransition } from "react";
import { BarChart3, Check, Pencil, Plus, Trash2 } from "lucide-react";
import type { SocialPlatform } from "@prisma/client";

import { addSocialMetric, deleteSocialMetric, updateSocialMetric } from "@/lib/actions/social-metrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InfoHint } from "@/components/info-hint";
import { useCanEdit, useCanRecordMetrics } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";
import { formatDate } from "@/lib/utils";

export type SocialMetricData = {
  id: string;
  at: Date;
  recordedByName: string | null;
  note: string | null;
  values: Record<string, number | null>;
};

type MetricDef = { key: string; label: string; short: string };

/** Campos medibles de Instagram, en el orden en que se piden. */
const IG_METRICS: MetricDef[] = [
  { key: "igFollowers", label: "Seguidores totales", short: "Seguidores" },
  { key: "igReach", label: "Alcance (reach)", short: "Alcance" },
  { key: "igImpressions", label: "Impresiones", short: "Impresiones" },
  {
    key: "igInteractions",
    label: "Interacciones totales (likes + comentarios + guardados + compartidos)",
    short: "Interacciones",
  },
  { key: "igProfileVisits", label: "Visitas al perfil", short: "Visitas al perfil" },
];

/** Campos medibles de LinkedIn, en el orden en que se piden. */
const LI_METRICS: MetricDef[] = [
  { key: "liFollowers", label: "Seguidores / contactos totales", short: "Seguidores" },
  { key: "liProfileViews", label: "Visualizaciones del perfil", short: "Vis. perfil" },
  { key: "liPostImpressions", label: "Impresiones de publicaciones", short: "Impres. pub." },
  { key: "liInteractions", label: "Interacciones (reacciones + comentarios + reposteos)", short: "Interacciones" },
  { key: "liSearchAppearances", label: "Apariciones en resultados de búsqueda", short: "En búsquedas" },
];

function metricsFor(platform: SocialPlatform): MetricDef[] {
  if (platform === "INSTAGRAM") return IG_METRICS;
  if (platform === "LINKEDIN") return LI_METRICS;
  return [];
}

function fmt(n: number | null | undefined): string {
  return n != null ? n.toLocaleString("es-CO") : "—";
}

/** Mini gráfica de línea sin librerías: escala los valores al viewBox. */
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 132;
  const h = 30;
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
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0 text-primary"
      role="img"
      aria-label="Tendencia reciente"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MetricFields({ metrics, row }: { metrics: MetricDef[]; row?: SocialMetricData }) {
  return (
    <>
      <Input
        name="at"
        type="date"
        defaultValue={(row ? row.at : new Date()).toISOString().slice(0, 10)}
        className="w-40"
        aria-label="Fecha de la medición"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {metrics.map((m) => (
          <label key={m.key} className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {m.label}
            <Input
              name={m.key}
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={row?.values[m.key] ?? ""}
              placeholder="0"
              className="h-8"
            />
          </label>
        ))}
      </div>
      <Textarea
        name="note"
        defaultValue={row?.note ?? ""}
        placeholder="Nota (opcional): campaña, contexto de la cifra…"
        className="min-h-[44px]"
      />
    </>
  );
}

function MetricRow({ metrics, row }: { metrics: MetricDef[]; row: SocialMetricData }) {
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
            const u = await updateSocialMetric(row.id, formData);
            if (u) undo(u);
            setEditing(false);
          }}
          className="flex flex-col gap-2"
        >
          <MetricFields metrics={metrics} row={row} />
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
    <li className="group grid grid-cols-[auto_1fr_auto] items-start gap-x-3 rounded-md border-l-2 border-primary/30 py-1.5 pl-3 pr-1">
      <span className="text-xs font-medium text-muted-foreground">{formatDate(row.at)}</span>
      <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
        {metrics.map((m) =>
          row.values[m.key] != null ? (
            <span key={m.key}>
              <span className="text-muted-foreground">{m.short}:</span>{" "}
              <span className="font-medium">{fmt(row.values[m.key])}</span>
            </span>
          ) : null,
        )}
        {row.recordedByName && (
          <span className="text-muted-foreground">· {row.recordedByName}</span>
        )}
        {row.note && <span className="w-full text-muted-foreground">{row.note}</span>}
      </span>
      {(canRecord || canEdit) && (
        <span className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                  const u = await deleteSocialMetric(row.id);
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

export function SocialMetricsPanel({
  channel,
  people,
}: {
  channel: { id: string; platform: SocialPlatform; metrics: SocialMetricData[] };
  people: { id: string; name: string }[];
}) {
  const canRecord = useCanRecordMetrics();
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 4000);
    return () => clearTimeout(t);
  }, [justSaved]);

  const metrics = metricsFor(channel.platform);
  if (metrics.length === 0) return null;

  // Historial: más reciente primero para la tabla, cronológico para la línea.
  const desc = [...channel.metrics].sort((a, b) => b.at.getTime() - a.at.getTime());
  const asc = [...desc].reverse();
  const headline = metrics[0];
  const trend = asc.map((m) => m.values[headline.key]).filter((v): v is number => v != null);
  const shown = open ? desc : desc.slice(0, 6);

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <BarChart3 className="h-3.5 w-3.5" />
          Mediciones de KPIs ({channel.metrics.length})
          <InfoHint text="Registro histórico de las métricas propias de la cuenta, con fecha. Cómo se usa: «Registrar mediciones», eliges quién carga los datos, pones la fecha y las cifras que tengas (no hace falta llenar todas). El equipo (incluido el perfil junior) puede crear y editar; borrar es solo del perfil completo. Ejemplo: «12 sep 2026 · Seguidores 1.240 · Alcance 8.900 · Interacciones 320»." />
        </p>
        {canRecord && !adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" />
            Registrar mediciones
          </Button>
        )}
      </div>

      {justSaved && (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-success" role="status">
          <Check className="h-3.5 w-3.5" />
          Medición registrada.
        </p>
      )}

      {canRecord && adding && (
        <form
          key={formKey}
          action={async (formData) => {
            await addSocialMetric(channel.id, formData);
            setAdding(false);
            setJustSaved(true);
            setFormKey((k) => k + 1);
          }}
          className="mt-2 flex flex-col gap-2 rounded-md border border-dashed border-input p-3"
        >
          <MetricFields metrics={metrics} />
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

      {channel.metrics.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Aún no hay mediciones registradas.</p>
      ) : (
        <>
          {trend.length >= 2 && (
            <div className="mt-3 flex items-center gap-3 rounded-md bg-muted/40 p-2">
              <Sparkline points={trend} />
              <div className="text-xs leading-tight">
                <p className="font-medium">{headline.short}</p>
                <p className="text-muted-foreground">
                  {fmt(trend[0])} → {fmt(trend[trend.length - 1])} · {trend.length} mediciones
                </p>
              </div>
            </div>
          )}

          <ul className="mt-2 flex flex-col gap-1.5">
            {shown.map((row) => (
              <MetricRow key={row.id} metrics={metrics} row={row} />
            ))}
          </ul>

          {channel.metrics.length > 6 && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="mt-2 rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {open ? "Ver menos" : `Ver todas (${channel.metrics.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
