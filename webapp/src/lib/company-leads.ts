/** Empresas de interés y sus contactos (reclutadores, gerentes, recursos humanos…). Sin secretos ni
 *  acceso a la BD: lo importan componentes de cliente y acciones del servidor. */

/** Proyecto de ET que lleva el rastreo de contactos en las empresas de interés. */
export const LEADS_PROJECT_ID = "redes-rastreo-contactos-empresas";
/** Meta: mínimo de personas registradas por empresa. */
export const LEADS_PER_COMPANY_GOAL = 4;

/** La meta de cada empresa son 4 casillas: 1 reclutador, 1 gerente o directivo, 1 de recursos humanos y 1 contacto
 *  libre (de cualquier tipo, además de los anteriores). */
export const GOAL_SLOTS = [
  { id: "RECLUTADOR", label: "Reclutador/a" },
  { id: "GERENTE", label: "Gerente / directivo" },
  { id: "RECURSOS_HUMANOS", label: "Recursos Humanos" },
  { id: "LIBRE", label: "Contacto libre" },
] as const;
export type GoalSlot = (typeof GOAL_SLOTS)[number]["id"];

/** Qué casillas de la meta tiene cubiertas una empresa, según los tipos de sus contactos (`kinds`). Un contacto
 *  cubre una sola casilla: la «libre» solo la cubre un contacto que sobre de las tres por tipo. Así cuatro
 *  reclutadores cubren «reclutador» y «libre» (2 de 4) pero no «gerente» ni «recursos humanos». */
export function companyCoverage(kinds: string[]) {
  const covered: Record<GoalSlot, boolean> = {
    RECLUTADOR: kinds.includes("RECLUTADOR"),
    GERENTE: kinds.includes("GERENTE"),
    RECURSOS_HUMANOS: kinds.includes("RECURSOS_HUMANOS"),
    LIBRE: false,
  };
  const typedCovered = [covered.RECLUTADOR, covered.GERENTE, covered.RECURSOS_HUMANOS].filter(Boolean).length;
  covered.LIBRE = kinds.length - typedCovered >= 1;
  const done = GOAL_SLOTS.filter((s) => covered[s.id]).length;
  return { covered, done, complete: done === GOAL_SLOTS.length, missing: GOAL_SLOTS.filter((s) => !covered[s.id]) };
}

/** Avance total frente a la meta: casillas cubiertas sobre 4 por empresa. `companies` = los tipos de contacto de
 *  cada empresa. */
export function leadsGoal(companies: string[][]) {
  const coverage = companies.map(companyCoverage);
  const total = companies.length * LEADS_PER_COMPANY_GOAL;
  const have = coverage.reduce((n, c) => n + c.done, 0);
  return {
    have,
    total,
    percent: total > 0 ? Math.round((have / total) * 100) : 0,
    companies: companies.length,
    companiesDone: coverage.filter((c) => c.complete).length,
  };
}

export const LEAD_KINDS = [
  { id: "RECLUTADOR", label: "Reclutador/a", search: "Reclutadores" },
  { id: "GERENTE", label: "Gerente / directivo", search: "Gerentes" },
  { id: "RECURSOS_HUMANOS", label: "Recursos Humanos", search: "Recursos Humanos" },
  { id: "OTRO", label: "Contacto de interés", search: "" },
] as const;
export type LeadKind = (typeof LEAD_KINDS)[number]["id"];

export const LEAD_STATUSES = [
  { id: "POR_CONTACTAR", label: "Por contactar" },
  { id: "CONEXION_ENVIADA", label: "Conexión enviada" },
  { id: "CONECTADO", label: "Conectado" },
  { id: "EN_CONVERSACION", label: "En conversación" },
  { id: "SIN_RESPUESTA", label: "Sin respuesta" },
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number]["id"];

export const LEAD_KIND_LABEL: Record<string, string> = Object.fromEntries(LEAD_KINDS.map((k) => [k.id, k.label]));
export const LEAD_STATUS_LABEL: Record<string, string> = Object.fromEntries(LEAD_STATUSES.map((s) => [s.id, s.label]));

/** Valida lo que llega de un formulario: si no es uno de los valores conocidos, usa el de reserva. */
export function normalizeKind(raw: unknown): LeadKind {
  return LEAD_KINDS.some((k) => k.id === raw) ? (raw as LeadKind) : "OTRO";
}
export function normalizeStatus(raw: unknown): LeadStatus {
  return LEAD_STATUSES.some((s) => s.id === raw) ? (raw as LeadStatus) : "POR_CONTACTAR";
}

