"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, ExternalLink, Flag, MessageSquareText, OctagonAlert, PackageCheck, Plus, X, type LucideIcon } from "lucide-react";

import { addBlocker, deleteBlocker } from "@/lib/actions/coordination";
import { BLOCKER_MAX, SLIDE_LABEL, type CoordBlocker, type CoordData, type CoordProject, type CoordTeam, type DesignImage, type PageDesign, type SlideKey, type TeamMember } from "@/lib/coordination";
import { initials, resolvePhoto } from "@/components/person-avatar";
import { PROJECT_STATUS_LABEL, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Contenido de cada página de «Reunión coordinación». `big` = modo presentar (letra grande). */

export const SLIDE_NUMBER: Record<SlideKey, string> = { portada: "", general: "", entregamos: "01", bloqueos: "02", corte: "03", notas: "04" };

const STATUS_STYLE: Record<string, string> = {
  COMPLETADO: "bg-success/10 text-success",
  EN_CURSO: "bg-primary/10 text-primary",
};

function StatusChip({ status }: { status: string }) {
  const label = status === "COMPLETADO" ? "Entregado" : (PROJECT_STATUS_LABEL[status] ?? status);
  return <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_STYLE[status] ?? "bg-muted text-muted-foreground")}>{label}</span>;
}

/** Imagen mini del proyecto: las de sus plantillas enlazadas; si son varias, se turnan con un fundido cada 4 segundos (salvo que se pida menos movimiento). */
function RotatingImage({ images, big }: { images: string[]; big: boolean }) {
  const [i, setI] = useState(0);
  const n = images.length;
  useEffect(() => {
    if (n < 2) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setI(Math.floor(Math.random() * n));
    const t = setInterval(() => setI((x) => (x + 1) % n), 4000);
    return () => clearInterval(t);
  }, [n]);
  if (n === 0) return null;
  return (
    <span className={cn("relative shrink-0 overflow-hidden rounded-md border border-border bg-muted", big ? "h-24 w-24" : "h-14 w-14")} aria-hidden>
      {images.map((src, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" loading="lazy" className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-700", k === i ? "opacity-100" : "opacity-0")} />
      ))}
    </span>
  );
}

