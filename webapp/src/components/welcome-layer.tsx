"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, Clock, FolderKanban, ListChecks, MessageSquareText, Siren, Tag, Timer, X } from "lucide-react";

import { bogotaDateKey, cn, timeAgo } from "@/lib/utils";
import { fmtMinutes } from "@/lib/lateness";
import type { FootprintRange, MasterWelcome, MemberWelcome, WelcomeHighlight, WelcomePayload } from "@/lib/welcome-types";
import { Button } from "@/components/ui/button";
import { FootprintPanel } from "@/components/footprint-panel";
import { StickyEditor, StickyPostIt } from "@/components/sticky-note";
import { NowCard, useNow } from "@/components/schedule-board";
import { WeekGlance } from "@/components/week-glance";
import { SCHEDULE_DAYS, SHIFT_CATEGORY_LABEL, fmtTime, type ShiftData } from "@/lib/office-schedule";

/** Evento que dispara el botón «Ver su pantalla de bienvenida» (ver `PreviewWelcomeButton`). */
export const PREVIEW_WELCOME_EVENT = "et:ver-capa";

/** Segundos que un monitor Junior debe esperar antes de poder cerrar la capa (la vista previa y los demás perfiles no esperan). */
const WAIT_SECONDS = 3;

const SESSION_PREFIX = "et:capa:";
const HIDE_PREFIX = "et:capa-hoy:";
/** Última versión del post-it que el Junior ya vio: una nota nueva se muestra aunque haya pedido no ver la capa hoy. */
const NOTE_SEEN_PREFIX = "et:nota-vista:";

/** Saludo según la hora de Colombia. */
function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat("es-CO", { hour: "numeric", hour12: false, timeZone: "America/Bogota" }).format(new Date()));
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** «ayer, miércoles 21 de octubre, 4:42 pm». */
function visitLabel(iso: string): string {
  const d = new Date(iso);
  const long = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", weekday: "long", day: "numeric", month: "long" }).format(d);
  const time = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", hour: "numeric", minute: "2-digit", hour12: true }).format(d).replace(/\s+/g, " ");
  const key = bogotaDateKey(d);
  const prefix = key === bogotaDateKey(new Date()) ? "hoy, " : key === bogotaDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000)) ? "ayer, " : "";
  return `${prefix}${long}, ${time}`;
}

