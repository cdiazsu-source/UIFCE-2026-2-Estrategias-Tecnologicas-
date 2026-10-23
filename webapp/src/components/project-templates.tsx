"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Plus, X } from "lucide-react";

import { setTemplatesForProject } from "@/lib/actions/project-templates";
import type { LinkedTemplate, TemplateOption } from "@/lib/project-templates-data";
import { openLinkText } from "@/lib/template-links";
import { Button } from "@/components/ui/button";
import { PiecesGallery } from "@/components/templates-panel";

/** Bloque «Plantillas» de la página de un proyecto: las plantillas enlazadas (captura y piezas en carrusel, con su enlace de Canva, Drive…) y,
 *  para quien edita, enlazar o quitar plantillas. Las mismas imágenes salen en «Reunión coordinación». */
export function ProjectTemplates({ projectId, linked, options }: { projectId: string; linked: LinkedTemplate[]; options: TemplateOption[] | null }) {
  const [pick, setPick] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ids = linked.map((t) => t.id);
  const available = (options ?? []).filter((o) => !ids.includes(o.id));

  const save = (next: string[], after?: () => void) => {
    setError(null);
    start(async () => {
      const r = await setTemplatesForProject(projectId, next);
      if (r.ok) after?.();
      else setError(r.error);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {linked.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este proyecto todavía no tiene plantillas enlazadas.</p>
      ) : (
        linked.map((t) => (
          <div key={t.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium leading-tight">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.category}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs">
                {t.url && (
                  <a href={t.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-link hover:underline">
                    {openLinkText(t.urlLabel, t.url)}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                )}
                <Link href="/plantillas" className="text-muted-foreground underline-offset-2 hover:underline">
                  Ver en Plantillas
                </Link>
                {options && (
                  <button type="button" disabled={pending} aria-label={`Quitar la plantilla ${t.name} de este proyecto`} onClick={() => save(ids.filter((x) => x !== t.id))} className="rounded p-1 text-muted-foreground hover:bg-muted">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
            </div>
            {t.images.length > 0 ? <PiecesGallery pieces={t.images} /> : <p className="text-xs text-muted-foreground">Esta plantilla todavía no tiene captura ni piezas con imagen.</p>}
          </div>
        ))
      )}

      {options && (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Plantilla a enlazar" className="h-9 min-w-[14rem] flex-1 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">Enlazar una plantilla…</option>
              {available.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} · {o.category}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" variant="outline" disabled={pending || !pick} onClick={() => save([...ids, pick], () => setPick(""))}>
              <Plus className="mr-1 h-4 w-4" aria-hidden />
              Enlazar
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
