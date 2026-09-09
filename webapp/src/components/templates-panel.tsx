"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Download, ExternalLink, ImagePlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { addTemplate, deleteTemplate, updateTemplate } from "@/lib/actions/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";

export type TemplateData = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  url: string | null;
  format: string | null;
  notes: string | null;
  screenshot: string | null;
};

export const TEMPLATE_CATEGORIES = [
  "Redes sociales",
  "Televisores de la unidad",
  "Difusión por correo",
  "Disponibilidad de salas",
  "Cursos Libres ofertados",
  "Eventos",
  "Apoyos académicos",
  "Otras",
];

function categoryRank(c: string): number {
  const i = TEMPLATE_CATEGORIES.indexOf(c);
  return i === -1 ? TEMPLATE_CATEGORIES.length : i;
}

/** El enlace apunta a una imagen (asset del propio sitio o URL externa). */
function isImageUrl(u: string): boolean {
  return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(u);
}

/** Quita tildes y pasa a minúsculas para comparar/buscar sin acentos. */
function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Reduce una imagen a JPEG con el lado mayor <= `max` px y la devuelve como
 *  data URL. Mantiene el peso de la fila bajo (~30-70 KB) para no inflar la BD. */
function downscaleToDataUrl(file: Blob, max = 640, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("sin canvas"));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("no es una imagen válida"));
    };
    img.src = objectUrl;
  });
}

/** Campo para adjuntar la captura de pantalla del video/pieza: elegir archivo,
 *  pegar (Ctrl+V) o arrastrar. La imagen se reduce en el navegador y viaja en
 *  un input oculto (`screenshot`) con el resto del formulario. */
function ScreenshotField({ initial }: { initial: string | null }) {
  const [value, setValue] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function accept(file: Blob | undefined | null) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      setValue(await downscaleToDataUrl(file));
    } catch {
      setErr("No se pudo procesar la imagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input type="hidden" name="screenshot" value={value} />
      <span className="text-xs font-medium text-muted-foreground">Captura de pantalla (opcional)</span>
      {value ? (
        <div className="flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Captura de la pieza"
            className="max-h-32 rounded-md border border-border object-contain"
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => setValue("")}>
            <X className="h-3.5 w-3.5" />
            Quitar
          </Button>
        </div>
      ) : (
        <div
          tabIndex={0}
          onPaste={(e) => {
            const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith("image/"));
            if (f) {
              e.preventDefault();
              void accept(f);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void accept(Array.from(e.dataTransfer.files).find((x) => x.type.startsWith("image/")));
          }}
          className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-input p-2 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {busy ? "Procesando…" : "Elegir imagen"}
          </Button>
          <span>o haz clic aquí y pega (Ctrl+V), o arrastra una captura. Se reduce a 640 px.</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void accept(e.target.files?.[0])}
          />
        </div>
      )}
      {err && <span className="text-xs text-destructive">{err}</span>}
    </div>
  );
}

function Fields({ t }: { t?: TemplateData }) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Input name="name" defaultValue={t?.name ?? ""} placeholder="Nombre de la plantilla" required className="min-w-[14rem] flex-1" />
        <Input
          name="category"
          defaultValue={t?.category ?? TEMPLATE_CATEGORIES[0]}
          placeholder="Categoría"
          list="template-categories"
          className="w-56"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Input name="format" defaultValue={t?.format ?? ""} placeholder="Formato o medida (ej. Reel 1080×1920)" className="min-w-[14rem] flex-1" />
        <Input name="url" defaultValue={t?.url ?? ""} placeholder="Enlace (Drive, Canva, Figma…)" className="min-w-[14rem] flex-1" />
      </div>
      <Textarea name="description" defaultValue={t?.description ?? ""} placeholder="Para qué sirve / cuándo se usa" className="min-h-[56px]" />
      <Textarea name="notes" defaultValue={t?.notes ?? ""} placeholder="Notas (aprobaciones, responsables, variantes…)" className="min-h-[56px]" />
      <ScreenshotField initial={t?.screenshot ?? null} />
    </>
  );
}

