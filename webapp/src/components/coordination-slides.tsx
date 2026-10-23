"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";

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

function ProjectList({ projects, big, empty, onOpen }: { projects: CoordProject[]; big: boolean; empty: string; onOpen?: (p: CoordProject) => void }) {
  if (projects.length === 0) return <p className={cn("text-muted-foreground", big ? "text-lg" : "text-sm")}>{empty}</p>;
  return (
    <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {projects.map((p) => (
        <li key={p.id}>
          <button type="button" onClick={() => onOpen?.(p)} title="Abrir el proyecto (queda un botón para volver a la reunión durante 30 segundos)" className="flex w-full items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40">
          <div className="min-w-0">
            <p className={cn("font-medium leading-snug", big ? "text-lg" : "text-sm")}>{p.title}</p>
            <p className={cn("mt-0.5 text-muted-foreground", big ? "text-sm" : "text-xs")}>
              {p.category}
              {p.assignee ? ` · ${p.assignee}` : ""}
              {p.total > 0 ? ` · ${p.done} de ${p.total} subtareas` : ""}
            </p>
          </div>
          <StatusChip status={p.status} />
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

function Overview({ data, big, onGo }: { data: CoordData; big: boolean; onGo: (k: SlideKey) => void }) {
  const inProgress = data.delivered.filter((p) => p.status === "EN_CURSO");
  const doneCount = data.delivered.filter((p) => p.status === "COMPLETADO").length;
  const cards: { key: SlideKey; stat: string; items: string[] }[] = [
    { key: "entregamos", stat: `${data.delivered.length} proyectos · ${doneCount} entregados`, items: data.delivered.map((p) => p.title) },
    { key: "bloqueos", stat: `${inProgress.length} en curso · ${data.blockers?.length ?? 0} bloqueos`, items: (data.blockers ?? []).map((b) => b.text) },
    { key: "corte", stat: `${data.upcoming.length} en atención inmediata`, items: data.upcoming.map((p) => p.title) },
    { key: "notas", stat: data.design.notas.note ? "Con notas" : "Sin notas", items: data.design.notas.note ? [data.design.notas.note] : [] },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {cards.map((c) => (
        <button key={c.key} type="button" onClick={() => onGo(c.key)} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40">
          <span className="flex items-baseline gap-2">
            <span className={cn("font-semibold text-primary", big ? "text-base" : "text-xs")}>{SLIDE_NUMBER[c.key]}</span>
            <span className={cn("font-semibold", big ? "text-2xl" : "text-base")}>{data.design[c.key].title || SLIDE_LABEL[c.key]}</span>
          </span>
          <span className={cn("text-muted-foreground", big ? "text-base" : "text-xs")}>{c.stat}</span>
          {c.items.length > 0 && (
            <ul className={cn("flex flex-col gap-0.5", big ? "text-base" : "text-sm")}>
              {c.items.slice(0, 3).map((t) => (
                <li key={t} className="line-clamp-1">
                  · {t}
                </li>
              ))}
              {c.items.length > 3 && <li className="text-muted-foreground">y {c.items.length - 3} más</li>}
            </ul>
          )}
        </button>
      ))}
    </div>
  );
}

/** Una página: título (propio o el de la parte), nota de diseño, contenido de la parte e imágenes. */
export function Slide({ slide, data, team, big, canEditBlockers, onGo, onOpenProject }: { slide: SlideKey; data: CoordData; team: CoordTeam; big: boolean; canEditBlockers: boolean; onGo: (k: SlideKey) => void; onOpenProject: (p: CoordProject) => void }) {
  const design: PageDesign = data.design[slide];
  const title = design.title || (slide === "general" ? "Resumen de la reunión" : slide === "portada" ? "Reunión de coordinación" : SLIDE_LABEL[slide]);
  const inProgress = data.delivered.filter((p) => p.status === "EN_CURSO");

  return (
    <section className="flex flex-col gap-5">
      {slide === "portada" && <Cover team={team} title={title} note={design.note} big={big} />}
      {slide !== "portada" && (
      <div className="flex items-baseline gap-3 border-b border-border pb-2">
        {SLIDE_NUMBER[slide] && <span className={cn("font-semibold text-primary", big ? "text-lg" : "text-sm")}>{SLIDE_NUMBER[slide]}</span>}
        <h2 className={cn("font-semibold tracking-tight", big ? "text-4xl" : "text-2xl")}>{title}</h2>
      </div>
      )}

      {slide !== "notas" && slide !== "portada" && design.note && <p className={cn("whitespace-pre-wrap text-muted-foreground", big ? "text-xl" : "text-sm")}>{design.note}</p>}

      {slide === "general" && <Overview data={data} big={big} onGo={onGo} />}
      {slide === "entregamos" && <ProjectList projects={data.delivered} big={big} empty="Sin proyectos para mostrar." onOpen={onOpenProject} />}
      {slide === "bloqueos" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className={cn("font-medium uppercase tracking-wide text-muted-foreground", big ? "text-sm" : "text-xs")}>En curso</p>
            <ProjectList projects={inProgress} big={big} empty="Nada en curso entre los proyectos presentados." onOpen={onOpenProject} />
          </div>
          <Blockers blockers={data.blockers} big={big} editable={canEditBlockers} />
        </div>
      )}
      {slide === "corte" && <ProjectList projects={data.upcoming} big={big} empty="No hay otros proyectos en atención inmediata." onOpen={onOpenProject} />}
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
