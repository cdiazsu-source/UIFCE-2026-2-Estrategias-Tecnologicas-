"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";

import { getProjectSummary } from "@/lib/actions/coordination";
import type { CoordProject } from "@/lib/coordination";
import type { ProjectSummary } from "@/lib/coordination-summary";
import { openLinkText } from "@/lib/template-links";
import { PRIORITY_TAG_LABEL, PROJECT_STATUS_LABEL, cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Slide = { src: string; caption: string; template: string; href: string; hrefText: string };

/** Imagen grande de las plantillas del proyecto: una a la vez con flechas, y pasa sola cada 6 segundos (se detiene al pasar el cursor o si se pide menos movimiento). */
function TemplateShowcase({ summary, big }: { summary: ProjectSummary; big: boolean }) {
  const slides = useMemo<Slide[]>(
    () =>
      summary.templates.flatMap((t) =>
        t.images.map((im) => ({
          src: im.image,
          caption: im.label && im.label !== "Captura" ? im.label : "",
          template: t.name,
          href: im.url || t.url || "",
          hrefText: openLinkText(im.url ? "" : t.urlLabel, im.url || t.url, "Abrir enlace"),
        })),
      ),
    [summary.templates],
  );
  const n = slides.length;
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (n < 2 || hover) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, hover]);

  if (summary.templates.length === 0) return <p className={cn("text-muted-foreground", big ? "text-lg" : "text-sm")}>Este proyecto no tiene plantillas asociadas.</p>;
  if (n === 0) return <p className={cn("text-muted-foreground", big ? "text-lg" : "text-sm")}>Las plantillas asociadas todavía no tienen captura ni piezas con imagen.</p>;

  const cur = slides[Math.min(i, n - 1)];
  const go = (d: number) => setI((x) => (x + d + n) % n);

  return (
    <div className="flex flex-col gap-3" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="relative flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
        {slides.map((s, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${s.src}-${k}`}
            src={s.src}
            alt={s.caption || s.template}
            loading={k === 0 ? "eager" : "lazy"}
            className={cn("w-full object-contain transition-opacity duration-700", big ? "max-h-[62vh]" : "max-h-[26rem]", k === i ? "relative opacity-100" : "absolute inset-0 h-full opacity-0")}
          />
        ))}
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Imagen anterior" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 shadow-sm hover:bg-card">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Imagen siguiente" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 shadow-sm hover:bg-card">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn("min-w-0", big ? "text-lg" : "text-sm")}>
          <span className="font-semibold">{cur.template}</span>
          {cur.caption && <span className="text-muted-foreground"> · {cur.caption}</span>}
        </p>
        <div className="flex items-center gap-3">
          {cur.href && (
            <a href={cur.href} target="_blank" rel="noreferrer" className={cn("inline-flex items-center gap-1 text-link hover:underline", big ? "text-base" : "text-sm")}>
              {cur.hrefText}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
          {n > 1 && (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {Math.min(i, n - 1) + 1} de {n}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, children, big }: { label: string; children: React.ReactNode; big: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3">
      <p className={cn("font-medium uppercase tracking-wide text-muted-foreground", big ? "text-sm" : "text-[11px]")}>{label}</p>
      <div className={cn("font-semibold leading-snug", big ? "text-xl" : "text-sm")}>{children}</div>
    </div>
  );
}

/** Resumen corporativo de un proyecto dentro de la presentación: lo más importante y su plantilla asociada en grande. «Ver proyecto» abre el proyecto. */
export function CoordinationProjectSummary({ project, big, backLabel, onBack, onView }: { project: CoordProject; big: boolean; backLabel: string; onBack: () => void; onView: () => void }) {
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    setError(null);
    getProjectSummary(project.id).then((r) => {
      if (cancelled) return;
      if (r.ok) setSummary(r.summary);
      else setError(r.error);
    });
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  const statusLabel = project.status === "COMPLETADO" ? "Entregado" : (PROJECT_STATUS_LABEL[project.status] ?? project.status);
  const pct = summary && summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
          Volver a {backLabel}
        </Button>
        <Button type="button" size="sm" onClick={onView}>
          Ver proyecto
          <ExternalLink className="ml-1.5 h-4 w-4" aria-hidden />
        </Button>
      </div>

      <header className="flex flex-col gap-2 border-b border-border pb-4">
        <p className={cn("font-semibold uppercase tracking-widest text-muted-foreground", big ? "text-base" : "text-xs")}>{project.category}</p>
        <h2 className={cn("font-semibold leading-tight tracking-tight", big ? "text-5xl" : "text-3xl")}>{project.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full bg-primary/10 px-3 py-1 font-medium text-primary", big ? "text-base" : "text-xs")}>{statusLabel}</span>
          {summary?.priorityTag && PRIORITY_TAG_LABEL[summary.priorityTag] && <span className={cn("rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground", big ? "text-base" : "text-xs")}>{PRIORITY_TAG_LABEL[summary.priorityTag]}</span>}
        </div>
      </header>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : !summary ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Cargando el resumen…
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Metric label="Responsable" big={big}>
              {summary.assignee ?? "Sin asignar"}
            </Metric>
            <Metric label="Avance" big={big}>
              {summary.total > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <span>
                    {summary.done} de {summary.total} subtareas · {pct} %
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </span>
                </div>
              ) : (
                "Sin subtareas"
              )}
            </Metric>
            <Metric label="Sigue" big={big}>
              {summary.nextPending[0] ?? (summary.total > 0 ? "Todo al día" : "—")}
            </Metric>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <p className={cn("font-medium uppercase tracking-wide text-muted-foreground", big ? "text-sm" : "text-xs")}>Qué se hace</p>
              <p className={cn("leading-relaxed", big ? "text-xl" : "text-sm")}>{summary.description}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className={cn("font-medium uppercase tracking-wide text-muted-foreground", big ? "text-sm" : "text-xs")}>Qué se espera</p>
              <p className={cn("leading-relaxed", big ? "text-xl" : "text-sm")}>{summary.expectedOutcome}</p>
            </div>
          </div>

          {(summary.nextPending.length > 1 || summary.notes.length > 0) && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {summary.nextPending.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <p className={cn("font-medium uppercase tracking-wide text-muted-foreground", big ? "text-sm" : "text-xs")}>Próximas subtareas</p>
                  <ul className={cn("flex flex-col gap-1", big ? "text-lg" : "text-sm")}>
                    {summary.nextPending.map((t) => (
                      <li key={t}>· {t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.notes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className={cn("font-medium uppercase tracking-wide text-muted-foreground", big ? "text-sm" : "text-xs")}>Últimas novedades</p>
                  <ul className={cn("flex flex-col gap-2", big ? "text-lg" : "text-sm")}>
                    {summary.notes.map((n, k) => (
                      <li key={k}>
                        <span className="font-medium">{n.author}</span> <span className="text-muted-foreground">· {timeAgo(n.at)}</span>
                        <br />
                        {n.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className={cn("font-medium uppercase tracking-wide text-muted-foreground", big ? "text-sm" : "text-xs")}>Plantilla asociada</p>
            <TemplateShowcase summary={summary} big={big} />
          </div>
        </>
      )}
    </section>
  );
}
