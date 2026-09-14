"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { DifusionSpaceStatus } from "@prisma/client";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";

import { addSpace, addSpaceImage, deleteSpace, deleteSpaceImage, updateSpace, updateSpaceStatus } from "@/lib/actions/difusion-spaces";
import { downscaleToDataUrl } from "@/lib/image-client";
import { DIFUSION_SPACE_STATUS_LABEL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";

export type DifusionSpaceImageData = { id: string; dataUrl: string };

export type DifusionSpaceData = {
  id: string;
  title: string;
  status: DifusionSpaceStatus;
  description: string | null;
  images: DifusionSpaceImageData[];
};

const STATUS_OPTIONS: DifusionSpaceStatus[] = ["POR_INTERVENIR", "EN_INTERVENCION", "INTERVENIDO"];

const STATUS_BADGE_VARIANT: Record<DifusionSpaceStatus, "secondary" | "warning" | "success"> = {
  POR_INTERVENIR: "secondary",
  EN_INTERVENCION: "warning",
  INTERVENIDO: "success",
};

/** Tope defensivo: mismo criterio que ScreenshotField de Plantillas. */
const IMAGE_MAX = 1_200_000;

function SpaceStatusSelect({ spaceId, status }: { spaceId: string; status: DifusionSpaceStatus }) {
  const canEdit = useCanEdit();
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    return <Badge variant={STATUS_BADGE_VARIANT[status]}>{DIFUSION_SPACE_STATUS_LABEL[status]}</Badge>;
  }

  return (
    <Select
      defaultValue={status}
      disabled={isPending}
      className="w-auto"
      onChange={(e) => {
        const next = e.target.value as DifusionSpaceStatus;
        startTransition(() => {
          updateSpaceStatus(spaceId, next);
        });
      }}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {DIFUSION_SPACE_STATUS_LABEL[opt]}
        </option>
      ))}
    </Select>
  );
}

/** Tile para agregar una foto a la galería: elegir archivo, pegar (Ctrl+V) o
 *  arrastrar. Se reduce en el navegador y se agrega de inmediato (sin pasar
 *  por un formulario aparte) — mismo espíritu que "Agregar subtarea". */
function AddImageTile({ spaceId }: { spaceId: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function accept(file: Blob | undefined | null) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const dataUrl = await downscaleToDataUrl(file);
      const fd = new FormData();
      fd.set("dataUrl", dataUrl);
      await addSpaceImage(spaceId, fd);
    } catch {
      setErr("No se pudo procesar la imagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
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
      onClick={() => inputRef.current?.click()}
      title="Elegir imagen, pegar (Ctrl+V) o arrastrar"
      className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-input p-2 text-center text-xs text-muted-foreground hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ImagePlus className="h-6 w-6" aria-hidden />
      {busy ? "Procesando…" : err ?? "Agregar foto"}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void accept(e.target.files?.[0])}
      />
    </div>
  );
}

function GalleryImageTile({ image, onOpen }: { image: DifusionSpaceImageData; onOpen: (src: string) => void }) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-md border border-border">
      <button type="button" onClick={() => onOpen(image.dataUrl)} className="block h-full w-full" aria-label="Ampliar foto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.dataUrl} alt="Foto del espacio" className="h-full w-full object-cover" loading="lazy" />
      </button>
      {canEdit && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!window.confirm("¿Eliminar esta foto?")) return;
            startTransition(async () => {
              const u = await deleteSpaceImage(image.id);
              if (u) undo(u);
            });
          }}
          aria-label="Eliminar foto"
          className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100 disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** Visor a pantalla completa de una foto de la galería. Se cierra con Escape,
 *  clic en el fondo, o la X — mismo patrón que los overlays de DOFA/Análisis
 *  estratégico. */
function ImageLightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!src) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto ampliada"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Foto del espacio ampliada"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
      />
    </div>
  );
}

function Fields({ s }: { s?: DifusionSpaceData }) {
  return (
    <>
      <Input
        name="title"
        defaultValue={s?.title ?? ""}
        placeholder='Espacio a intervenir (ej. "Fachada Principal")'
        required
        className="min-w-[14rem] flex-1"
      />
      <Textarea
        name="description"
        defaultValue={s?.description ?? ""}
        placeholder="Descripción del espacio y de la intervención prevista"
        className="min-h-[56px]"
      />
    </>
  );
}

function SpaceCard({ space, onOpenImage }: { space: DifusionSpaceData; onOpenImage: (src: string) => void }) {
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
              const u = await updateSpace(space.id, formData);
              if (u) undo(u);
              setEditing(false);
            }}
            className="flex flex-col gap-2"
          >
            <Fields s={space} />
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
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="font-semibold leading-tight">{space.title}</span>
          <SpaceStatusSelect spaceId={space.id} status={space.status} />
        </div>
        {canEdit && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label="Editar espacio"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm(`¿Eliminar el espacio "${space.title}" y sus ${space.images.length} foto(s)?`)) return;
                startTransition(async () => {
                  const u = await deleteSpace(space.id);
                  if (u) undo(u);
                });
              }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              aria-label="Eliminar espacio"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {space.description && <p className="whitespace-pre-line text-muted-foreground">{space.description}</p>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {space.images.map((img) => (
            <GalleryImageTile key={img.id} image={img} onOpen={onOpenImage} />
          ))}
          {canEdit && <AddImageTile spaceId={space.id} />}
        </div>
        {!canEdit && space.images.length === 0 && (
          <p className="text-xs italic text-muted-foreground">Sin fotos todavía.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DifusionSpacesPanel({ spaces }: { spaces: DifusionSpaceData[] }) {
  const canEdit = useCanEdit();
  const [adding, setAdding] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <div>
          {adding ? (
            <Card>
              <CardContent className="pt-4">
                <form
                  action={async (formData) => {
                    await addSpace(formData);
                    setAdding(false);
                  }}
                  className="flex flex-col gap-2"
                >
                  <Fields />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Crear espacio
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
              Nuevo espacio
            </Button>
          )}
        </div>
      )}

      {spaces.length === 0 ? (
        <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          Todavía no hay espacios registrados.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {spaces.map((s) => (
            <SpaceCard key={s.id} space={s} onOpenImage={setLightbox} />
          ))}
        </div>
      )}

      <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
