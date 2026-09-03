"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { ProjectCard, type ProjectCardData } from "@/components/project-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Person = { id: string; name: string; color?: string | null };

function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function ProjectsGrid({ projects, people }: { projects: ProjectCardData[]; people: Person[] }) {
  const [q, setQ] = useState("");
  const [personId, setPersonId] = useState("");

  const nq = norm(q.trim());
  const filtering = nq.length > 0 || personId.length > 0;

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesText =
        nq.length === 0 ||
        [p.title, p.category, p.priorityTag ?? "", p.description, ...p.tags].some((f) => norm(f).includes(nq));
      const matchesPerson = personId.length === 0 || p.assignees.some((a) => a.id === personId);
      return matchesText && matchesPerson;
    });
  }, [projects, nq, personId]);

  return (
    <div className="flex flex-col gap-3">
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
          value={personId}
          onChange={(e) => setPersonId(e.target.value)}
          className="w-52"
          aria-label="Filtrar por responsable"
        >
          <option value="">Cualquier responsable</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        {filtering && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setPersonId("");
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
          {filtered.length} de {projects.length} proyectos
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          Ningún proyecto coincide con la búsqueda.
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
