"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clock, X } from "lucide-react";

import { bogotaDateKey, cn, timeAgo } from "@/lib/utils";
import type { FootprintRange, MasterWelcome, MemberWelcome, NewsReason, WelcomePayload } from "@/lib/welcome-types";
import { Button } from "@/components/ui/button";
import { FootprintPanel } from "@/components/footprint-panel";
import { NowCard } from "@/components/schedule-board";
import { WeekGlance } from "@/components/week-glance";

/** Evento que dispara el botón «Ver su pantalla de bienvenida» (ver `PreviewWelcomeButton`). */
export const PREVIEW_WELCOME_EVENT = "et:ver-capa";

const SESSION_PREFIX = "et:capa:";
const HIDE_PREFIX = "et:capa-hoy:";

const REASON: Record<NewsReason, { label: string; cls: string }> = {
  TAG: { label: "Te etiquetaron", cls: "bg-warning/15 text-warning" },
  SUBTASK: { label: "Tu subtarea", cls: "bg-accent text-primary" },
  PROJECT: { label: "Tu proyecto", cls: "bg-accent text-primary" },
};

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
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_PREFIX + profile) === "1") return;
      if (localStorage.getItem(HIDE_PREFIX + profile) === bogotaDateKey(new Date())) return;
    } catch {
      // Sin almacenamiento (modo privado): se muestra siempre.
    }
    let cancelled = false;
    fetch("/api/bienvenida", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: WelcomePayload | null) => {
        if (cancelled || !d) return;
        setData(d);
        setOpen(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile]);

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
    setOpen(false);
    if (previewing) {
      setPreviewing(false);
      return;
    }
    try {
      sessionStorage.setItem(SESSION_PREFIX + profile, "1");
      if (hideToday) localStorage.setItem(HIDE_PREFIX + profile, bogotaDateKey(new Date()));
    } catch {
      // Sin almacenamiento: se cierra igual.
    }
  }, [profile, hideToday, previewing]);

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-3 sm:p-6" role="presentation">
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
          <button ref={closeRef} type="button" onClick={close} aria-label="Cerrar" className="rounded p-1.5 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {previewing && data.kind === "member" && data.preview && (
          <p className="bg-warning/15 px-5 py-1.5 text-xs font-medium text-warning">Vista previa: así abre la app {data.preview.label}. No se guarda nada.</p>
        )}

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          {data.kind === "master" ? <MasterBody data={data} loading={loading} onRange={changeRange} /> : <MemberBody data={data} onNavigate={close} />}
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
            onClick={() => {
              const wasPreview = previewing;
              close();
              if (!wasPreview && pathname !== "/") router.push("/");
            }}
          >
            {previewing ? "Cerrar vista previa" : "Ir al panel"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MasterBody({ data, loading, onRange }: { data: MasterWelcome; loading: boolean; onRange: (r: FootprintRange) => void }) {
  return (
    <>
      <FootprintPanel footprint={data.footprint} loading={loading} onRange={onRange} />
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Se registra el nombre del botón o enlace que tocan los monitores, nunca lo que escriben. «Ver como» y tu propia actividad no cuentan. Se conservan {data.footprint.retentionDays} días.
      </p>
    </>
  );
}

function MemberBody({ data, onNavigate }: { data: MemberWelcome; onNavigate: () => void }) {
  return (
    <>
      <p className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        {data.lastVisit ? (
          <span>
            Tu último ingreso fue <span className="font-medium">{visitLabel(data.lastVisit)}</span> <span className="text-muted-foreground">({timeAgo(data.lastVisit)})</span>
          </span>
        ) : (
          <span>Es tu primer ingreso registrado.</span>
        )}
      </p>

      {data.news.length > 0 && (
        <section className="flex flex-col gap-0.5">
          <h2 className="text-xs font-medium text-muted-foreground">Para ti desde tu último ingreso · {data.newsTotal}</h2>
          {data.news.map((n) => (
            <div key={n.id} className="flex items-baseline gap-2.5 border-b border-border py-2 text-sm last:border-b-0">
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px]", REASON[n.reason].cls)}>{REASON[n.reason].label}</span>
              <p className="min-w-0 flex-1">
                <Link href={`/proyectos/${encodeURIComponent(n.projectId)}#p-bitacora`} onClick={onNavigate} className="font-medium hover:underline">
                  {n.projectTitle}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  · {n.author}, {timeAgo(n.at)} — «{n.excerpt}»
                </span>
              </p>
            </div>
          ))}
          {data.newsTotal > data.news.length && <p className="pt-1 text-xs text-muted-foreground">Y {data.newsTotal - data.news.length} más para ti en la bitácora de tus proyectos.</p>}
        </section>
      )}

      {data.shifts.length > 0 && (
        <section className="flex flex-col gap-3">
          <NowCard shifts={data.shifts} />
          <WeekGlance shifts={data.shifts} />
        </section>
      )}

      {data.tracked && <p className="text-[11px] leading-relaxed text-muted-foreground">Tu actividad en la app se registra para el seguimiento del equipo.</p>}
    </>
  );
}
