/** Paleta de colores de acento por persona. Se evitan verde/rojo/ámbar porque
 *  ya tienen significado de estado en la app. */
export const PERSON_COLORS = [
  "#2563EB", // azul
  "#7C3AED", // violeta
  "#DB2777", // rosa
  "#EA580C", // naranja
  "#0D9488", // verde azulado
  "#4F46E5", // índigo
  "#C026D3", // fucsia
  "#0284C7", // celeste
];

/** Color de una persona: el que tenga guardado, o uno estable derivado del id. */
export function personColor(person: { id: string; color?: string | null }): string {
  if (person.color && /^#[0-9a-fA-F]{6}$/.test(person.color)) return person.color;
  let h = 0;
  for (const ch of person.id) h = (h + ch.charCodeAt(0)) % 2147483647;
  return PERSON_COLORS[h % PERSON_COLORS.length];
}
