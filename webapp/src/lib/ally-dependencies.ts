/** Aliados dependencias: oficinas y unidades de la Facultad o la Universidad con las que ET coordina
 *  (ORI, CIID, Vicedecanatura, Comunicaciones…). Cada aliado (`Contact`) pertenece a una; el grupo se
 *  toma de `Contact.dependency` y, si está vacío, se deduce del rol, así la pantalla funciona también
 *  antes de aplicar la migración. */

/** Dependencias que siempre se muestran, aunque aún no tengan contactos. */
export const DEPENDENCY_PRESETS = ["ORI", "CIID", "Vicedecanatura", "Comunicaciones"] as const;

/** Organigrama de la Facultad de Ciencias Económicas (sede Bogotá, Acuerdo 028 de 2023): página oficial y copia del PDF en `public/documentos/`. */
export const ORGANIGRAMA_URL = "https://fce.unal.edu.co/facultad/organigrama/";
export const ORGANIGRAMA_FILE = "/documentos/organigrama-fce-2023.pdf";

/** Nombre completo de las dependencias predefinidas, tal como aparecen en el organigrama (CIID es el Centro de Investigaciones para el Desarrollo, CID: confirmado por el usuario). */
export const DEPENDENCY_FULL_NAME: Record<string, string> = {
  CIID: "Centro de Investigaciones para el Desarrollo (CID)",
  ORI: "Oficina de Relaciones Interinstitucionales e Internacionales",
  Vicedecanatura: "Académica y de Investigación y de Extensión",
  Comunicaciones: "Oficina de Comunicaciones, Difusión y Apropiación",
};

/** Otras unidades del organigrama que se sugieren al escribir una dependencia (no crean grupos por sí solas). */
export const DEPENDENCY_SUGGESTIONS = [
  "Unidad de Análisis en Ciencias Económicas",
  "Unidad de Emprendimiento e Innovación",
  "Dirección de Bienestar",
  "Centro Editorial",
  "Escuela de Economía",
  "Escuela de Administración y Contaduría Pública",
  "Secretaría de Facultad",
];

/** Grupo de quienes no encajan en ninguna dependencia (personas externas, monitores, otras áreas…). */
export const OTHER_GROUP = "Otros aliados";

export function normText(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/** Dependencia deducida de un texto libre (el rol), o null si no se reconoce. */
export function inferDependency(text: string): string | null {
  const t = normText(text);
  if (/\bori\b/.test(t)) return "ORI";
  if (/\b(ciid|cid)\b/.test(t)) return "CIID";
  if (t.includes("vicedecan") || /\bvie\b/.test(t)) return "Vicedecanatura";
  if (t.includes("comunicacion")) return "Comunicaciones";
  return null;
}

/** Dependencia de un aliado: la escrita, o la deducida del rol, o «Otros aliados». Unifica mayúsculas con las predefinidas. */
export function dependencyOf(c: { dependency?: string | null; role: string }): string {
  const own = (c.dependency ?? "").trim();
  if (own) {
    const preset = DEPENDENCY_PRESETS.find((p) => normText(p) === normText(own));
    return preset ?? own;
  }
  return inferDependency(c.role) ?? OTHER_GROUP;
}

export type DependencyGroup<T> = { name: string; items: T[] };

/** Agrupa por dependencia: primero las predefinidas (aunque estén vacías), luego las demás por orden alfabético y al final «Otros aliados» si hay. */
export function groupByDependency<T extends { dependency?: string | null; role: string }>(items: T[]): DependencyGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const p of DEPENDENCY_PRESETS) map.set(p, []);
  for (const it of items) {
    const key = dependencyOf(it);
    const list = map.get(key);
    if (list) list.push(it);
    else map.set(key, [it]);
  }
  const presets = DEPENDENCY_PRESETS.map((p) => ({ name: p as string, items: map.get(p) ?? [] }));
  const others = Array.from(map.entries())
    .filter(([k]) => !(DEPENDENCY_PRESETS as readonly string[]).includes(k) && k !== OTHER_GROUP)
    .sort((a, b) => a[0].localeCompare(b[0], "es"))
    .map(([name, list]) => ({ name, items: list }));
  const rest = map.get(OTHER_GROUP) ?? [];
  return [...presets, ...others, ...(rest.length ? [{ name: OTHER_GROUP, items: rest }] : [])];
}
