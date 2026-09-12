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

/** Color de una categoría: estable a partir de su nombre (misma categoría =
 *  mismo color siempre, sin guardar nada). */
export function categoryColor(category: string): string {
  let h = 0;
  for (const ch of category) h = (h + ch.charCodeAt(0) * 31) % 2147483647;
  return CATEGORY_COLORS[h % CATEGORY_COLORS.length];
}
