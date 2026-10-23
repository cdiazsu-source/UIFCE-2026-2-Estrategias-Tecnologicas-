"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, History, Maximize2, Palette, X } from "lucide-react";

import { deleteMeeting, saveMeeting } from "@/lib/actions/coordination";
import { MEETING_LABEL_MAX, SLIDE_KEYS, SLIDE_LABEL, type CoordData, type CoordProject, type CoordTeam, type MeetingSummary, type SlideKey } from "@/lib/coordination";
import { RETURN_KEY, RETURN_SECONDS } from "@/lib/reunion-return";
import { initials, resolvePhoto } from "@/components/person-avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DesignEditor, type TemplateOption } from "@/components/coordination-design";
import { SLIDE_NUMBER, Slide } from "@/components/coordination-slides";

const longDate = (iso: string) => new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const todayBogota = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

/** Guardar la reunión con su fecha y abrir las anteriores. `meetings` null = la tabla no existe todavía. */
function MeetingBar({ meetings, viewing }: { meetings: MeetingSummary[] | null; viewing: MeetingSummary | null }) {
  const router = useRouter();
  const [date, setDate] = useState(todayBogota);
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (meetings === null) return <p className="rounded-lg border border-dashed border-input p-3 text-xs text-muted-foreground">El historial de reuniones todavía no está disponible (falta aplicar la migración con db:deploy).</p>;

  if (viewing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
        <span>
          <span className="font-medium">Reunión del {longDate(viewing.date)}</span>
          {viewing.label ? ` · ${viewing.label}` : ""} <span className="text-muted-foreground">(guardada, solo lectura)</span>
        </span>
        <Link href="/reunion" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
          Volver a la reunión actual
        </Link>
      </div>
    );
  }

  const save = () => {
    setMsg(null);
    start(async () => {
      const r = await saveMeeting(date, label);
      if (r.ok) {
        setMsg({ ok: true, text: `Reunión del ${longDate(date)} guardada.` });
        setLabel("");
        router.refresh();
      } else setMsg({ ok: false, text: r.error });
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium">
          Fecha de la reunión
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 w-40 text-sm font-normal" />
        </label>
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs font-medium">
          Nombre (opcional)
          <Input value={label} maxLength={MEETING_LABEL_MAX} onChange={(e) => setLabel(e.target.value)} placeholder="Ej.: Coordinación semana 10" className="h-9 text-sm font-normal" />
        </label>
        <Button type="button" size="sm" variant="outline" onClick={save} disabled={pending}>
          {pending ? "Guardando…" : "Guardar reunión"}
        </Button>
      </div>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={cn("text-xs", msg.ok ? "text-success" : "text-destructive")}>
          {msg.text}
        </p>
      )}
      <details className="rounded-lg border border-border">
        <summary className="flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-xs font-medium">
          <History className="h-4 w-4 text-muted-foreground" aria-hidden />
          Reuniones anteriores ({meetings.length})
        </summary>
        {meetings.length === 0 ? (
          <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">Todavía no hay reuniones guardadas.</p>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {meetings.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <Link href={`/reunion?reunion=${m.id}`} className="min-w-0 flex-1 truncate font-medium text-primary underline-offset-2 hover:underline">
                  {longDate(m.date)}
                  {m.label ? ` · ${m.label}` : ""}
                </Link>
                <button
                  type="button"
                  aria-label={`Borrar la reunión del ${longDate(m.date)}`}
                  onClick={() => window.confirm("¿Borrar esta reunión guardada?") && start(async () => (await deleteMeeting(m.id), router.refresh()))}
                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}

/** «Reunión coordinación»: cinco páginas (general y una por parte), modo diseño, modo presentar e historial de reuniones guardadas. */
/** Banner permanente (en todas las páginas): escudo de la Unidad, nombre de la reunión, área y máster a cargo con su foto. */
function MeetingBanner({ master, big }: { master: CoordTeam["master"]; big: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-primary px-5 py-3 text-primary-foreground">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-uifce.png" alt="Escudo de la UIFCE" className={big ? "h-14 w-auto" : "h-10 w-auto"} />
      <div className="min-w-0 flex-1 text-center">
        <p className={cn("truncate font-semibold tracking-tight", big ? "text-3xl" : "text-lg")}>Reunión de coordinación</p>
        <p className={cn("truncate text-primary-foreground/70", big ? "text-base" : "text-xs")}>Estrategias Tecnológicas (ET)</p>
      </div>
      {master ? (
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className={cn("text-primary-foreground/70", big ? "text-sm" : "text-[11px]")}>Máster a cargo</p>
            <p className={cn("font-semibold", big ? "text-xl" : "text-sm")}>{master.name}</p>
          </div>
          {master.photoUrl && master.photoUrl.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolvePhoto(master.photoUrl.trim())} alt={master.name} className={cn("rounded-full border-2 border-white/60 object-cover", big ? "h-16 w-16" : "h-11 w-11")} />
          ) : (
            <span className={cn("flex items-center justify-center rounded-full border-2 border-white/60 bg-white/15 font-semibold", big ? "h-16 w-16 text-lg" : "h-11 w-11 text-sm")}>{initials(master.name)}</span>
          )}
        </div>
      ) : (
        <span className="w-10 shrink-0" aria-hidden />
      )}
    </div>
  );
}

