/** Estructura de clasificación de los proyectos (campo `Project.category`, texto
 *  libre en la BD y en el CSV de planeación), en dos niveles:
 *  - Línea de trabajo: la rebanada de primer nivel de la rueda del panel.
 *  - Categoría: lo que aparece en los encabezados de los documentos de ET
 *    («Categoría · Nombre del proyecto») y en el selector de «Nuevo proyecto».
 *
 *  Regla para elegir (una sola pregunta): «¿con quién se hace?». Si el proyecto
 *  se hace con otra dependencia de la UIFCE (Apoyos Académicos, Cursos Libres,
 *  Desarrollo, Gestión del Conocimiento, Virtualización o Coordinación) va a
 *  «Articulación con …», sea cual sea el formato; si abarca a todas, a
 *  «Articulación transversal». Si no, se clasifica por lo que entrega.
 *
 *  Los nombres de categoría NO pueden llevar « — »: el CSV usa ese separador
 *  para pegar la etiqueta de urgencia (ver `splitCategory` en prisma/seed.ts).
 *
 *  Cada nivel trae una descripción corta y corporativa que se muestra al hacer
 *  click en esa línea o categoría en el panel principal. */
export type CategorySubgroup = { label: string; description: string; categories: string[] };
export type CategoryGroupDef = { label: string; description: string; subgroups: CategorySubgroup[] };

export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  {
    label: "Articulación interna",
    description:
      "Proyectos que ET desarrolla en conjunto con otras dependencias de la UIFCE, bajo el canal único de solicitudes y los niveles de servicio definidos en el protocolo de acompañamiento interárea.",
    subgroups: [
      {
        label: "Articulación con Apoyos Académicos",
        description: "Proyectos que ET desarrolla en conjunto con Apoyos Académicos.",
        categories: ["Articulación con Apoyos Académicos"],
      },
      {
        label: "Articulación con Cursos Libres",
        description: "Proyectos que ET desarrolla en conjunto con Cursos Libres: línea gráfica, piezas de lanzamiento y difusión del aplicativo.",
        categories: ["Articulación con Cursos Libres"],
      },
      {
        label: "Articulación con Desarrollo",
        description: "Proyectos que ET desarrolla en conjunto con Desarrollo, como el diseño de los aplicativos de la Unidad.",
        categories: ["Articulación con Desarrollo"],
      },
      {
        label: "Articulación con Gestión del Conocimiento",
        description: "Proyectos que ET desarrolla en conjunto con Gestión del Conocimiento.",
        categories: ["Articulación con Gestión del Conocimiento"],
      },
      {
        label: "Articulación con Virtualización",
        description: "Proyectos que ET desarrolla en conjunto con Virtualización, incluida la estandarización de piezas para cursos virtuales.",
        categories: ["Articulación con Virtualización"],
      },
      {
        label: "Articulación con Coordinación",
        description: "Proyectos que ET desarrolla en conjunto con Coordinación, como plantillas y piezas de uso para toda la Unidad.",
        categories: ["Articulación con Coordinación"],
      },
      {
        label: "Articulación transversal",
        description: "Trabajo que involucra a todas las dependencias de la UIFCE, y el protocolo de acompañamiento interárea.",
        categories: ["Articulación transversal"],
      },
    ],
  },
  {
    label: "Comunicación",
    description:
      "Producción de piezas y operación de los medios oficiales de la Unidad: el trabajo recurrente de comunicación de ET.",
    subgroups: [
      {
        label: "Producción de contenido",
        description:
          "Diseño y producción de piezas gráficas y audiovisuales propias de ET y de la marca UIFCE: afiches, videos, mascota y logo.",
        categories: ["Producción de contenido"],
      },
      {
        label: "Carteleras y pantallas",
        description:
          "Carteleras físicas y digitales, señalética de salas y cápsulas en los televisores de la Unidad.",
        categories: ["Carteleras y pantallas"],
      },
      {
        label: "Canales digitales",
        description:
          "Operación de las cuentas oficiales en redes sociales, del micrositio, el blog y el boletín: publicación, interacción y seguimiento de métricas.",
        categories: ["Canales digitales"],
      },
    ],
  },
  {
    label: "Eventos y vinculación",
    description:
      "Iniciativas de ET hacia la comunidad y el entorno de la Unidad: eventos, alianzas y relación con egresados, bajo el principio de «calidad sobre cantidad».",
    subgroups: [
      {
        label: "Eventos y formación",
        description: "Semana UIFCE, microtalleres y demás actividades con fecha, priorizando calidad y asistencia efectiva sobre volumen.",
        categories: ["Eventos y formación"],
      },
      {
        label: "Alianzas y comunidad",
        description:
          "Relación con empresas, aliados académicos, egresados, extensión solidaria y estudiantes de primeros semestres.",
        categories: ["Alianzas y comunidad"],
      },
    ],
  },
  {
    label: "Gestión interna",
    description:
      "Trabajo de base que sostiene al equipo: documentación y memoria, cumplimiento normativo y mejora de los procesos propios.",
    subgroups: [
      {
        label: "Documentación y memoria",
        description:
          "Registro y preservación de procesos, activos y aprendizajes de ET, para que el conocimiento no se pierda entre semestres.",
        categories: ["Documentación y memoria"],
      },
      {
        label: "Normativa y cumplimiento",
        description: "Reglas, términos y condiciones, consentimientos e identidad visual de la Universidad.",
        categories: ["Normativa y cumplimiento"],
      },
      {
        label: "Mejora de procesos",
        description: "Automatización, herramientas e inteligencia artificial para trabajar con más eficiencia sin sacrificar calidad.",
        categories: ["Mejora de procesos"],
      },
    ],
  },
];

/** Categorías principales conocidas, para el datalist de sugerencias al crear
 *  o editar un proyecto (ver new-project-button.tsx y project-controls.tsx).
 *  El campo sigue siendo texto libre — esto solo evita que cada quien
 *  reescriba a mano una categoría que ya existe. */
export const ALL_PROJECT_CATEGORIES: string[] = CATEGORY_GROUPS.flatMap((g) =>
  g.subgroups.flatMap((sg) => sg.categories),
);

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