function todayLabel(): string {
  const d = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/** Capa que se despliega al entrar a la aplicación (una vez por sesión del navegador): al máster le muestra la huella digital de
 *  los monitores; a cualquier otra persona identificada, su último ingreso, las novedades que la involucran y su semana con el
 *  bloque actual resaltado. Los datos los arma el servidor (lib/welcome.ts) y llegan por /api/bienvenida. */
export function WelcomeLayer({ profile }: { profile: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<WelcomePayload | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hideToday, setHideToday] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WAIT_SECONDS);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let hiddenToday = false;
    try {
      if (sessionStorage.getItem(SESSION_PREFIX + profile) === "1") return;
      hiddenToday = localStorage.getItem(HIDE_PREFIX + profile) === bogotaDateKey(new Date());
    } catch {
      // Sin almacenamiento (modo privado): se muestra siempre.
    }
    let cancelled = false;
    fetch("/api/bienvenida", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: WelcomePayload | null) => {
        if (cancelled || !d) return;
        // «No mostrar hoy» solo se salta si hay un post-it nuevo que esa persona aún no ha visto.
        if (hiddenToday) {
          let seen = "";
          try {
            seen = localStorage.getItem(NOTE_SEEN_PREFIX + profile) ?? "";
          } catch {
            seen = "";
          }
          if (!(d.kind === "member" && d.note && d.note.stamp !== seen)) return;
        }
        setData(d);
        setOpen(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile]);

  // El Junior no puede cerrar la capa hasta que pasen 3 segundos (la ve completa antes de entrar a la app).
  const needsWait = open && data?.kind === "member" && data.tracked && !previewing;
  const locked = needsWait && secondsLeft > 0;
  useEffect(() => {
    // Sin espera no se toca el contador: arranca en 3 para que, al abrirse, la capa nazca ya bloqueada (sin un cuadro desbloqueado).
    if (!needsWait) return;
    setSecondsLeft(WAIT_SECONDS);
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [needsWait]);

  // Vista previa de «Ver como»: abre la capa del perfil que se está viendo, sin tocar lo de «ya la cerré» ni «hoy».
  useEffect(() => {
    const show = () => {
      fetch("/api/bienvenida?vista=previa", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: WelcomePayload | null) => {
          if (!d) return;
          setData(d);
          setPreviewing(true);
          setOpen(true);
        })
        .catch(() => {});
    };
    window.addEventListener(PREVIEW_WELCOME_EVENT, show);
    return () => window.removeEventListener(PREVIEW_WELCOME_EVENT, show);
  }, []);

  const close = useCallback(() => {
    if (locked) return;
    setOpen(false);
    if (previewing) {
      setPreviewing(false);
      return;
    }
    try {
      sessionStorage.setItem(SESSION_PREFIX + profile, "1");
      if (data?.kind === "member" && data.note) localStorage.setItem(NOTE_SEEN_PREFIX + profile, data.note.stamp);
      if (hideToday) localStorage.setItem(HIDE_PREFIX + profile, bogotaDateKey(new Date()));
    } catch {
      // Sin almacenamiento: se cierra igual.
    }
  }, [profile, hideToday, previewing, locked, data]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const changeRange = useCallback(async (range: FootprintRange) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/bienvenida?rango=${range}`, { cache: "no-store" });
      const d: WelcomePayload | null = r.ok ? await r.json() : null;
      if (d) setData(d);
    } catch {
      // Se queda con el rango anterior.
    } finally {
      setLoading(false);
    }
  }, []);

  if (!open || !data) return null;

  const first = data.firstName;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-3 backdrop-blur-md sm:p-6" role="presentation">
      <div role="dialog" aria-modal="true" aria-label="Bienvenida" className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center gap-3 bg-primary px-5 py-3.5 text-primary-foreground">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary" aria-hidden>
            {first.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold">
              {greeting()}
              {first ? `, ${first}` : ""}
            </p>
            <p className="text-xs opacity-80">
              {todayLabel()}
              {data.kind === "master" ? " · Huella digital del equipo" : ""}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={locked ? `Cerrar (disponible en ${secondsLeft} s)` : "Cerrar"}
            aria-disabled={locked}
            className={cn("rounded p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent", locked ? "cursor-not-allowed opacity-60" : "hover:bg-white/15")}
          >
            {locked ? (
              <span className="flex h-5 w-5 items-center justify-center text-sm font-semibold" aria-hidden>
                {secondsLeft}
              </span>
            ) : (
              <X className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>

        {previewing && data.kind === "member" && data.preview && (
          <p className="bg-warning/15 px-5 py-1.5 text-xs font-medium text-warning">Vista previa: así abre la app {data.preview.label}. No se guarda nada.</p>
        )}

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          {data.kind === "master" ? <MasterBody data={data} loading={loading} onRange={changeRange} /> : <MemberBody data={data} onNavigate={close} locked={locked} />}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-3">
          {previewing ? (
            <span className="flex-1" />
          ) : (
            <label className="flex min-w-[10rem] flex-1 cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={hideToday} onChange={(e) => setHideToday(e.target.checked)} className="h-3.5 w-3.5" />
              No mostrar de nuevo hoy
            </label>
          )}
          <Button
            type="button"
            aria-disabled={locked}
            className={cn(locked && "cursor-not-allowed opacity-60")}
            onClick={() => {
              if (locked) return;
              const wasPreview = previewing;
              close();
              if (!wasPreview && pathname !== "/") router.push("/");
            }}
          >
            {previewing ? "Cerrar vista previa" : locked ? `Ir al panel (${secondsLeft})` : "Ir al panel"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MasterBody({ data, loading, onRange }: { data: MasterWelcome; loading: boolean; onRange: (r: FootprintRange) => void }) {
  return (
    <>
      <StickyEditor current={data.sticky} />
      <FootprintPanel footprint={data.footprint} loading={loading} onRange={onRange} />
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Se registra el nombre del botón o enlace que tocan los monitores, nunca lo que escriben. «Ver como» y tu propia actividad no cuentan. Se conservan {data.footprint.retentionDays} días.
      </p>
    </>
  );
}

const HIGHLIGHT: Record<WelcomeHighlight["kind"], { label: string; Icon: typeof Tag; cls: string }> = {
  NOTA: { label: "Nota", Icon: MessageSquareText, cls: "text-primary" },
  ETIQUETA: { label: "Te etiquetaron", Icon: Tag, cls: "text-warning" },
  HECHA: { label: "Subtarea terminada", Icon: CheckCircle2, cls: "text-success" },
};

/** Cifra grande con su rótulo, para el resumen de arriba. */
function Stat({ value, label, tone }: { value: string; label: string; tone?: "warning" }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <p className={cn("text-xl font-semibold leading-tight", tone === "warning" && "text-warning")}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 border-b border-border pb-1.5 text-sm font-semibold text-primary">
      <Icon className="h-4 w-4" aria-hidden />
      {children}
    </h2>
  );
}

/** «Hoy»: los bloques de hoy de la persona y el siguiente, en viñetas, junto con el «Ahora». */
function TodayList({ shifts }: { shifts: ShiftData[] }) {
  const now = useNow();
  if (!now) return null;
  const day = SCHEDULE_DAYS.find((d) => d.n === now.day);
  const today = shifts.filter((s) => s.day === now.day).sort((a, b) => a.start - b.start);
  const row = (s: ShiftData) => (
    <li key={s.id} className={cn("flex flex-wrap gap-x-2", s.end <= now.minutes && "text-muted-foreground line-through decoration-muted-foreground/50")}>
      <span className="font-medium tabular-nums">
        {fmtTime(s.start)}–{fmtTime(s.end)}
      </span>
      <span>
        {s.category === "OFICINA" ? "Oficina" : SHIFT_CATEGORY_LABEL[s.category]}
        {s.label ? ` · ${s.label}` : ""} · Edificio {s.location}
      </span>
    </li>
  );
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <p className="text-xs font-medium text-muted-foreground">{day ? `Hoy, ${day.name.toLowerCase()}` : "Hoy"}</p>
      {today.length > 0 ? <ul className="list-disc space-y-0.5 pl-5 marker:text-primary">{today.map(row)}</ul> : <p className="text-muted-foreground">No tienes bloques hoy.</p>}
    </div>
  );
}

function ProjectBlock({ p, locked, onNavigate }: { p: MemberWelcome["projects"][number]; locked: boolean; onNavigate: () => void }) {
  const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
  return (
    <article className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <Link
          href={`/proyectos/${encodeURIComponent(p.id)}`}
          onClick={(e) => {
            if (locked) e.preventDefault();
            else onNavigate();
          }}
          className="min-w-0 flex-1 text-sm font-semibold leading-snug hover:underline"
        >
          {p.title}
        </Link>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {p.urgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
              <Siren className="h-3 w-3" aria-hidden />
              Atención inmediata
            </span>
          )}
          <span className="rounded-full bg-accent px-2 py-0.5 text-primary">{p.role}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">{p.statusLabel}</span>
        </div>
      </div>

      {p.total > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${pct} % de las subtareas terminadas`}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <span>
            {p.done} de {p.total} subtareas
          </span>
          {p.myPending > 0 && (
            <span className={cn(p.myOverdue > 0 && "font-medium text-warning")}>
              · {p.myPending} {p.myPending === 1 ? "pendiente tuya" : "pendientes tuyas"}
              {p.myOverdue > 0 ? ` (${p.myOverdue} ${p.myOverdue === 1 ? "vencida" : "vencidas"})` : ""}
            </span>
          )}
        </div>
      )}

      {p.highlights.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">Lo importante desde tu último ingreso</p>
          <ul className="space-y-1 text-sm">
            {p.highlights.map((h, i) => {
              const { label, Icon, cls } = HIGHLIGHT[h.kind];
              return (
                <li key={i} className="flex items-start gap-2">
                  <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", cls)} aria-hidden />
                  <span className="min-w-0">
                    <span className={cn("font-medium", cls)}>{label}</span>
                    {h.who ? ` de ${h.who}` : ""} <span className="text-xs text-muted-foreground">({timeAgo(h.at)})</span>: {h.kind === "HECHA" ? h.text : `«${h.text}»`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Sin novedades desde tu último ingreso.</p>
      )}
    </article>
  );
}

function MemberBody({ data, onNavigate, locked }: { data: MemberWelcome; onNavigate: () => void; locked: boolean }) {
  const hasLate = data.tracked && data.late !== null;
  const hiddenProjects = data.projectsTotal - data.projects.length;
  return (
    <>
      {data.note && <StickyPostIt note={data.note} />}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {data.lastVisit ? (
          <span>
            Último ingreso: <span className="font-medium text-foreground">{visitLabel(data.lastVisit)}</span> ({timeAgo(data.lastVisit)})
          </span>
        ) : (
          <span>Es tu primer ingreso registrado.</span>
        )}
      </p>

      <section aria-label="Resumen" className={cn("grid grid-cols-2 gap-2", hasLate ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
        <Stat value={String(data.projectsTotal)} label={data.projectsTotal === 1 ? "proyecto activo" : "proyectos activos"} />
        <Stat value={String(data.updatesTotal)} label={data.updatesTotal === 1 ? "novedad nueva" : "novedades nuevas"} />
        <Stat
          value={String(data.pendingTotal)}
          label={data.overdueTotal > 0 ? `subtareas tuyas (${data.overdueTotal} vencidas)` : "subtareas tuyas pendientes"}
          tone={data.overdueTotal > 0 ? "warning" : undefined}
        />
        {hasLate && data.late && (
          <Stat value={fmtMinutes(data.late.minutes)} label={data.late.count === 0 ? "sin tardanzas este semestre" : `tiempo tarde (${data.late.count} ${data.late.count === 1 ? "vez" : "veces"})`} tone={data.late.minutes > 0 ? "warning" : undefined} />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle icon={FolderKanban}>Tus proyectos</SectionTitle>
        {data.projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no tienes proyectos abiertos asignados.</p>
        ) : (
          data.projects.map((p) => <ProjectBlock key={p.id} p={p} locked={locked} onNavigate={onNavigate} />)
        )}
        {hiddenProjects > 0 && <p className="text-xs text-muted-foreground">Y {hiddenProjects} {hiddenProjects === 1 ? "proyecto más" : "proyectos más"} en «Asignados a ti» del panel.</p>}
      </section>

      {data.shifts.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle icon={CalendarClock}>Tu horario</SectionTitle>
          <NowCard shifts={data.shifts} />
          <TodayList shifts={data.shifts} />
          <details className="rounded-lg border border-border text-sm">
            <summary className="flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-muted-foreground">
              <ListChecks className="h-4 w-4" aria-hidden />
              Ver mi semana completa
            </summary>
            <div className="border-t border-border p-3">
              <WeekGlance shifts={data.shifts} />
            </div>
          </details>
        </section>
      )}

      {data.tracked && <p className="text-[11px] leading-relaxed text-muted-foreground">Tu actividad en la app se registra para el seguimiento del equipo.</p>}
    </>
  );
}
