/** Tracker de egresados: antiguos monitores de la UIFCE a los que se les sigue la pista (dónde trabajan hoy, su carrera de
 *  graduación y el estado del contacto). Sin secretos ni acceso a la BD: lo importan componentes de cliente y acciones. */
import { guessNameFromProfileUrl, normalizeProfileUrl } from "@/lib/company-leads";

/** Proyecto de ET que lleva el tracker de egresados. */
export const ALUMNI_PROJECT_ID = "estrategicos-tracker-egresados-uifce";

export const ALUMNI_STATUSES = [
  { id: "POR_RASTREAR", label: "Por rastrear" },
  { id: "VERIFICADO", label: "Situación verificada" },
  { id: "CONTACTADO", label: "Contactado" },
  { id: "CONECTADO", label: "Conectado" },
  { id: "SIN_RESPUESTA", label: "Sin respuesta" },
] as const;
export type AlumniStatus = (typeof ALUMNI_STATUSES)[number]["id"];

export const ALUMNI_STATUS_LABEL: Record<string, string> = Object.fromEntries(ALUMNI_STATUSES.map((s) => [s.id, s.label]));

export function normalizeAlumniStatus(raw: unknown): AlumniStatus {
  return ALUMNI_STATUSES.some((s) => s.id === raw) ? (raw as AlumniStatus) : "POR_RASTREAR";
}

/** Semestres que se pueden elegir al registrar un egresado, del más reciente al más antiguo: de 2026-2 hasta 2022-1. */
export const ALUMNI_COHORTS: string[] = (() => {
  const out: string[] = [];
  for (let year = 2026; year >= 2022; year--) {
    for (const half of [2, 1]) out.push(`${year}-${half}`);
  }
  return out;
})();

/** Carreras de la Facultad que se eligen primero. */
export const DEGREES_MAIN = ["Economía", "Administración de Empresas", "Contaduría Pública"];
/** Otras carreras de las que han salido monitores (se despliegan bajo «Otras carreras»). Cualquier otra se escribe con «Otro». */
export const DEGREES_OTHER = ["Farmacia", "Diseño Industrial", "Diseño Gráfico", "Estadística", "Geología", "Ingeniería de Sistemas"];

/** Avance del tracker: cuántos egresados ya tienen su situación actual verificada (cualquier estado distinto de «por
 *  rastrear» lo implica) y cuántos ya fueron contactados. */
export function alumniProgress(statuses: string[]) {
  const total = statuses.length;
  const verified = statuses.filter((s) => s !== "POR_RASTREAR").length;
  const contacted = statuses.filter((s) => s === "CONTACTADO" || s === "CONECTADO" || s === "SIN_RESPUESTA").length;
  return { total, verified, contacted, percent: total > 0 ? Math.round((verified / total) * 100) : 0 };
}

/** Búsqueda en LinkedIn del perfil de una persona por su nombre y la Universidad Nacional (para «indagar» dónde está hoy). */
export function alumniSearchUrl(name: string): string {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${name}" "Universidad Nacional de Colombia"`)}`;
}

/** Quita tildes y pasa a minúsculas para comparar nombres. */
export function foldName(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, " ").trim().toLowerCase();
}

/** Nombre de la carrera tal como se muestra: si lo escrito coincide con una carrera conocida (sin importar tildes,
 *  mayúsculas o si falta «Pública» o «de Empresas»), se usa su nombre completo; si no, se deja como se escribió. */
export function canonicalDegree(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  const f = foldName(v);
  const all = [...DEGREES_MAIN, ...DEGREES_OTHER];
  const exact = all.find((d) => foldName(d) === f);
  if (exact) return exact;
  if (/^ing\.?\s+(de\s+)?sistemas/.test(f) || /^ingenieria de sistemas/.test(f)) return "Ingeniería de Sistemas";
  const prefix = f.length >= 5 ? all.find((d) => foldName(d).startsWith(f)) : undefined;
  return prefix ?? v.slice(0, 160);
}

export type AlumniRow = {
  name: string;
  degree: string | null;
  company: string | null;
  role: string | null;
  linkedinUrl: string | null;
};

/** Lee lo que se pega para agregar egresados: un nombre por línea, o filas copiadas de una hoja de cálculo (las celdas
 *  llegan separadas por tabulación, en este orden: Nombre, Carrera, Empresa, Cargo; cualquier celda con un enlace de
 *  LinkedIn se toma como su perfil). Una línea que es solo un enlace usa el nombre sugerido por el enlace. La primera
 *  fila se ignora si es un encabezado («Nombre…»). */
export function parseAlumniRows(text: string): { rows: AlumniRow[]; problems: string[] } {
  const rows: AlumniRow[] = [];
  const problems: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  lines.forEach((line, i) => {
    const cells = line.split("\t").map((c) => c.trim());
    if (i === 0 && cells.length > 1 && /^(nombres?|name)\b/i.test(cells[0])) return;

    let linkedinUrl: string | null = null;
    const rest: string[] = [];
    for (const cell of cells) {
      const m = cell.match(/\S*linkedin\.\S*/i);
      if (m) {
        const r = normalizeProfileUrl(m[0]);
        if ("url" in r) linkedinUrl = linkedinUrl ?? r.url;
        else problems.push(`Línea ${i + 1}: ${r.error}`);
        const remaining = cell.replace(m[0], "").trim();
        if (remaining) rest.push(remaining);
      } else {
        rest.push(cell);
      }
    }
    let [name = "", degree = "", company = "", role = ""] = rest;
    if (!name && linkedinUrl) name = guessNameFromProfileUrl(linkedinUrl);
    if (!name) {
      problems.push(`Línea ${i + 1}: no encontré el nombre`);
      return;
    }
    rows.push({ name: name.slice(0, 120), degree: canonicalDegree(degree), company: company || null, role: role || null, linkedinUrl });
  });
  return { rows: rows.slice(0, 300), problems };
}

/** Une dos listas de semestres escritas como «2025-2, 2024-2» sin repetir. */
export function mergeCohorts(current: string | null, extra: string | null): string | null {
  const parts = [...(current ?? "").split(","), ...(extra ?? "").split(",")].map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) if (!out.includes(p)) out.push(p);
  return out.length > 0 ? out.join(", ") : null;
}
