"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { PersonAvatar } from "@/components/person-avatar";

/** Redimensiona y comprime una imagen en el navegador a un data URL pequeño
 *  (lado máx. 256 px, JPEG). Así la foto cabe en la columna photoUrl sin
 *  necesidad de almacenamiento de archivos. */
async function fileToDataUrl(file: File, max = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("sin canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function PhotoField({
  name = "photoUrl",
  defaultValue,
  personName = "",
}: {
  name?: string;
  defaultValue?: string | null;
  personName?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Elige un archivo de imagen.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      let url = await fileToDataUrl(file, 256);
      if (url.length > 380_000) url = await fileToDataUrl(file, 192);
      if (url.length > 380_000) {
        setError("La imagen es muy pesada incluso comprimida. Prueba con otra.");
      } else {
        setValue(url);
      }
    } catch {
      setError("No se pudo procesar la imagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-2.5">
        <PersonAvatar name={personName || "?"} photoUrl={value.length > 0 ? value : null} size="md" />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            {busy ? "Procesando…" : "Subir foto"}
          </button>
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => setValue("")}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
              Quitar
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      </div>
      <Input
        value={value.startsWith("data:") ? "" : value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="…o pega una URL / nombre de archivo de /avatares/"
        className="h-8 text-xs"
        aria-label="URL o nombre de archivo de la foto"
      />
      {value.startsWith("data:") && (
        <p className="text-xs text-muted-foreground">Foto subida (se guarda comprimida).</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
