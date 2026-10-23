"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, X } from "lucide-react";

import { getProjectSummary } from "@/lib/actions/coordination";
import type { CoordProject } from "@/lib/coordination";
import type { ProjectSummary } from "@/lib/coordination-summary";
import { openLinkText } from "@/lib/template-links";
import { PROJECT_STATUS_LABEL, cn } from "@/lib/utils";

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

  if (n === 0) return <p className={cn("py-6 text-center text-muted-foreground", big ? "text-lg" : "text-sm")}>La plantilla asociada todavía no tiene captura ni piezas con imagen.</p>;

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
            className={cn("w-full object-contain transition-opacity duration-700", big ? "max-h-[68vh]" : "max-h-[60vh]", k === i ? "relative opacity-100" : "absolute inset-0 h-full opacity-0")}
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

/** Pop-up flotante al tocar un proyecto en la presentación: solo su plantilla asociada (captura y piezas en grande); si no tiene, su título,
 *  categoría y estado. Se cierra con la X, tocando fuera o con Esc (lo maneja el tablero). */
export function CoordinationProjectPopup({ project, big, onClose }: { project: CoordProject; big: boolean; onClose: () => void }) {
  const hasTemplate = project.images.length > 0;
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasTemplate) return;
    let cancelled = false;
    getProjectSummary(project.id).then((r) => {
      if (cancelled) return;
      if (r.ok) setSummary(r.summary);
      else setError(r.error);
    });
    return () => {
      cancelled = true;
    };
  }, [project.id, hasTemplate]);

  const statusLabel = project.status === "COMPLETADO" ? "Entregado" : (PROJECT_STATUS_LABEL[project.status] ?? project.status);

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={hasTemplate ? `Plantilla de ${project.title}` : project.title}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn("relative max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl", big ? "max-w-6xl" : "max-w-3xl")}>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-3 top-3 z-10 rounded-full border border-border bg-card/90 p-1.5 text-muted-foreground shadow-sm hover:bg-muted">
          <X className="h-5 w-5" aria-hidden />
        </button>

        {hasTemplate ? (
          error ? (
            <p role="alert" className="py-6 text-sm text-destructive">
              {error}
            </p>
          ) : summary ? (
            <div className="pt-6">
              <TemplateShowcase summary={summary} big={big} />
            </div>
          ) : (
            <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Cargando la plantilla…
            </p>
          )
        ) : (
          <div className="flex flex-col gap-3 py-6 pr-8">
            <p className={cn("font-semibold uppercase tracking-widest text-muted-foreground", big ? "text-base" : "text-xs")}>{project.category}</p>
            <h2 className={cn("font-semibold leading-tight tracking-tight", big ? "text-5xl" : "text-3xl")}>{project.title}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn("rounded-full bg-primary/10 px-3 py-1 font-medium text-primary", big ? "text-base" : "text-xs")}>{statusLabel}</span>
              <span className={cn("text-muted-foreground", big ? "text-lg" : "text-sm")}>Sin plantilla asociada</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
