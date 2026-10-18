"use client";

import { useRef, useState } from "react";
import { ExternalLink, Link2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { linkDisplay, NOTE_LINKS_MAX, type NoteLink } from "@/lib/note-links";

/** Apartado «Enlaces»: filas de nombre (opcional) + URL. Los campos paralelos
 *  linkLabel / linkUrl los lee el servidor (linksFromForm); las filas sin URL válida se descartan.
 *  Lo usan la bitácora y el encabezado de cada proyecto. */
export function LinksField({ defaultValue = [] }: { defaultValue?: NoteLink[] }) {
  const seq = useRef(0);
  const [rows, setRows] = useState(() => defaultValue.map((l) => ({ key: seq.current++, ...l })));

  return (
    <div className="flex flex-col gap-2">
      {rows.length > 0 && (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.key} className="flex flex-wrap items-center gap-2">
              <Input
                name="linkLabel"
                defaultValue={r.label}
                placeholder="Nombre (ej. Carpeta de Drive, Canva, Sitio web)"
                aria-label="Nombre del enlace"
                maxLength={80}
                className="w-full sm:w-64"
              />
              <Input
                name="linkUrl"
                type="url"
                defaultValue={r.url}
                placeholder="https://…"
                aria-label="Dirección del enlace"
                className="min-w-[14rem] flex-1"
              />
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Quitar enlace"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {rows.length < NOTE_LINKS_MAX && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => setRows((rs) => [...rs, { key: seq.current++, label: "", url: "" }])}
        >
          <Plus className="h-3.5 w-3.5" />
          {rows.length === 0 ? "Agregar enlace" : "Agregar otro enlace"}
        </Button>
      )}
    </div>
  );
}

/** Enlaces como botones con nombre que abren en otra pestaña. No pinta nada si no hay. */
export function LinkChips({ links, className }: { links: NoteLink[]; className?: string }) {
  if (links.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {links.map((l, i) => (
        <li key={i} className="max-w-full">
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            title={l.url}
            className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-link hover:bg-accent"
          >
            <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="min-w-0 truncate">{linkDisplay(l)}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
