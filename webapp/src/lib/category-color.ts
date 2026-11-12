/** Paleta de colores por categoría de proyecto. Aparte de PERSON_COLORS para
 *  que una categoría y una persona no coincidan por casualidad en la misma vista. */
export const CATEGORY_COLORS = [
  "#2563EB", // azul
  "#DC2626", // rojo
  "#059669", // verde
  "#D97706", // ámbar
  "#7C3AED", // violeta
  "#DB2777", // rosa
  "#0891B2", // celeste
  "#65A30D", // lima
  "#9333EA", // púrpura
  "#EA580C", // naranja
  "#0D9488", // verde azulado
  "#4F46E5", // índigo
];

/** Colores fijos de las líneas de trabajo y categorías conocidas, elegidos para que
 *  las rebanadas hermanas de la rueda nunca coincidan (con el hash solo, dos
 *  líneas salían del mismo violeta). Lo que no esté aquí cae al hash de abajo. */
const FIXED_COLORS: Record<string, string> = {
  // Líneas de trabajo
  "Articulación interna": "#2563EB",
  "Comunicación": "#7C3AED",
  "Eventos y vinculación": "#EA580C",
  "Gestión interna": "#059669",
  // Articulación interna
  "Articulación con Apoyos Académicos": "#0D9488",
  "Articulación con Cursos Libres": "#0891B2",
  "Articulación con Desarrollo": "#65A30D",
  "Articulación con Gestión del Conocimiento": "#4F46E5",
  "Articulación con Virtualización": "#D97706",
  "Articulación con Coordinación": "#DB2777",
  "Articulación transversal": "#DC2626",
  // Comunicación
  "Producción de contenido": "#2563EB",
  "Carteleras y pantallas": "#D97706",
  "Canales digitales": "#0891B2",
  // Eventos y vinculación
  "Eventos y formación": "#EA580C",
  "Alianzas y comunidad": "#9333EA",
  // Gestión interna
  "Documentación y memoria": "#0D9488",
  "Normativa y cumplimiento": "#4F46E5",
  "Mejora de procesos": "#65A30D",
};

/** Color de una categoría: fijo si es conocida; si no, estable a partir de su
 *  nombre (misma categoría = mismo color siempre, sin guardar nada). */
export function categoryColor(category: string): string {
  const fixed = FIXED_COLORS[category];
  if (fixed) return fixed;
  let h = 0;
  for (const ch of category) h = (h + ch.charCodeAt(0) * 31) % 2147483647;
  return CATEGORY_COLORS[h % CATEGORY_COLORS.length];
}
