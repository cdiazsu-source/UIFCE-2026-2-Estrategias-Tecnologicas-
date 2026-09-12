/** Agrupación de las categorías de planeación (texto libre del CSV, campo
 *  `Project.category`) para la rueda de distribución del panel principal, en
 *  dos niveles:
 *  - Macro-categoría: la rebanada de primer nivel de la rueda.
 *  - Subcategoría: agrupa dentro de cada macro-categoría las categorías del
 *    CSV que en la práctica describen lo mismo (ej. "Eventos", "Eventos /
 *    Proyectos estratégicos" y "Proyectos estratégicos" son variantes del
 *    mismo concepto y se consolidan en una sola subcategoría). Cuando una
 *    categoría del CSV es un concepto propio (sin variantes), su subcategoría
 *    es ella misma.
 *  Cada nivel trae una descripción corta y corporativa que se muestra al
 *  hacer click en esa categoría en el panel principal. */
export type CategorySubgroup = { label: string; description: string; categories: string[] };
export type CategoryGroupDef = { label: string; description: string; subgroups: CategorySubgroup[] };

export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  {
    label: "🎨 Contenido y redes",
    description:
      "Producción de piezas gráficas y audiovisuales, y operación de los canales oficiales de la Unidad: el trabajo recurrente de comunicación digital de ET.",
    subgroups: [
      {
        label: "Producción de contenido",
        description:
          "Diseño y producción de piezas gráficas y audiovisuales para los canales oficiales y las necesidades puntuales del área.",
        categories: ["Producción de contenido"],
      },
      {
        label: "Redes y canales",
        description:
          "Administración y crecimiento de las cuentas oficiales de la Unidad en redes sociales: publicación, interacción y seguimiento de métricas.",
        categories: ["Redes y canales"],
      },
    ],
  },
  {
    label: "🎤 Eventos y proyectos estratégicos",
    description:
      "Iniciativas de mayor escala e impacto institucional: eventos, lanzamientos y proyectos estratégicos del semestre, bajo el principio de «calidad sobre cantidad».",
    subgroups: [
      {
        label: "Eventos y proyectos estratégicos",
        description:
          "Eventos, microtalleres y proyectos estratégicos de alto impacto para posicionar a la Unidad, priorizando calidad sobre volumen.",
        categories: ["Eventos / Proyectos estratégicos", "Eventos", "Proyectos estratégicos"],
      },
    ],
  },
  {
    label: "🤝 Acompañamiento interárea",
    description:
      "Apoyo de ET a las demás áreas de la UIFCE (piezas, difusión, soporte de canales), bajo el canal único de solicitudes y los niveles de servicio (SLA) definidos.",
    subgroups: [
      {
        label: "Acompañamiento interárea",
        description:
          "Solicitudes de apoyo de otras áreas de la UIFCE que no corresponden a un área específica con acompañamiento dedicado.",
        categories: ["Acompañamiento interárea"],
      },
      {
        label: "Acompañamiento a Cursos Libres",
        description:
          "Apoyo puntual de ET al área de Cursos Libres (piezas, difusión, soporte de canales), según el protocolo interárea.",
        categories: ["Acompañamiento a Cursos Libres"],
      },
      {
        label: "Acompañamiento a Virtualización",
        description:
          "Apoyo puntual de ET al área de Virtualización, incluida la estandarización de piezas e interacciones para los cursos virtuales.",
        categories: ["Acompañamiento a Virtualización"],
      },
    ],
  },
  {
    label: "🏛️ Gestión institucional",
    description:
      "Trabajo de base que sostiene al área: documentación y memoria institucional, cumplimiento normativo, y eficiencia de los procesos internos.",
    subgroups: [
      {
        label: "Documentación y memoria institucional",
        description:
          "Registro y preservación de procesos, activos y aprendizajes del área, para que el conocimiento no se pierda entre semestres.",
        categories: ["Documentación y memoria institucional"],
      },
      {
        label: "Normativa",
        description: "Cumplimiento de los lineamientos institucionales y de identidad visual de la Universidad.",
        categories: ["Normativa"],
      },
      {
        label: "Innovación y eficiencia operativa",
        description: "Mejoras a los procesos internos de ET orientadas a ganar eficiencia sin sacrificar calidad.",
        categories: ["Innovación y eficiencia operativa"],
      },
    ],
  },
  {
    label: "🔁 Proyectos en continuidad",
    description:
      "Proyectos heredados de semestres anteriores que siguen activos este semestre, dando continuidad a compromisos ya adquiridos.",
    subgroups: [
      {
        label: "Proyectos en continuidad",
        description:
          "Proyectos que vienen de semestres anteriores y continúan activos, dando seguimiento a compromisos ya adquiridos.",
        categories: ["Proyectos en continuidad"],
      },
    ],
  },
];

export function macroForCategory(category: string): string {
  for (const g of CATEGORY_GROUPS) {
    if (g.subgroups.some((sg) => sg.categories.includes(category))) return g.label;
  }
  return category;
}

export function subgroupForCategory(category: string): string {
  for (const g of CATEGORY_GROUPS) {
    const sg = g.subgroups.find((sg) => sg.categories.includes(category));
    if (sg) return sg.label;
  }
  return category;
}

export function macroDescription(macroLabel: string): string | undefined {
  return CATEGORY_GROUPS.find((g) => g.label === macroLabel)?.description;
}

export function subgroupDescription(subgroupLabel: string): string | undefined {
  for (const g of CATEGORY_GROUPS) {
    const sg = g.subgroups.find((sg) => sg.label === subgroupLabel);
    if (sg) return sg.description;
  }
  return undefined;
}
