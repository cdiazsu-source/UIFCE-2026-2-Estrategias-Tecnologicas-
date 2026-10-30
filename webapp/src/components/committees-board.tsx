"use client";

import { useState, useTransition } from "react";
import { CalendarClock, CalendarPlus, Loader2, Trash2, X } from "lucide-react";

import { createCommittee, deleteCommittee } from "@/lib/actions/committees";
import { COMMITTEE_KINDS, COMMITTEE_KIND_LABEL, COMMITTEE_NAME_MAX, type CommitteeKind, type CommitteeRow } from "@/lib/committees";
import { InfoHint } from "@/components/info-hint";
import { cn } from "@/lib/utils";

const KIND_STYLE: Record<CommitteeKind, string> = {
  COORDINACION: "bg-primary/10 text-primary",
  DIRECCION: "bg-accent text-accent-foreground",
};

const DATE_FMT = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" });
const TIME_FMT = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Bogota" });

export function CommitteesBoard({ committees }: { committees: CommitteeRow[] | null }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const now = Date.now();

  function remove(c: CommitteeRow) {
    if (!window.confirm(`¿Quitar «${c.name}» de la lista?`)) return;
    startTransition(async () => {
      const res = await deleteCommittee(c.id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-1.5 text-xl font-bold">
            Comités de Gestión
            <InfoHint text="Reuniones de coordinación y de dirección programadas por el máster. Cómo se usa: «Nueva reunión» pide nombre, fecha y hora y tipo de comité; la lista queda en orden cronológico. Ejemplo: «Reunión de dirección 2 · 30 de octubre de 2026 · Dirección»." />
          </h1>
          <p className="text-sm text-muted-foreground">Programa y consulta las reuniones de coordinación y de dirección.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          Nueva reunión
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {committees === null ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          Comités de Gestión todavía no está disponible: falta aplicar la migración en la base de datos (db:deploy).
        </p>
      ) : committees.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">Aún no hay reuniones programadas. Usa «Nueva reunión» para crear la primera.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {committees.map((c) => {
            const d = new Date(c.startsAt);
            const past = d.getTime() < now;
            return (
              <li key={c.id} className={cn("flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm", past && "opacity-70")}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                  <CalendarClock className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="capitalize">{DATE_FMT.format(d)}</span> · {TIME_FMT.format(d)}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", KIND_STYLE[c.kind])}>{COMMITTEE_KIND_LABEL[c.kind]}</span>
                <button type="button" onClick={() => remove(c)} disabled={pending} title="Quitar reunión" aria-label={`Quitar ${c.name}`} className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open && <NewCommitteeDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function NewCommitteeDialog({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState<CommitteeKind>("COORDINACION");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    formData.set("kind", kind);
    startTransition(async () => {
      const res = await createCommittee(formData);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  const field = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Nueva reunión" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form action={submit} className="relative flex w-full max-w-md flex-col gap-4 rounded-2xl bg-card p-5 shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted">
          <X className="h-5 w-5" aria-hidden />
        </button>
        <h2 className="text-lg font-bold">Nueva reunión</h2>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Nombre de la reunión
          <input name="name" required maxLength={COMMITTEE_NAME_MAX} autoFocus placeholder="Ej.: Reunión de dirección 2" className={field} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Fecha y hora
          <input name="startsAt" type="datetime-local" required className={field} />
        </label>

        <fieldset className="flex flex-col gap-1 text-sm font-medium">
          <legend className="mb-1">Tipo de comité</legend>
          <div className="flex gap-2">
            {COMMITTEE_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={cn("flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition-colors", kind === k ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}
              >
                {COMMITTEE_KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
