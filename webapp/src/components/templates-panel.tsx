"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, Download, ExternalLink, ImagePlus, Pencil, Plus, Search, Sparkles, Trash2, X } from "lucide-react";

import { addTemplate, deleteTemplate, updateTemplate } from "@/lib/actions/templates";
import { downscaleToDataUrl } from "@/lib/image-client";
import { LINK_LABEL_MAX, LINK_LABEL_PRESETS, detectLinkLabel, openLinkText } from "@/lib/template-links";
import { PIECES_MAX, PIECE_IMAGE_SIZE, PIECE_LABEL_MAX, type PieceData } from "@/lib/template-pieces";
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
  /** Texto del prompt, si la plantilla es un prompt. */
  promptText: string | null;
  screenshot: string | null;
  /** Piezas (imagen pequeña + enlace), en su orden. */
  pieces: PieceData[];
  /** Tipo del enlace elegido (Canva, Drive…); "" = se deduce del dominio. */
  urlLabel: string;
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

/** Piezas de la plantilla: se agregan varias imágenes a la vez (elegir, pegar o arrastrar), cada una con su nombre y su enlace de Canva, y se
 *  reordenan con un clic en las flechas. Viajan en un input oculto (`pieces`, JSON) con el resto del formulario. */
function PiecesField({ initial }: { initial: PieceData[] }) {
  const [pieces, setPieces] = useState<PieceData[]>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function accept(files: Blob[]) {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      const room = PIECES_MAX - pieces.length;
      const made: PieceData[] = [];
      for (const f of imgs.slice(0, room)) made.push({ image: await downscaleToDataUrl(f, PIECE_IMAGE_SIZE, 0.7), label: "", url: "" });
      setPieces((cur) => [...cur, ...made]);
      if (imgs.length > room) setErr(`Solo caben ${PIECES_MAX} piezas por plantilla.`);
    } catch {
      setErr("No se pudo procesar alguna imagen.");
    } finally {
      setBusy(false);
    }
  }

  const move = (i: number, d: -1 | 1) =>
    setPieces((cur) => {
      const j = i + d;
      if (j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const patchPiece = (i: number, p: Partial<PieceData>) => setPieces((cur) => cur.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <div className="flex flex-col gap-1.5">
      <input type="hidden" name="pieces" value={JSON.stringify(pieces)} />
      <span className="text-xs font-medium text-muted-foreground">
        Piezas del evento (opcional) · {pieces.length}/{PIECES_MAX}
      </span>
      {pieces.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pieces.map((p, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="h-16 w-16 rounded border border-border object-cover" />
              <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
                <Input value={p.label} maxLength={PIECE_LABEL_MAX} onChange={(e) => patchPiece(i, { label: e.target.value })} placeholder="Nombre de la pieza (ej. Post de inscripción)" className="h-8 text-xs" />
                <Input value={p.url} onChange={(e) => patchPiece(i, { url: e.target.value })} placeholder="Enlace en Canva (https://www.canva.com/…)" className="h-8 text-xs" />
              </div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Mover la pieza ${i + 1} antes`} className="rounded p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-30">
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === pieces.length - 1} aria-label={`Mover la pieza ${i + 1} después`} className="rounded p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-30">
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => setPieces((cur) => cur.filter((_, j) => j !== i))} aria-label="Quitar la pieza" className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div
        tabIndex={0}
        onPaste={(e) => {
          const files = Array.from(e.clipboardData.files).filter((x) => x.type.startsWith("image/"));
          if (files.length) {
            e.preventDefault();
            void accept(files);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void accept(Array.from(e.dataTransfer.files));
        }}
        className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-input p-2 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Button type="button" variant="outline" size="sm" disabled={busy || pieces.length >= PIECES_MAX} onClick={() => inputRef.current?.click()}>
          <ImagePlus className="h-3.5 w-3.5" />
          {busy ? "Procesando…" : "Agregar imágenes"}
        </Button>
        <span>Elige varias a la vez, pega (Ctrl+V) o arrastra. Cada una se reduce a {PIECE_IMAGE_SIZE} px.</span>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void accept(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
      </div>
      {err && <span className="text-xs text-destructive">{err}</span>}
    </div>
  );
}

/** Piezas en la tarjeta: una a la vez, con flechas para pasar de una a otra (también ← → con el teclado), su nombre y el botón que abre su
 *  enlace (Canva); debajo, las miniaturas para saltar directo a cualquiera. */
function PiecesGallery({ pieces }: { pieces: PieceData[] }) {
  const [i, setI] = useState(0);
  const n = pieces.length;
  const at = Math.min(i, n - 1);
  const cur = pieces[at];
  const go = (d: number) => setI((at + d + n) % n);

  return (
    <div
      className="flex flex-col gap-2 rounded-md border border-border p-2"
      tabIndex={0}
      aria-label={`Piezas de la plantilla, pieza ${at + 1} de ${n}`}
      onKeyDown={(e) => {
        if (n < 2) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        }
      }}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wide text-muted-foreground">Piezas</span>
        <span className="text-muted-foreground" aria-live="polite">
          {at + 1} de {n}
        </span>
      </div>

      <div className="relative flex items-center justify-center rounded-md bg-muted/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cur.image} alt={cur.label || `Pieza ${at + 1}`} className="max-h-56 w-full rounded-md object-contain" />
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Pieza anterior" className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full border border-border bg-card/90 p-1.5 shadow-sm hover:bg-card">
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Pieza siguiente" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full border border-border bg-card/90 p-1.5 shadow-sm hover:bg-card">
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-medium">{cur.label || `Pieza ${at + 1}`}</span>
        {cur.url && (
          <a href={cur.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs text-link hover:underline">
            {openLinkText("", cur.url, "Abrir enlace")}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
      </div>

      {n > 1 && (
        <ul className="flex gap-1.5 overflow-x-auto pb-1">
          {pieces.map((p, k) => (
            <li key={k} className="shrink-0">
              <button type="button" onClick={() => setI(k)} aria-label={`Ir a la pieza ${k + 1}`} aria-current={k === at} className={`rounded border-2 ${k === at ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" className="h-10 w-10 rounded-sm object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Enlace de la plantilla y su tipo: botones (Canva, Drive, Figma, YouTube) o un nombre propio; vacío = se deduce del dominio. */
function UrlField({ url, label }: { url: string; label: string }) {
  const [u, setU] = useState(url);
  const [l, setL] = useState(label);
  const guess = detectLinkLabel(u);
  return (
    <div className="flex min-w-[14rem] flex-1 flex-col gap-1.5">
      <Input name="url" value={u} onChange={(e) => setU(e.target.value)} placeholder="Enlace (Canva, Drive, Figma…)" />
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Tipo de enlace">
        <span className="text-xs text-muted-foreground">Tipo de enlace</span>
        {LINK_LABEL_PRESETS.map((p) => (
          <button key={p} type="button" aria-pressed={l === p} onClick={() => setL(l === p ? "" : p)} className={`rounded-full border px-2.5 py-0.5 text-[11px] ${l === p ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}>
            {p}
          </button>
        ))}
        <input name="urlLabel" value={l} maxLength={LINK_LABEL_MAX} onChange={(e) => setL(e.target.value)} placeholder={guess ? `Automático: ${guess}` : "Otro (escribe el nombre)"} aria-label="Nombre del tipo de enlace" className="h-7 min-w-[9rem] flex-1 rounded-md border border-input bg-background px-2 text-xs" />
      </div>
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
        <UrlField url={t?.url ?? ""} label={t?.urlLabel ?? ""} />
      </div>
      <Textarea name="description" defaultValue={t?.description ?? ""} placeholder="Para qué sirve / cuándo se usa" className="min-h-[56px]" />
      <Textarea name="notes" defaultValue={t?.notes ?? ""} placeholder="Notas (aprobaciones, responsables, variantes…)" className="min-h-[56px]" />
      <Textarea
        name="promptText"
        defaultValue={t?.promptText ?? ""}
        placeholder="Prompt (opcional): texto completo para pegar en Claude Code u otra IA"
        className="min-h-[96px] font-mono text-xs"
      />
      <ScreenshotField initial={t?.screenshot ?? null} />
      <PiecesField initial={t?.pieces ?? []} />
    </>
  );
}

/** Prompt de la plantilla: botón para copiarlo (lo que se usa a diario) y vista del texto completo. */
function PromptBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Sin permiso para el portapapeles: se muestra el texto para copiarlo a mano.
      setOpen(true);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Prompt · {text.length.toLocaleString("es-CO")} caracteres
        </span>
        <Button type="button" size="sm" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {copied ? "Copiado" : "Copiar prompt"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? "Ocultar" : "Ver prompt"}
        </Button>
        <span className="sr-only" role="status">
          {copied ? "Prompt copiado al portapapeles" : ""}
        </span>
      </div>
      {open && (
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded bg-muted/50 p-2 font-mono text-xs leading-relaxed">
          {text}
        </pre>
      )}
    </div>
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
        {template.pieces.length > 0 && <PiecesGallery pieces={template.pieces} />}
        {template.description && <p className="whitespace-pre-line text-muted-foreground">{template.description}</p>}
        {template.promptText && <PromptBlock text={template.promptText} />}
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
              className="inline-flex w-fit items-center gap-1 text-link hover:underline"
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
            className="inline-flex w-fit items-center gap-1 text-link hover:underline"
          >
            {openLinkText(template.urlLabel, template.url)}
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