function TemplateCard({ template }: { template: TemplateData }) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-4">
          <form
            action={async (formData) => {
              const u = await updateTemplate(template.id, formData);
              if (u) undo(u);
              setEditing(false);
            }}
            className="flex flex-col gap-2"
          >
            <Fields t={template} />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Guardar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
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
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="flex flex-col gap-1">
          <span className="font-semibold leading-tight">{template.name}</span>
          {template.format && <span className="text-xs text-muted-foreground">{template.format}</span>}
        </div>
        {canEdit && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label="Editar plantilla"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm(`¿Eliminar la plantilla "${template.name}"?`)) return;
                startTransition(async () => {
                  const u = await deleteTemplate(template.id);
                  if (u) undo(u);
                });
              }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              aria-label="Eliminar plantilla"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {template.screenshot && (
          <a
            href={template.screenshot}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-md border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={template.screenshot}
              alt={`Captura de ${template.name}`}
              className="max-h-44 w-full object-cover"
              loading="lazy"
            />
          </a>
        )}
        {template.description && <p className="whitespace-pre-line text-muted-foreground">{template.description}</p>}
        {template.url && isImageUrl(template.url) && (
          <div className="flex flex-col gap-2">
            <a href={template.url} target="_blank" rel="noreferrer" className="block w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={template.url}
                alt={template.name}
                className="max-h-48 w-fit rounded-md border border-border bg-white object-contain p-1"
              />
            </a>
            <a
              href={template.url}
              download
              className="inline-flex w-fit items-center gap-1 text-primary hover:underline"
            >
              Descargar imagen
              <Download className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
        {template.url && !isImageUrl(template.url) && (
          <a
            href={template.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1 text-primary hover:underline"
          >
            Abrir plantilla
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {template.notes && (
          <p className="whitespace-pre-line rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">{template.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function TemplatesPanel({ templates }: { templates: TemplateData[] }) {
  const canEdit = useCanEdit();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  const tokens = useMemo(() => fold(query.trim()).split(/\s+/).filter(Boolean), [query]);

  const filtered = useMemo(() => {
    if (tokens.length === 0) return templates;
    return templates.filter((t) => {
      const hay = fold(
        [t.name, t.category, t.format, t.description, t.notes].filter(Boolean).join(" • "),
      );
      return tokens.every((tok) => hay.includes(tok));
    });
  }, [templates, tokens]);

  const groups = new Map<string, TemplateData[]>();
  for (const t of filtered) {
    const arr = groups.get(t.category) ?? [];
    arr.push(t);
    groups.set(t.category, arr);
  }
  const sortedCategories = [...groups.keys()].sort(
    (a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b, "es"),
  );

  return (
    <div className="flex flex-col gap-6">
      <datalist id="template-categories">
        {TEMPLATE_CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, formato, notas…"
            aria-label="Buscar plantilla"
            className="pl-8"
          />
        </div>
        {tokens.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} de {templates.length}
          </span>
        )}
      </div>

      {canEdit && (
        <div>
          {adding ? (
            <Card>
              <CardContent className="pt-4">
                <form
                  action={async (formData) => {
                    await addTemplate(formData);
                    setAdding(false);
                  }}
                  className="flex flex-col gap-2"
                >
                  <Fields />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Agregar plantilla
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5" />
              Nueva plantilla
            </Button>
          )}
        </div>
      )}

      {templates.length === 0 ? (
        <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          Todavía no hay plantillas registradas.
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          Sin resultados para «{query.trim()}».
        </p>
      ) : (
        sortedCategories.map((cat) => (
          <section key={cat} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {cat}
              <span className="font-normal">({groups.get(cat)!.length})</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.get(cat)!.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
