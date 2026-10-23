import { itemsFor } from "@/lib/sidebar-nav";

/** Buscador global (barra superior): tipos compartidos y búsqueda de módulos. Lo demás se consulta en `app/api/buscar/route.ts`. */

export type SearchGroup = "modulos" | "proyectos" | "subtareas" | "notas" | "estudio" | "empresas" | "plantillas" | "herramientas";

export const SEARCH_GROUP_LABEL: Record<SearchGroup, string> = {
  modulos: "Módulos",
  proyectos: "Proyectos",
  subtareas: "Subtareas",
  notas: "Bitácora",
  estudio: "Proyectos de estudio",
  empresas: "Empresas de interés",
  plantillas: "Plantillas",
  herramientas: "Herramientas",
};

export type SearchHit = {
  id: string;
  group: SearchGroup;
  title: string;
  /** Línea de apoyo: el fragmento donde apareció la palabra, o el contexto (proyecto, categoría…). */
  detail: string | null;
  href: string;
};

export const SEARCH_MIN_CHARS = 2;
export const SEARCH_PER_GROUP = 5;

/** Minúsculas y sin tildes, para comparar «planeacion» con «Planeación». */
export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Palabras de la búsqueda (2 o más letras, sin repetir). */
export function searchTerms(q: string): string[] {
  return Array.from(new Set(q.trim().split(/\s+/).filter((t) => t.length >= SEARCH_MIN_CHARS))).slice(0, 5);
}

/** Fragmento del texto alrededor de la primera palabra encontrada. */
export function snippet(text: string, terms: string[], width = 110): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const f = fold(flat);
  const at = terms.map((t) => f.indexOf(fold(t))).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, at - 30);
  const out = flat.slice(start, start + width);
  return `${start > 0 ? "…" : ""}${out}${start + width < flat.length ? "…" : ""}`;
}

/** Pantallas que no están en el menú lateral pero sí se buscan por nombre. */
const EXTRA_MODULES: { id: string; label: string; href: string; words: string; developer?: boolean }[] = [
  { id: "estudio", label: "Proyectos de estudio", href: "/proyectos-de-estudio", words: "estudio corte cortes entregables" },
  { id: "linkedin", label: "LinkedIn: tracker y plantilla de perfil", href: "/linkedin", words: "perfil linkedin red profesional" },
  { id: "desarrollador", label: "Desarrollador", href: "/desarrollador", words: "prompt versiones modificacion ia claude", developer: true },
];

/** Módulos que coinciden con todas las palabras (por nombre o palabras clave), según lo que ve el perfil. */
export function searchModules(terms: string[], opts: { isJunior: boolean; canUseDeveloper: boolean }): SearchHit[] {
  const pool = [
    ...itemsFor(opts.isJunior, opts.canUseDeveloper).map((i) => ({ id: i.id, label: i.label, href: i.href, words: i.section ?? "", detail: i.section ?? null })),
    ...EXTRA_MODULES.filter((m) => !m.developer || opts.canUseDeveloper).map((m) => ({ ...m, detail: null as string | null })),
  ];
  const wanted = terms.map(fold);
  return pool
    .filter((m) => {
      const hay = fold(`${m.label} ${m.words}`);
      return wanted.every((t) => hay.includes(t));
    })
    .slice(0, SEARCH_PER_GROUP)
    .map((m) => ({ id: `mod-${m.id}`, group: "modulos" as const, title: m.label, detail: m.detail, href: m.href }));
}
