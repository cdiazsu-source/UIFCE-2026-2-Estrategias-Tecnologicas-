"use client";

import { useEffect, useState, useTransition } from "react";
import { BarChart3, Check, LineChart as LineChartIcon, Pencil, Plus, Trash2 } from "lucide-react";
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

/** Gráfica de línea de una métrica en el tiempo, sin librerías. Ejes implícitos:
 *  se anotan el mínimo y el máximo, y la primera y la última fecha. */
function MetricChart({ label, series }: { label: string; series: { at: Date; v: number }[] }) {
  const w = 240;
  const h = 84;
  const pad = 6;
  const vals = series.map((p) => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const t0 = series[0].at.getTime();
  const t1 = series[series.length - 1].at.getTime();
  const tSpan = t1 - t0 || 1;
  const pt = (p: { at: Date; v: number }) => {
    const x = pad + ((p.at.getTime() - t0) / tSpan) * (w - 2 * pad);
    const y = h - pad - ((p.v - min) / span) * (h - 2 * pad);
    return [x, y] as const;
  };
  const line = series.map((p, i) => `${i === 0 ? "M" : "L"}${pt(p).map((n) => n.toFixed(1)).join(",")}`).join(" ");
  const [, lastY] = pt(series[series.length - 1]);

  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-card p-2">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {fmt(series[0].v)} → {fmt(series[series.length - 1].v)}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full text-primary" role="img" aria-label={`Evolución de ${label}`}>
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="currentColor" strokeOpacity={0.15} />
        <path d={line} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
        {series.map((p, i) => {
          const [x, y] = pt(p);
          return <circle key={i} cx={x} cy={y} r={2} fill="currentColor" />;
        })}
        <text x={pad} y={pad + 7} className="fill-muted-foreground" fontSize={9}>
          {fmt(max)}
        </text>
        <text x={pad} y={h - pad - 2} className="fill-muted-foreground" fontSize={9}>
          {fmt(min)}
        </text>
        <text x={w - pad} y={lastY - 4} textAnchor="end" className="fill-foreground" fontSize={9}>
          {fmt(series[series.length - 1].v)}
        </text>
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{formatDate(series[0].at)}</span>
        <span>{formatDate(series[series.length - 1].at)}</span>
      </div>
    </div>
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
  const [showCharts, setShowCharts] = useState(false);
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
          <InfoHint text="Registro histórico de las métricas propias de la cuenta, con fecha. Cómo se usa: «Registrar mediciones», eliges quién carga los datos, pones la fecha y las cifras que tengas (no hace falta llenar todas). Con dos o más mediciones, «Ver gráficas» dibuja la evolución de cada métrica en el tiempo. El equipo (incluido el perfil junior) puede crear y editar; borrar es solo del perfil completo. Ejemplo: «12 sep 2026 · Seguidores 1.240 · Alcance 8.900 · Interacciones 320»." />
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
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/40 p-2">
              <div className="flex items-center gap-3">
                <Sparkline points={trend} />
                <div className="text-xs leading-tight">
                  <p className="font-medium">{headline.short}</p>
                  <p className="text-muted-foreground">
                    {fmt(trend[0])} → {fmt(trend[trend.length - 1])} · {trend.length} mediciones
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCharts((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
              >
                <LineChartIcon className="h-3.5 w-3.5" />
                {showCharts ? "Ocultar gráficas" : "Ver gráficas"}
              </button>
            </div>
          )}

          {showCharts && (
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {metrics.map((m) => {
                const s = asc
                  .map((row) => ({ at: row.at, v: row.values[m.key] }))
                  .filter((p): p is { at: Date; v: number } => p.v != null);
                return s.length >= 2 ? <MetricChart key={m.key} label={m.short} series={s} /> : null;
              })}
              {metrics.every((m) => asc.filter((row) => row.values[m.key] != null).length < 2) && (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Se necesitan al menos dos mediciones con el mismo dato para dibujar su gráfica.
                </p>
              )}
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