function ProjectList({ projects, big, empty, onOpen, onView }: { projects: CoordProject[]; big: boolean; empty: string; onOpen?: (p: CoordProject) => void; onView?: (p: CoordProject) => void }) {
  if (projects.length === 0) return <p className={cn("text-muted-foreground", big ? "text-lg" : "text-sm")}>{empty}</p>;
  return (
    <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {projects.map((p) => (
        <li key={p.id} className="flex items-stretch overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/40">
          <button type="button" onClick={() => onOpen?.(p)} title="Ver la plantilla del proyecto" className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40">
            <RotatingImage images={p.images} big={big} />
            <div className="min-w-0 flex-1">
              <p className={cn("font-medium leading-snug", big ? "text-lg" : "text-sm")}>{p.title}</p>
              <p className={cn("mt-0.5 text-muted-foreground", big ? "text-sm" : "text-xs")}>
                {p.category}
                {p.assignee ? ` · ${p.assignee}` : ""}
                {p.total > 0 ? ` · ${p.done} de ${p.total} subtareas` : ""}
              </p>
            </div>
            <StatusChip status={p.status} />
          </button>
          <button type="button" onClick={() => onView?.(p)} title="Ir al proyecto" aria-label={`Ir al proyecto ${p.title}`} className={cn("flex shrink-0 items-center gap-1.5 border-l border-border px-3 font-medium text-primary transition-colors hover:bg-muted/40", big ? "text-sm" : "text-xs")}>
            <ExternalLink className={big ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden />
            <span className="hidden sm:inline">Ver proyecto</span>
          </button>
        </li>
      ))}
    </ul>
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
                <button type="button" aria-label="Quitar el bloqueo" disabled={pending} onClick={() => start(async () => void (await deleteBlocker(b.id)))} className="rounded p-1 text-muted-foreground hover:bg-muted">
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

/** Imágenes y GIFs de plantillas, acomodados según su diseño. */
export function DesignImages({ images, big }: { images: DesignImage[]; big: boolean }) {
  if (images.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-4">
      {images.map((img, i) => (
        <figure key={`${img.templateId}-${i}`} className={cn("flex flex-col gap-1", img.layout === "ancho" ? "w-full" : "w-full md:w-[calc(50%-0.5rem)]", img.layout === "derecha" && "md:ml-auto")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/plantillas-imagen/${img.templateId}`} alt={img.caption || "Imagen de plantilla"} className={cn("w-full rounded-lg border border-border object-contain", big ? "max-h-[32rem]" : "max-h-96")} />
          {img.caption && <figcaption className={cn("text-muted-foreground", big ? "text-base" : "text-xs")}>{img.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

/** Colores de la paleta única de UIFCITO (manual de identidad, sección 06): la portada se pinta con ellos y la mascota NO se recolorea. */
const UIFCITO = { crema: "#EAE9CB", grisAzulado: "#5D6289", cian: "#44D4FF", gris: "#5B5B5B", oscuro: "#2D2D2D" } as const;
const CARD_ACCENTS = [UIFCITO.cian, UIFCITO.grisAzulado, UIFCITO.gris] as const;

function CoverPerson({ m, i, big, master }: { m: TeamMember; i: number; big: boolean; master?: boolean }) {
  const accent = master ? UIFCITO.cian : CARD_ACCENTS[(i + 1) % CARD_ACCENTS.length];
  return (
    <li className="flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.65)", borderLeft: `6px solid ${accent}`, color: UIFCITO.oscuro }}>
      {m.photoUrl && m.photoUrl.trim() ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolvePhoto(m.photoUrl.trim())} alt={m.name} className={cn("shrink-0 rounded-full object-cover", big ? "h-20 w-20" : "h-14 w-14")} style={{ border: `3px solid ${accent}` }} />
      ) : (
        <span className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", big ? "h-20 w-20 text-xl" : "h-14 w-14 text-base")} style={{ background: accent === UIFCITO.cian ? UIFCITO.grisAzulado : accent }}>
          {initials(m.name)}
        </span>
      )}
      <div className="min-w-0">
        <p className={cn("truncate font-semibold", big ? "text-xl" : "text-sm")}>{m.name}</p>
        <p className={cn("truncate", big ? "text-base" : "text-xs")} style={{ color: UIFCITO.grisAzulado }}>
          {master ? "Máster a cargo" : m.roleLabel}
        </p>
      </div>
    </li>
  );
}

/** Portada: UIFCITO en grande, el nombre de la reunión y los integrantes del área, con la paleta de UIFCITO. */
function Cover({ team, title, note, big }: { team: CoordTeam; title: string; note: string; big: boolean }) {
  const people = [...(team.master ? [{ m: team.master, master: true }] : []), ...team.members.map((m) => ({ m, master: false }))];
  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: UIFCITO.crema, color: UIFCITO.oscuro }}>
      <div className="flex flex-col items-center gap-6 p-6 md:flex-row md:p-8">
        <div className="flex shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(68,212,255,0.28)", padding: big ? "2rem" : "1.25rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uifcito-saludo.png" alt="UIFCITO, la mascota de la UIFCE" className={cn("w-auto", big ? "h-96" : "h-60 md:h-72")} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 text-center md:text-left">
          <p className={cn("font-semibold uppercase tracking-widest", big ? "text-base" : "text-xs")} style={{ color: UIFCITO.grisAzulado }}>
            UIFCE · Estrategias Tecnológicas
          </p>
          <h2 className={cn("font-bold leading-tight tracking-tight", big ? "text-6xl" : "text-4xl")}>{title}</h2>
          <span className="mx-auto h-1.5 w-24 rounded-full md:mx-0" style={{ background: UIFCITO.cian }} />
          {note && <p className={cn("whitespace-pre-wrap", big ? "text-2xl" : "text-base")} style={{ color: UIFCITO.gris }}>{note}</p>}
        </div>
      </div>
      {people.length > 0 && (
        <div className="p-6 pt-0 md:p-8 md:pt-0">
          <p className={cn("mb-3 font-semibold uppercase tracking-wide", big ? "text-base" : "text-xs")} style={{ color: UIFCITO.grisAzulado }}>
            El equipo del área
          </p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map(({ m, master }, i) => (
              <CoverPerson key={m.id} m={m} i={i} big={big} master={master} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Iconografía de las cuatro partes (también en las pestañas y en el título de cada página). */
export const SLIDE_ICON: Partial<Record<SlideKey, LucideIcon>> = { entregamos: PackageCheck, bloqueos: OctagonAlert, corte: Flag, notas: MessageSquareText };

/** Colores del gráfico de círculo: azules de la marca y tonos de apoyo; lo que no cabe en 6 categorías se agrupa en «Otras». */
const DONUT_COLORS = ["#000066", "#1D1DA5", "#6666FF", "#44D4FF", "#5D6289", "#9A9AC8", "#C9C9DD"] as const;
const MAX_SLICES = 6;

/** Gráfico de círculo (dona) hecho a mano en SVG: una porción por categoría y el total al centro. */
function Donut({ slices, total, size }: { slices: { label: string; value: number; color: string }[]; total: number; size: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`Proyectos por categoría: ${slices.map((s) => `${s.label} ${s.value}`).join(", ")}`} className="shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="16" />
      {slices.map((s) => {
        const len = (s.value / total) * c;
        const el = <circle key={s.label} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="16" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} transform="rotate(-90 50 50)" />;
        acc += len;
        return el;
      })}
      <text x="50" y="53" textAnchor="middle" fontSize="20" fontWeight="600" fill="hsl(var(--foreground))">
        {total}
      </text>
      <text x="50" y="65" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">
        proyectos
      </text>
    </svg>
  );
}

function Overview({ data, big, onGo }: { data: CoordData; big: boolean; onGo: (k: SlideKey) => void }) {
  // Todos los proyectos de la reunión, sin repetir los que están en más de una parte.
  const all = Array.from(new Map([...data.delivered, ...data.inProgress, ...data.upcoming].map((p) => [p.id, p])).values());
  const byCat = new Map<string, number>();
  for (const p of all) byCat.set(p.category, (byCat.get(p.category) ?? 0) + 1);
  const sorted = Array.from(byCat.entries()).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], "es"));
  const head = sorted.slice(0, MAX_SLICES);
  const rest = sorted.slice(MAX_SLICES).reduce((n, [, v]) => n + v, 0);
  const slices = [...head.map(([label, value]) => ({ label, value })), ...(rest > 0 ? [{ label: "Otras", value: rest }] : [])].map((s, i) => ({ ...s, color: DONUT_COLORS[i % DONUT_COLORS.length] }));

  const count = (list: CoordProject[], st: string) => list.filter((p) => p.status === st).length;
  const noteLines = data.design.notas.note.split("\n").filter((l) => l.trim()).length;
  const cards: { key: SlideKey; n: string; unit: string; sub: string }[] = [
    {
      key: "entregamos",
      n: String(data.delivered.length),
      unit: "proyectos",
      sub: `${count(data.delivered, "COMPLETADO")} entregados · ${count(data.delivered, "EN_CURSO")} en curso · ${count(data.delivered, "POR_INICIAR")} por iniciar`,
    },
    { key: "bloqueos", n: data.blockers ? String(data.blockers.length) : "—", unit: "bloqueos", sub: `${data.inProgress.length} proyectos en curso` },
    {
      key: "corte",
      n: String(data.upcoming.length),
      unit: "proyectos en proceso",
      sub: `${count(data.upcoming, "EN_CURSO")} en curso · ${count(data.upcoming, "POR_INICIAR")} por iniciar`,
    },
    { key: "notas", n: String(noteLines), unit: noteLines === 1 ? "nota" : "notas", sub: `${data.design.notas.images.length} ${data.design.notas.images.length === 1 ? "imagen" : "imágenes"}` },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card p-5 md:flex-row">
        {all.length > 0 ? (
          <>
            <Donut slices={slices} total={all.length} size={big ? 260 : 180} />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <p className={cn("font-medium uppercase tracking-wide text-muted-foreground", big ? "text-sm" : "text-xs")}>Proyectos por categoría</p>
              <ul className={cn("grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2", big ? "text-lg" : "text-sm")}>
                {slices.map((s) => (
                  <li key={s.label} className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{s.label}</span>
                    <span className="font-semibold tabular-nums">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no hay proyectos en la reunión.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cards.map((c) => {
          const Icon = SLIDE_ICON[c.key];
          return (
            <button key={c.key} type="button" onClick={() => onGo(c.key)} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40">
              <span className="flex items-center gap-3">
                {Icon && (
                  <span className={cn("flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary", big ? "h-12 w-12" : "h-9 w-9")}>
                    <Icon className={big ? "h-7 w-7" : "h-5 w-5"} aria-hidden />
                  </span>
                )}
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className={cn("font-semibold text-primary", big ? "text-base" : "text-xs")}>{SLIDE_NUMBER[c.key]}</span>
                  <span className={cn("truncate font-semibold", big ? "text-2xl" : "text-base")}>{data.design[c.key].title || SLIDE_LABEL[c.key]}</span>
                </span>
              </span>
              <span className="flex items-baseline gap-2">
                <span className={cn("font-semibold leading-none tracking-tight tabular-nums", big ? "text-7xl" : "text-5xl")}>{c.n}</span>
                <span className={cn("text-muted-foreground", big ? "text-xl" : "text-sm")}>{c.unit}</span>
              </span>
              <span className={cn("text-muted-foreground", big ? "text-base" : "text-xs")}>{c.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Una página: título (propio o el de la parte), nota de diseño, contenido de la parte e imágenes. */
export function Slide({ slide, data, team, big, canEditBlockers, onGo, onOpenProject, onViewProject }: { slide: SlideKey; data: CoordData; team: CoordTeam; big: boolean; canEditBlockers: boolean; onGo: (k: SlideKey) => void; onOpenProject: (p: CoordProject) => void; onViewProject: (p: CoordProject) => void }) {
  const design: PageDesign = data.design[slide];
  const title = design.title || (slide === "general" ? "Resumen de la reunión" : slide === "portada" ? "Reunión de coordinación" : SLIDE_LABEL[slide]);
  const inProgress = data.inProgress;

  return (
    <section className="flex flex-col gap-5">
      {slide === "portada" && <Cover team={team} title={title} note={design.note} big={big} />}
      {slide !== "portada" && (
      <div className="flex items-baseline gap-3 border-b border-border pb-2">
        {SLIDE_ICON[slide] && (() => { const Icon = SLIDE_ICON[slide]!; return <Icon className={cn("self-center text-primary", big ? "h-9 w-9" : "h-6 w-6")} aria-hidden />; })()}
        {SLIDE_NUMBER[slide] && <span className={cn("font-semibold text-primary", big ? "text-lg" : "text-sm")}>{SLIDE_NUMBER[slide]}</span>}
        <h2 className={cn("font-semibold tracking-tight", big ? "text-4xl" : "text-2xl")}>{title}</h2>
      </div>
      )}

      {slide !== "notas" && slide !== "portada" && design.note && <p className={cn("whitespace-pre-wrap text-muted-foreground", big ? "text-xl" : "text-sm")}>{design.note}</p>}

      {slide === "general" && <Overview data={data} big={big} onGo={onGo} />}
      {slide === "entregamos" && <ProjectList projects={data.delivered} big={big} empty="Sin proyectos para mostrar." onOpen={onOpenProject} onView={onViewProject} />}
      {slide === "bloqueos" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className={cn("font-medium uppercase tracking-wide text-muted-foreground", big ? "text-sm" : "text-xs")}>En curso</p>
            <ProjectList projects={inProgress} big={big} empty="Nada en curso entre los proyectos presentados." onOpen={onOpenProject} onView={onViewProject} />
          </div>
          <Blockers blockers={data.blockers} big={big} editable={canEditBlockers} />
        </div>
      )}
      {slide === "corte" && <ProjectList projects={data.upcoming} big={big} empty="No hay otros proyectos en atención inmediata." onOpen={onOpenProject} onView={onViewProject} />}
      {slide === "notas" &&
        (design.note ? (
          <p className={cn("whitespace-pre-wrap leading-relaxed", big ? "text-2xl" : "text-base")}>{design.note}</p>
        ) : (
          <p className={cn("text-muted-foreground", big ? "text-lg" : "text-sm")}>Sin notas ni comentarios. Se agregan desde el modo diseño.</p>
        ))}

      <DesignImages images={design.images} big={big} />
    </section>
  );
}
