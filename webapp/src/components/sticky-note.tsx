"use client";

import { useState, useTransition } from "react";
import { StickyNote as StickyIcon } from "lucide-react";

import { clearSticky, saveSticky } from "@/lib/actions/sticky-note";
import { STICKY_COLORS, STICKY_MAX, type StickyColor, type StickyData } from "@/lib/sticky-note";
import { cn, timeAgo } from "@/lib/utils";
import { JUNIOR_PROFILES } from "@/lib/view-profiles";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** «para Junior Artes» / «para Junior Artes y Junior ET». */
function audience(to: string[]): string {
  return `para ${to.map((k) => JUNIOR_PROFILES[k] ?? k).join(" y ")}`;
}

/** El post-it: una nota grande, de color, con una cinta arriba y un leve giro. Es lo primero que ve el Junior al abrir la app. */
export function StickyPostIt({ note, preview = false }: { note: Pick<StickyData, "body" | "color" | "author"> & { at?: string }; preview?: boolean }) {
  const c = STICKY_COLORS[note.color];
  return (
    <section aria-label="Nota del máster" className="relative mt-2 rotate-[-0.7deg]">
      <span aria-hidden className="absolute -top-2 left-1/2 h-4 w-20 -translate-x-1/2 rounded-sm opacity-70" style={{ background: c.edge }} />
      <div className="rounded-sm px-5 pb-4 pt-5 shadow-md" style={{ background: c.bg, color: c.fg, borderBottom: `4px solid ${c.edge}` }}>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide opacity-80">
          <StickyIcon className="h-3.5 w-3.5" aria-hidden />
          Nota de {note.author}
          {note.at && !preview ? <span className="font-normal normal-case"> · {timeAgo(note.at)}</span> : null}
        </p>
        <p className="whitespace-pre-wrap break-words text-xl font-semibold leading-snug sm:text-2xl">{note.body}</p>
      </div>
    </section>
  );
}

/** Editor del post-it (solo el máster): texto, color, publicar y retirar. Arranca plegado para no sumar ruido. */
export function StickyEditor({ current }: { current: StickyData | null }) {
  const [note, setNote] = useState<StickyData | null>(current);
  const [body, setBody] = useState(current?.body ?? "");
  const [color, setColor] = useState<StickyColor>(current?.color ?? "AMARILLO");
  const [to, setTo] = useState<string[]>(current?.to ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const publish = () => {
    setError(null);
    setSaved(null);
    const fd = new FormData();
    fd.set("body", body);
    fd.set("color", color);
    to.forEach((k) => fd.append("to", k));
    start(async () => {
      const r = await saveSticky(fd);
      if (r.ok) {
        setNote({ body: body.trim(), color, author: "tú", at: new Date().toISOString(), stamp: String(Date.now()), to });
        setSaved(to.length ? `Publicada: la verán ${audience(to)}.` : "Publicada: la verán los Junior al abrir la app.");
      } else setError(r.error);
    });
  };
  const retire = () => {
    setError(null);
    setSaved(null);
    start(async () => {
      const r = await clearSticky();
      if (r.ok) {
        setNote(null);
        setBody("");
        setSaved("Retirada.");
      } else setError(r.error);
    });
  };

  return (
    <details className="rounded-lg border border-border">
      <summary className="flex cursor-pointer select-none flex-wrap items-center gap-2 px-3 py-2 text-sm">
        <StickyIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="font-medium">Post-it para los Junior</span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{note ? `Vigente${note.to.length ? ` (${audience(note.to)})` : ""}: «${note.body}»` : "No hay nota vigente"}</span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-border p-3">
        <label className="flex flex-col gap-1 text-xs font-medium">
          Mensaje (lo primero que verán al abrir la app)
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={STICKY_MAX} placeholder="Ej.: Esta semana la prioridad es la cartelera del piso 2. Entreguen el viernes." className="min-h-[90px] text-sm font-normal" />
          <span className="self-end text-[11px] font-normal text-muted-foreground">
            {body.length}/{STICKY_MAX}
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Color del post-it">
          <span className="text-xs font-medium">Color</span>
          {(Object.keys(STICKY_COLORS) as StickyColor[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={color === k}
              onClick={() => setColor(k)}
              className={cn("rounded-full border px-3 py-1 text-xs", color === k ? "ring-2 ring-primary ring-offset-1" : "")}
              style={{ background: STICKY_COLORS[k].bg, color: STICKY_COLORS[k].fg, borderColor: STICKY_COLORS[k].edge }}
            >
              {STICKY_COLORS[k].label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Para quién es el post-it">
          <span className="text-xs font-medium">Para</span>
          <button type="button" aria-pressed={to.length === 0} onClick={() => setTo([])} className={cn("rounded-full border px-3 py-1 text-xs", to.length === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>
            Todos los Junior
          </button>
          {Object.entries(JUNIOR_PROFILES).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={to.includes(key)}
              onClick={() => setTo((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : cur.length + 1 >= Object.keys(JUNIOR_PROFILES).length ? [] : [...cur, key]))}
              className={cn("rounded-full border px-3 py-1 text-xs", to.includes(key) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}
            >
              {label}
            </button>
          ))}
        </div>
        {body.trim() && <StickyPostIt note={{ body: body.trim(), color, author: "tú" }} preview />}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        {saved && <p className="text-xs text-success">{saved}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={publish} disabled={pending}>
            {pending ? "Guardando…" : note ? "Actualizar post-it" : "Publicar post-it"}
          </Button>
          {note && (
            <Button type="button" size="sm" variant="outline" onClick={retire} disabled={pending}>
              Retirar
            </Button>
          )}
        </div>
      </div>
    </details>
  );
}