/** Orden en que se listan los contactos de una empresa. */
export const LEAD_KIND_ORDER: string[] = LEAD_KINDS.map((k) => k.id);

/** Etiquetas desde un campo de texto separado por comas (sin repetidas, máximo 5). */
export function parseTags(raw: string): string[] {
  const out: string[] = [];
  for (const t of raw.split(",").map((x) => x.trim().slice(0, 40))) {
    if (t && !out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
  }
  return out.slice(0, 5);
}

/** Lista desde un campo de texto separado por «;» o saltos de línea (por ejemplo las especializaciones de una
 *  persona, cuyos nombres pueden llevar comas). Sin repetidas, máximo 6. */
export function parseList(raw: string): string[] {
  const out: string[] = [];
  for (const t of raw.split(/[;\n]/).map((x) => x.trim().slice(0, 140))) {
    if (t && !out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
  }
  return out.slice(0, 6);
}

/** Enlace a la página de LinkedIn de una empresa: solo se acepta una dirección http(s) de linkedin.com;
 *  cualquier otra cosa (o vacío) → null. Acepta «linkedin.com/company/…» sin esquema. */
export function normalizeLinkedinUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (u.hostname !== "linkedin.com" && !u.hostname.endsWith(".linkedin.com")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Búsqueda de la página oficial de la empresa en LinkedIn (para encontrarla y pegar su enlace). */
export function linkedinCompanySearchUrl(company: string): string {
  const short = company.replace(/\s*\(.*?\)\s*/g, " ").trim();
  return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(`${short} Colombia`)}`;
}

/** Egresados de la Universidad Nacional de Colombia (UNAL) y de su Facultad de Ciencias Económicas (FCE): suelen ser
 *  los contactos más fáciles de abordar, por eso se destacan. */
export const LEAD_ALUMNI = [
  { id: "NONE", label: "No es egresado" },
  { id: "UNAL", label: "Egresado UNAL" },
  { id: "FCE", label: "Egresado FCE (UNAL)" },
] as const;
export type LeadAlumni = (typeof LEAD_ALUMNI)[number]["id"];

export function normalizeAlumni(raw: unknown): LeadAlumni {
  return LEAD_ALUMNI.some((a) => a.id === raw) ? (raw as LeadAlumni) : "NONE";
}

export const ALUMNI_BADGE: Record<string, string> = { UNAL: "Egresado UNAL", FCE: "Egresado FCE" };

/** ¿Es egresado (de la UNAL o de la FCE)? */
export const isAlumni = (alumni: string) => alumni === "UNAL" || alumni === "FCE";

/** Búsqueda en LinkedIn de personas de esa empresa que estudiaron en la UNAL (o, en el caso FCE, en sus programas
 *  de Ciencias Económicas). */
export function linkedinAlumniSearchUrl(company: string, alumni: "UNAL" | "FCE"): string {
  const short = company.replace(/\s*\(.*?\)\s*/g, " ").trim();
  const extra = alumni === "FCE" ? ' ("Ciencias Económicas" OR "Administración de Empresas" OR "Contaduría Pública" OR Economía)' : "";
  const q = `"${short}" "Universidad Nacional de Colombia"${extra}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`;
}

/** Valor del campo de logo: URL completa, data URL o ruta absoluta tal cual; un nombre de archivo suelto
 *  se busca en /public/logos/. */
export function resolveLogo(logoUrl: string): string {
  if (/^(https?:\/\/|data:|\/)/.test(logoUrl)) return logoUrl;
  return `/logos/${logoUrl}`;
}

const SEARCH_TERMS: Record<LeadKind, string> = {
  RECLUTADOR: '(reclutador OR reclutadora OR "talent acquisition" OR selección)',
  GERENTE: "(gerente OR director OR directora OR vicepresidente)",
  RECURSOS_HUMANOS: '("recursos humanos" OR "gestión humana" OR "talento humano")',
  OTRO: "",
};

/** Búsqueda de personas en LinkedIn para ese tipo de contacto en la empresa (se abre en otra pestaña;
 *  sirve para encontrar perfiles y luego guardarlos). Quita el aclaratorio entre paréntesis del nombre. */
export function linkedinSearchUrl(company: string, kind: LeadKind): string {
  const short = company.replace(/\s*\(.*?\)\s*/g, " ").trim();
  const q = `"${short}" ${SEARCH_TERMS[kind]}`.trim();
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}`;
}
