"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, LayoutGrid, List, Search, UserCheck, X } from "lucide-react";

import { ProjectCard, ProjectList, type ProjectCardData } from "@/components/project-card";
import { CollapseToggle, useCollapse } from "@/components/collapsible";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { setPersonFilter, usePersonFilter } from "@/lib/person-filter";
import { byUrgency } from "@/lib/project-order";
import { cn, PRIORITY_TAG_LABEL } from "@/lib/utils";

function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

type ViewMode = "grid" | "list";
const VIEW_STORAGE_KEY = "et:proyectos:vista";

/** Lista (por defecto) o cuadrícula; la elección se recuerda en este navegador. */
function useViewMode(): [ViewMode, (v: ViewMode) => void] {
  const [view, setView] = useState<ViewMode>("list");
  useEffect(() => {
    try {
      if (window.localStorage.getItem(VIEW_STORAGE_KEY) === "grid") setView("grid");
    } catch {
      // Sin almacenamiento: queda la lista.
    }
  }, []);
  function choose(v: ViewMode) {
    setView(v);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, v);
    } catch {
      // No se pudo recordar; el cambio sigue valiendo en esta visita.
    }
  }
  return [view, choose];
}

const GRID_CLASS = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3";

export function ProjectsGrid({
  projects,
  focusPersonId,
  focusPersonName,
  mineId,
  profileKey,
}: {
  projects: ProjectCardData[];
  /** Perfil Junior con sesión: sus proyectos abiertos (responsable o con subtareas) van primero,
   *  en una sección «Asignados a ti», con la tarjeta resaltada. Los completados no se cuentan ahí. */
  mineId?: string | null;
  /** Clave de la persona en sesión (para marcar «novedades» en sus proyectos asignados). */
  profileKey?: string | null;
  /** Si viene (?focus=<id>), la grilla se limita a los proyectos de esa persona
   *  que están en «❗ Atención Inmediata». */
  focusPersonId?: string;
  focusPersonName?: string;
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sortMode, setSortMode] = useState<"urgency" | "plan">("urgency");
  const [view, setView] = useViewMode();
  // En la vista de un Junior, «Otros proyectos» arranca contraído para que vea primero lo suyo.
  const others = useCollapse("home:otros", !mineId);
  // Filtro rápido por persona, activado desde «Integrantes» (clic en el nombre).
  const person = usePersonFilter();

  // Lista base: todo, o solo los pendientes de atención de la persona enfocada.
  const base = useMemo(() => {
    if (!focusPersonId) return projects;
    return projects.filter(
      (p) =>
        p.priorityTag === "ATENCION_INMEDIATA" &&
        p.status !== "COMPLETADO" &&
        (p.assignee?.id === focusPersonId || p.assignees.some((a) => a.id === focusPersonId)),
    );
  }, [projects, focusPersonId]);

  // Orden automático: por urgencia (por defecto) u orden de planeación.
  const ordered = useMemo(() => {
    const arr = [...base];
    arr.sort(sortMode === "plan" ? (a, b) => a.sortIndex - b.sortIndex : byUrgency);
    return arr;
  }, [base, sortMode]);

  const categories = useMemo(
    () => Array.from(new Set(ordered.map((p) => p.category))).sort((a, b) => a.localeCompare(b, "es")),
    [ordered],
  );

  const nq = norm(q.trim());
  const filtering = nq.length > 0 || category.length > 0 || person !== null;

  const filtered = useMemo(() => {
    return ordered.filter((p) => {
      // «Asignado a»: responsable del proyecto o alguien con subtareas en él.
      const matchesPerson =
        !person || p.assignee?.id === person.id || p.assignees.some((a) => a.id === person.id);
      if (!matchesPerson) return false;
      const matchesText =
        nq.length === 0 ||
        [p.title, p.category, PRIORITY_TAG_LABEL[p.priorityTag ?? ""] ?? "", p.description, ...p.tags].some((f) =>
          norm(f).includes(nq),
        );
      const matchesCategory = category.length === 0 || p.category === category;
      return matchesText && matchesCategory;
    });
  }, [ordered, nq, category, person]);

  // «Asignados a ti»: solo los abiertos. Un proyecto completado deja de ser ruido en esa sección y
  // pasa a «Otros proyectos» (sin el resalte de «asignado»).
  const isMine = (p: ProjectCardData) =>
    !!mineId && p.status !== "COMPLETADO" && (p.assignee?.id === mineId || p.assignees.some((a) => a.id === mineId));
  const mineList = mineId ? filtered.filter(isMine) : [];
  const restList = mineId ? filtered.filter((p) => !isMine(p)) : filtered;
  // Si hay búsqueda o filtro, «Otros proyectos» se abre solo: lo que se busca no debe quedar oculto.
  const othersOpen = others.open || filtering;

  function renderItems(items: ProjectCardData[], mine: boolean) {
    return view === "list" ? (
      <ProjectList projects={items} mine={mine} profileKey={profileKey} />
    ) : (
      <div className={GRID_CLASS}>
        {items.map((project) => (
          <ProjectCard key={project.id} project={project} mine={mine} profileKey={profileKey} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {focusPersonId && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-primary">
            <AlertTriangle className="h-3.5 w-3.5" />
            Pendientes de atención de {focusPersonName ?? "esta persona"} ({base.length})
          </span>
          <Link href="/#proyectos" className="text-muted-foreground underline hover:text-foreground">
            Ver todos los proyectos
          </Link>
        </div>
      )}

      {person && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-primary">
            <Search className="h-3.5 w-3.5" />
            Proyectos de {person.name} ({filtered.length})
          </span>
          <button
            type="button"
            onClick={() => setPersonFilter(null)}
            className="inline-flex items-center gap-1 text-muted-foreground underline hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Quitar filtro
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[13rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, categoría o descripción…"
            className="pl-8"
            aria-label="Buscar proyecto"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-56"
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as "urgency" | "plan")}
          className="w-52"
          aria-label="Ordenar proyectos"
        >
          <option value="urgency">Orden: por urgencia</option>
          <option value="plan">Orden: de planeación</option>
        </Select>
        <div role="group" aria-label="Presentación de los proyectos" className="inline-flex overflow-hidden rounded-md border border-input">
          {(
            [
              { id: "grid", label: "Cuadrícula", icon: LayoutGrid },
              { id: "list", label: "Lista", icon: List },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-pressed={view === id}
              aria-label={`Ver en ${label.toLowerCase()}`}
              title={`Ver en ${label.toLowerCase()}`}
              className={cn(
                "press inline-flex h-10 w-10 items-center justify-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                view === id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </button>
          ))}
        </div>
        {filtering && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setCategory("");
              setPersonFilter(null);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {filtering && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} de {ordered.length} proyectos
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          {focusPersonId
            ? `${focusPersonName ?? "Esta persona"} no tiene proyectos en «❗ Atención Inmediata».`
            : person && nq.length === 0 && category.length === 0
              ? `${person.name} no tiene proyectos asignados en este semestre.`
              : "Ningún proyecto coincide con la búsqueda."}
        </p>
      ) : mineId ? (
        <div className="flex flex-col gap-6">
          <section id="asignados" aria-label="Proyectos asignados a ti" className="flex scroll-mt-20 flex-col gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
              <UserCheck className="h-4 w-4" aria-hidden />
              Asignados a ti ({mineList.length})
            </h3>
            {mineList.length > 0 ? (
              renderItems(mineList, true)
            ) : (
              <p className="rounded-md border border-dashed border-input p-4 text-sm text-muted-foreground">
                {filtering
                  ? "Ninguno de tus proyectos abiertos coincide con la búsqueda."
                  : "No tienes proyectos abiertos asignados. Cuando te asignen uno aparecerá aquí."}
              </p>
            )}
          </section>
          {restList.length > 0 && (
            <section aria-label="Otros proyectos" className="flex flex-col gap-3">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <CollapseToggle open={othersOpen} onToggle={others.toggle} label="los otros proyectos" />
                <button type="button" onClick={others.toggle} className="text-left hover:text-foreground">
                  Otros proyectos ({restList.length})
                </button>
                {!othersOpen && <span className="text-xs font-normal">· ocultos; incluyen los completados</span>}
              </h3>
              {othersOpen && renderItems(restList, false)}
            </section>
          )}
        </div>
      ) : (
        renderItems(filtered, false)
      )}
    </div>
  );
}
