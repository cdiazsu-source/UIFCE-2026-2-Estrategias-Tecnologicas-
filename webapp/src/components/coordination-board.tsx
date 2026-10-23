"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, Maximize2, Plus, X } from "lucide-react";

import { addBlocker, deleteBlocker } from "@/lib/actions/coordination";
import { BLOCKER_MAX, type CoordBlocker, type CoordProject } from "@/lib/coordination";
import { PROJECT_STATUS_LABEL, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_STYLE: Record<string, string> = {
  COMPLETADO: "bg-success/10 text-success",
  EN_CURSO: "bg-primary/10 text-primary",
};

function StatusChip({ status }: { status: string }) {
  const label = status === "COMPLETADO" ? "Entregado" : (PROJECT_STATUS_LABEL[status] ?? status);
  return <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_STYLE[status] ?? "bg-muted text-muted-foreground")}>{label}</span>;
}

function ProjectRow({ p, big }: { p: CoordProject; big: boolean }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className={cn("font-medium leading-snug", big ? "text-lg" : "text-sm")}>{p.title}</p>
        <p className={cn("mt-0.5 text-muted-foreground", big ? "text-sm" : "text-xs")}>
          {p.category}
          {p.assignee ? ` · ${p.assignee}` : ""}
          {p.total > 0 ? ` · ${p.done} de ${p.total} subtareas` : ""}
        </p>
      </div>
      <StatusChip status={p.status} />
    </li>
  );
}

function Block({ n, title, hint, children, big }: { n: string; title: string; hint?: string; children: React.ReactNode; big: boolean }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3 border-b border-border pb-2">
        <span className={cn("font-semibold text-primary", big ? "text-lg" : "text-sm")}>{n}</span>
        <h2 className={cn("font-semibold tracking-tight", big ? "text-3xl" : "text-xl")}>{title}</h2>
        {hint && <span className={cn("text-muted-foreground", big ? "text-base" : "text-sm")}>{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Blockers({ blockers, big, editable }: { blockers: CoordBlocker[] | null; big: boolean; editable: boolean }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (blockers === null) return <p className="rounded-lg border border-dashed border-input p-4 text-sm text-muted-foreground">Los bloqueos todavía no están disponibles (falta aplicar la migración con db:deploy).</p>;

  const add = () => {
    setError(null);
    const fd = new FormData();
    fd.set("text", text);
    start(async () => {
      const r = await addBlocker(fd);
      if (r.ok) setText("");
      else setError(r.error);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className={cn("font-medium uppercase tracking-wide text-muted-foreground", big ? "text-sm" : "text-xs")}>Bloqueos</p>
      {blockers.length === 0 ? (
        <p className={cn("text-muted-foreground", big ? "text-lg" : "text-sm")}>Sin bloqueos por ahora.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {blockers.map((b) => (
            <li key={b.id} className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
              <AlertTriangle className={cn("mt-0.5 shrink-0 text-warning", big ? "h-6 w-6" : "h-4 w-4")} aria-hidden />
              <p className={cn("min-w-0 flex-1 font-medium", big ? "text-xl" : "text-sm")}>{b.text}</p>
              {editable && (
                <button
                  type="button"
                  aria-label="Quitar el bloqueo"
                  disabled={pending}
                  onClick={() => start(async () => void (await deleteBlocker(b.id)))}
                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editable && (
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={BLOCKER_MAX} placeholder="Nuevo bloqueo" className="h-9 text-sm" onKeyDown={(e) => e.key === "Enter" && text.trim() && add()} />
            <Button type="button" size="sm" variant="outline" onClick={add} disabled={pending}>
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
      )}
    </div>
  );
}

/** «Reunión coordinación»: lámina de tres bloques. «Presentar» la abre a pantalla completa, sin menú ni buscador (Esc la cierra). */
export function CoordinationBoard({ delivered, upcoming, blockers }: { delivered: CoordProject[]; upcoming: CoordProject[]; blockers: CoordBlocker[] | null }) {
  const [presenting, setPresenting] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const today = new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" }).format(new Date());

  // Al salir de la pantalla completa (Esc del navegador) se sale también del modo presentar.
  useEffect(() => {
    if (!presenting) return;
    const onFs = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPresenting(false);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("keydown", onKey);
    };
  }, [presenting]);

  const present = () => {
    setPresenting(true);
    try {
      void root.current?.requestFullscreen?.();
    } catch {
      // Sin pantalla completa del navegador, queda la capa que cubre la ventana.
    }
  };
  const leave = () => {
    setPresenting(false);
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
    } catch {
      // nada
    }
  };

  return (
    <div ref={root} className={cn(presenting ? "fixed inset-0 z-[70] overflow-y-auto bg-card px-10 py-8" : "mx-auto w-full max-w-4xl px-4 py-8")}>
      <div className="flex flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">UIFCE · Estrategias Tecnológicas</p>
            <h1 className={cn("mt-1 font-semibold tracking-tight", presenting ? "text-5xl" : "text-3xl")}>Reunión de coordinación</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">Corte al {today}</p>
            {presenting ? (
              <Button type="button" size="sm" variant="outline" onClick={leave}>
                Salir (Esc)
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={present}>
                <Maximize2 className="mr-1.5 h-4 w-4" aria-hidden />
                Presentar
              </Button>
            )}
          </div>
        </header>

        <Block n="01" title="Lo que entregamos" hint={`${delivered.length} proyectos`} big={presenting}>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {delivered.map((p) => (
              <ProjectRow key={p.id} p={p} big={presenting} />
            ))}
          </ul>
        </Block>

        <Block n="02" title="En curso y bloqueos" big={presenting}>
          <Blockers blockers={blockers} big={presenting} editable={!presenting} />
        </Block>

        <Block n="03" title="En los próximos 15 días" hint="Atención inmediata" big={presenting}>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay otros proyectos en atención inmediata.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {upcoming.map((p) => (
                <ProjectRow key={p.id} p={p} big={presenting} />
              ))}
            </ul>
          )}
        </Block>
      </div>
    </div>
  );
}
