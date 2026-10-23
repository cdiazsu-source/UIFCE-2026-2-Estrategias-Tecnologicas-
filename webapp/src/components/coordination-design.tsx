"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, X } from "lucide-react";

import { addSectionProject, removeSectionProject, resetSection, saveDesign, setProjectTemplates } from "@/lib/actions/coordination";
import type { HoursResult } from "@/lib/actions/hours";
import { SECTION_LABEL, type CoordProject, type SectionKey } from "@/lib/coordination";
import { PROJECT_STATUS_LABEL } from "@/lib/utils";
import { DESIGN_IMAGES_MAX, DESIGN_NOTE_MAX, DESIGN_TITLE_MAX, IMAGE_LAYOUTS, SLIDE_LABEL, type DesignImage, type ImageLayout, type PageDesign, type SlideKey } from "@/lib/coordination";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type TemplateOption = { id: string; name: string; category: string };

export type ProjectOption = { id: string; title: string; status: string };

/** Modo diseño: proyectos de una sección (agregar, quitar, volver a lo automático) y plantillas enlazadas a cada uno (sus imágenes mini rotan en la tarjeta). */
export function ProjectsEditor({ section, projects, options, linkTemplates, customized }: { section: SectionKey; projects: CoordProject[]; options: ProjectOption[]; linkTemplates: TemplateOption[]; customized: boolean }) {
  const [pick, setPick] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<HoursResult>) => {
    setError(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error);
    });
  };
  const inList = new Set(projects.map((p) => p.id));
  const available = options.filter((o) => !inList.has(o.id));
  const toggle = (p: CoordProject, tid: string) => {
    const next = p.templateIds.includes(tid) ? p.templateIds.filter((t) => t !== tid) : [...p.templateIds, tid];
    run(() => setProjectTemplates(p.id, next));
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-primary/40 bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Proyectos · {SECTION_LABEL[section]}</p>
        {customized && (
          <button type="button" disabled={pending} onClick={() => window.confirm("¿Volver a la lista automática de esta sección?") && run(() => resetSection(section))} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            Volver a la lista automática
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <p className="text-xs text-muted-foreground">Esta sección no tiene proyectos.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((p) => (
            <li key={p.id} className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.title}</span>
                <button type="button" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id} className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-[11px] hover:bg-muted">
                  Plantillas ({p.templateIds.length})
                </button>
                <button type="button" disabled={pending} aria-label={`Quitar ${p.title} de esta sección`} onClick={() => run(() => removeSectionProject(section, p.id))} className="rounded p-1 text-muted-foreground hover:bg-muted">
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
              {open === p.id && (
                <div className="border-t border-border p-2">
                  {linkTemplates.length === 0 ? (
                    <p className="px-1 text-xs text-muted-foreground">No hay plantillas todavía.</p>
                  ) : (
                    <>
                      <p className="px-1 pb-1 text-[11px] text-muted-foreground">Marca las plantillas de este proyecto: su captura y sus piezas salen en su tarjeta (varias imágenes rotan) y quedan en los informes.</p>
                      <ul className="grid max-h-56 grid-cols-1 gap-0.5 overflow-y-auto sm:grid-cols-2">
                        {linkTemplates.map((t) => (
                          <li key={t.id}>
                            <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-muted">
                              <input type="checkbox" checked={p.templateIds.includes(t.id)} disabled={pending} onChange={() => toggle(p, t.id)} />
                              <span className="min-w-0 flex-1 truncate">{t.name}</span>
                              <span className="shrink-0 text-[10px] text-muted-foreground">{t.category}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Proyecto a agregar" className="h-9 min-w-[14rem] flex-1 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">Agregar un proyecto…</option>
          {available.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title} · {PROJECT_STATUS_LABEL[o.status] ?? o.status}
            </option>
          ))}
        </select>
        <Button type="button" size="sm" variant="outline" disabled={pending || !pick} onClick={() => run(async () => { const r = await addSectionProject(section, pick); if (r.ok) setPick(""); return r; })}>
          <Plus className="mr-1 h-4 w-4" aria-hidden />
          Agregar
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Modo diseño de una página: título propio, nota e imágenes o GIFs de las capturas de Plantillas. */
export function DesignEditor({ slide, initial, templates }: { slide: SlideKey; initial: PageDesign; templates: TemplateOption[] }) {
  const [title, setTitle] = useState(initial.title);
  const [note, setNote] = useState(initial.note);
  const [images, setImages] = useState<DesignImage[]>(initial.images);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const nameOf = (id: string) => templates.find((t) => t.id === id)?.name ?? "Plantilla";

  const touch = () => setSaved(false);
  const add = (id: string) => {
    if (images.length >= DESIGN_IMAGES_MAX) return;
    touch();
    setImages((cur) => [...cur, { templateId: id, layout: "ancho", caption: "" }]);
  };
  const patch = (i: number, p: Partial<DesignImage>) => {
    touch();
    setImages((cur) => cur.map((x, j) => (j === i ? { ...x, ...p } : x)));
  };

  const save = () => {
    setError(null);
    start(async () => {
      const r = await saveDesign(slide, { title, note, images });
      if (r.ok) setSaved(true);
      else setError(r.error);
    });
  };

  const isNotes = slide === "notas";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-dashed border-primary/40 bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Modo diseño · {SLIDE_LABEL[slide]}</p>

      <label className="flex flex-col gap-1 text-xs font-medium">
        Título de la página (vacío = el de siempre)
        <Input value={title} maxLength={DESIGN_TITLE_MAX} onChange={(e) => (touch(), setTitle(e.target.value))} placeholder={SLIDE_LABEL[slide]} className="h-9 text-sm font-normal" />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium">
        {isNotes ? "Notas y comentarios" : "Nota bajo el título"}
        <Textarea value={note} maxLength={DESIGN_NOTE_MAX} onChange={(e) => (touch(), setNote(e.target.value))} className="min-h-[96px] text-sm font-normal" />
        <span className="self-end text-[11px] font-normal text-muted-foreground">
          {note.length}/{DESIGN_NOTE_MAX}
        </span>
      </label>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium">
          Imágenes y GIFs ({images.length}/{DESIGN_IMAGES_MAX})
        </p>
        {images.map((img, i) => (
          <div key={`${img.templateId}-${i}`} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/plantillas-imagen/${img.templateId}`} alt="" className="h-14 w-20 rounded border border-border object-cover" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-xs text-muted-foreground">{nameOf(img.templateId)}</p>
              <div className="flex flex-wrap gap-1" role="group" aria-label="Posición de la imagen">
                {(Object.keys(IMAGE_LAYOUTS) as ImageLayout[]).map((l) => (
                  <button key={l} type="button" aria-pressed={img.layout === l} onClick={() => patch(i, { layout: l })} className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", img.layout === l ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>
                    {IMAGE_LAYOUTS[l]}
                  </button>
                ))}
              </div>
              <Input value={img.caption} maxLength={120} onChange={(e) => patch(i, { caption: e.target.value })} placeholder="Pie de imagen (opcional)" className="h-8 text-xs" />
            </div>
            <button type="button" aria-label="Quitar la imagen" onClick={() => (touch(), setImages((cur) => cur.filter((_, j) => j !== i)))} className="rounded p-1.5 text-muted-foreground hover:bg-muted">
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}

        {images.length < DESIGN_IMAGES_MAX &&
          (templates.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ninguna plantilla tiene captura todavía. Agrégala en Plantillas (campo de captura) para poder usarla aquí.</p>
          ) : (
            <details className="rounded-lg border border-border bg-card">
              <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium">Agregar desde Plantillas ({templates.length} con captura)</summary>
              <ul className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto border-t border-border p-2 sm:grid-cols-3 md:grid-cols-4">
                {templates.map((t) => (
                  <li key={t.id}>
                    <button type="button" onClick={() => add(t.id)} className="flex w-full flex-col gap-1 rounded-md border border-border p-1.5 text-left hover:border-primary/50 hover:bg-muted/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/plantillas-imagen/${t.id}`} alt="" loading="lazy" className="h-20 w-full rounded object-cover" />
                      <span className="line-clamp-2 text-[11px] leading-tight">{t.name}</span>
                      <span className="truncate text-[10px] text-muted-foreground">{t.category}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ))}
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {saved && <p className="text-xs text-success">Página guardada.</p>}
      <div>
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Guardando…" : "Guardar página"}
        </Button>
      </div>
    </div>
  );
}
