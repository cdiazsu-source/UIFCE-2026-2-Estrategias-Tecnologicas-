/** Agrupación de las categorías de planeación (texto libre del CSV, campo
 *  `Project.category`) en macro-categorías para la rueda de distribución del
 *  panel principal. Las categorías originales no se pierden: quedan como
 *  subcategoría (segundo nivel de la rueda). Si aparece una categoría nueva
 *  que no está mapeada aquí, se muestra como su propia macro-categoría en vez
 *  de desaparecer del conteo. */
export const CATEGORY_GROUPS: { label: string; categories: string[] }[] = [
  { label: "🎨 Contenido y redes", categories: ["Producción de contenido", "Redes y canales"] },
  {
    label: "🎤 Eventos y proyectos estratégicos",
    categories: ["Eventos / Proyectos estratégicos", "Eventos", "Proyectos estratégicos"],
  },
  {
    label: "🤝 Acompañamiento interárea",
    categories: ["Acompañamiento interárea", "Acompañamiento a Cursos Libres", "Acompañamiento a Virtualización"],
  },
  {
    label: "🏛️ Gestión institucional",
    categories: ["Documentación y memoria institucional", "Normativa", "Innovación y eficiencia operativa"],
  },
  { label: "🔁 Proyectos en continuidad", categories: ["Proyectos en continuidad"] },
];

export function macroForCategory(category: string): string {
  return CATEGORY_GROUPS.find((g) => g.categories.includes(category))?.label ?? category;
}