export function CoordinationBoard({
  data,
  meetings,
  viewing,
  templates,
  team,
  initialSlide,
  initialPresenting,
}: {
  data: CoordData;
  meetings: MeetingSummary[] | null;
  viewing: MeetingSummary | null;
  templates: TemplateOption[];
  team: CoordTeam;
  initialSlide: SlideKey;
  initialPresenting: boolean;
}) {
  const router = useRouter();
  const [slide, setSlide] = useState<SlideKey>(initialSlide);
  const [designMode, setDesignMode] = useState(false);
  const [presenting, setPresenting] = useState(initialPresenting);
  const root = useRef<HTMLDivElement>(null);
  const readOnly = !!viewing;
  const dateLine = viewing ? `Reunión del ${longDate(viewing.date)}` : `Corte al ${new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" }).format(new Date())}`;
  const at = SLIDE_KEYS.indexOf(slide);
  const go = (delta: number) => setSlide(SLIDE_KEYS[(at + delta + SLIDE_KEYS.length) % SLIDE_KEYS.length]);

  // Flechas para pasar de página (salvo al escribir); Esc sale de presentar; salir de pantalla completa también.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") setPresenting(false);
    };
    const onFs = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at]);

  // Tocar un proyecto lleva a su página; queda guardado a dónde volver y un botón flotante lo ofrece durante 30 segundos.
  const openProject = (p: CoordProject) => {
    const q = new URLSearchParams({ pagina: slide });
    if (viewing) q.set("reunion", viewing.id);
    if (presenting) q.set("presentar", "1");
    try {
      sessionStorage.setItem(RETURN_KEY, JSON.stringify({ href: `/reunion?${q.toString()}`, label: SLIDE_LABEL[slide], until: Date.now() + RETURN_SECONDS * 1000 }));
    } catch {
      // sin sessionStorage no hay botón de regreso, pero el proyecto abre igual
    }
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
    } catch {
      // nada
    }
    router.push(`/proyectos/${p.id}`);
  };

  const present = () => {
    setDesignMode(false);
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
      <div className="flex flex-col gap-6">
        <div className={cn(presenting && "sticky top-0 z-10")}>
          <MeetingBanner master={team.master} big={presenting} />
        </div>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <h1 className="sr-only">Reunión de coordinación</h1>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">{dateLine}</p>
            {presenting ? (
              <Button type="button" size="sm" variant="outline" onClick={leave}>
                Salir (Esc)
              </Button>
            ) : (
              <>
                {!readOnly && (
                  <Button type="button" size="sm" variant={designMode ? "default" : "outline"} aria-pressed={designMode} onClick={() => setDesignMode((v) => !v)}>
                    <Palette className="mr-1.5 h-4 w-4" aria-hidden />
                    Modo diseño
                  </Button>
                )}
                <Button type="button" size="sm" onClick={present}>
                  <Maximize2 className="mr-1.5 h-4 w-4" aria-hidden />
                  Presentar
                </Button>
              </>
            )}
          </div>
        </header>

        {!presenting && <MeetingBar meetings={meetings} viewing={viewing} />}

        <nav aria-label="Páginas de la presentación" className={cn("flex flex-wrap gap-1.5", presenting && "justify-center")}>
          {SLIDE_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              aria-current={k === slide ? "page" : undefined}
              onClick={() => setSlide(k)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", k === slide ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted", presenting && "px-4 py-1.5 text-sm")}
            >
              {SLIDE_NUMBER[k] ? `${SLIDE_NUMBER[k]} · ` : ""}
              {data.design[k].title || SLIDE_LABEL[k]}
            </button>
          ))}
        </nav>

        <Slide key={slide} slide={slide} data={data} team={team} big={presenting} canEditBlockers={!presenting && !readOnly} onGo={setSlide} onOpenProject={openProject} />

        {designMode && !readOnly && !presenting && <DesignEditor key={slide} slide={slide} initial={data.design[slide]} templates={templates} />}

        <div className="flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
          <Button type="button" size="sm" variant="ghost" onClick={() => go(-1)}>
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
            Anterior
          </Button>
          <span>
            Página {at + 1} de {SLIDE_KEYS.length}
          </span>
          <Button type="button" size="sm" variant="ghost" onClick={() => go(1)}>
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
