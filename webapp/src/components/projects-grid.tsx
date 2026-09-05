"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Search, X } from "lucide-react";

import { ProjectCard, type ProjectCardData } from "@/components/project-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PRIORITY_TAG_LABEL } from "@/lib/utils";

function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function ProjectsGrid({
  projects,
  focusPersonId,
  focusPersonName,
}: {
  projects: ProjectCardData[];
  /** Si viene (?focus=<id>), la grilla se limita a los proyectos de esa persona
   *  que están en «❗ Atención Inmediata». */
  focusPersonId?: string;
  focusPersonName?: string;
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  // Lista base: todo, o solo los pendientes de atención de la persona enfocada.
  const base = useMemo(() => {
    if (!focusPersonId) return projects;
    return projects.filter(
      (p) =>
        p.priorityTag === "ATENCION_INMEDIATA" && p.assignees.some((a) => a.id === focusPersonId),
    );
  }, [projects, focusPersonId]);

  const categories = useMemo(
    () => Array.from(new Set(base.map((p) => p.category))).sort((a, b) => a.localeCompare(b, "es")),
    [base],
  );

  const nq = norm(q.trim());
  const filtering = nq.length > 0 || category.length > 0;

  const filtered = useMemo(() => {
    return base.filter((p) => {
      const matchesText =
        nq.length === 0 ||
        [p.title, p.category, PRIORITY_TAG_LABEL[p.priorityTag ?? ""] ?? "", p.description, ...p.tags].some((f) =>
          norm(f).includes(nq),
        );
      const matchesCategory = category.length === 0 || p.category === category;
      return matchesText && matchesCategory;
    });
  }, [base, nq, category]);

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
        {filtering && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setCategory("");
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
          {filtered.length} de {base.length} proyectos
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          {focusPersonId
            ? `${focusPersonName ?? "Esta persona"} no tiene proyectos en «❗ Atención Inmediata».`
            : "Ningún proyecto coincide con la búsqueda."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
