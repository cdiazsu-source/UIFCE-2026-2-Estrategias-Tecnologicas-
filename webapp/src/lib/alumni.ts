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

/** Semestres de los directorios UIFCE de los que se parte (sugerencias para el campo «semestre»). */
export const ALUMNI_COHORT_SUGGESTIONS = ["2025-2", "2025-1", "2024-2"];

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
    rows.push({ name: name.slice(0, 120), degree: degree || null, company: company || null, role: role || null, linkedinUrl });
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
