/** Cruce estratégico entre el Diagnóstico DOFA (`dofa-data.ts`) y el
 *  portafolio de proyectos vigente (`planeacion/planeacion_del_area.csv`),
 *  agrupado por tema en vez de hallazgo por hallazgo — así una fortaleza, una
 *  debilidad y una oportunidad que hablan de lo mismo (ej. MicroTalleres)
 *  quedan juntas, con el mismo criterio de claridad ejecutiva que el resto
 *  del panel.
 *
 *  Es contenido fijo, igual que dofa-data.ts: análisis hecho una vez sobre el
 *  DOFA de septiembre de 2026 y el portafolio de ese momento, no algo que se
 *  recalcule solo con lo que haya en la base de datos hoy. Si el portafolio
 *  cambia de fondo, este archivo se debe revisar a mano. */
import type { DofaQuadrantKey } from "./dofa-data";

export type CoverageStatus = "covered" | "partial" | "gap";

export const COVERAGE_LABEL: Record<CoverageStatus, string> = {
  covered: "Cubierto",
  partial: "Cobertura parcial",
  gap: "Sin proyecto — iniciativa propuesta",
};

export type StrategicTheme = {
  id: string;
  title: string;
  quadrants: DofaQuadrantKey[];
  /** Síntesis de qué dice el DOFA sobre este tema, citando el cuadrante. */
  dofaSummary: string;
  /** Proyectos vigentes del portafolio que ya atienden el tema (título tal
   *  como aparece en `planeacion_del_area.csv`). Vacío si es un vacío puro. */
  projects: string[];
  status: CoverageStatus;
  /** El ángulo de Estrategia Tecnológica: cómo la tecnología resuelve (o
   *  resolvería) el problema concreto, no solo la gestión administrativa. */
  techStrategy: string;
};

export const STRATEGIC_SUMMARY =
  "Cada tema agrupa los hallazgos del DOFA (Fortalezas, Oportunidades, Debilidades, Amenazas) que hablan de lo mismo, " +
  "señala qué proyecto del portafolio 2026-2 ya lo atiende y, cuando ninguno lo cubre, propone una iniciativa nueva " +
  "con enfoque de Estrategia Tecnológica: la tecnología como la palanca que resuelve el problema de fondo, no solo " +
  "el registro de que existe.";

export const STRATEGIC_THEMES: StrategicTheme[] = [
  {
    id: "microtalleres",
    title: "MicroTalleres y MicroEventos",
    quadrants: ["F", "D", "O", "A"],
    dofaSummary:
      "F: calidad ya probada (4,72/5 dominio técnico) y demanda que duplica la capacidad (267 inscritos en 2026-I). " +
      "D: solo ~52% de quienes se inscriben asiste; el Manual descarta la modalidad híbrida pese a que el propio " +
      "informe 2026-I recomienda priorizarla, y el aforo virtual queda inconsistente entre sus dos versiones. " +
      "O: la modalidad virtual ya está reglamentada, lista para escalar sin más salas. " +
      "A: los MicroEventos lúdicos dependen de aval de Bienestar Universitario.",
    projects: ["Microtalleres UIFCE", "Cierre de Términos y Condiciones de Estrategias Tecnológicas"],
    status: "partial",
    techStrategy:
      "El Manual y los próximos T&C ya formalizan roles, penalizaciones y grabación obligatoria. El paso tecnológico " +
      "que falta es un único formulario de preinscripción que capture la modalidad elegida y calcule un solo número " +
      "de aforo virtual — no dos documentos que pueden desalinearse.",
  },
  {
    id: "redes",
    title: "Redes sociales y contenido digital",
    quadrants: ["F", "D", "A"],
    dofaSummary:
      "F: salto medible en 2026-I (11 hacks con 23.029 vistas, LinkedIn reactivado con 1.491 impresiones). " +
      "D: canales institucionales que aún dependen de gestiones o cuentas personales (LinkedIn, el histórico de " +
      "YouTube). A: sin presupuesto de pauta, el alcance depende por completo de la calidad y frecuencia del contenido.",
    projects: [
      "Recuperación o recreación de la cuenta de Instagram @uifce_un",
      "Posicionamiento prioritario de LinkedIn UIFCE",
      "Creación de la cuenta de TikTok UIFCE",
      "Consolidación y cierre de oficialización de YouTube UIFCE",
      "Repositorio de Hacks Informáticos",
    ],
    status: "covered",
    techStrategy:
      "La oficialización institucional ante la Oficina de Medios Digitales UNAL es la vacuna tecnológica contra el " +
      "riesgo de gobernanza — ya aplicada a Instagram y LinkedIn; falta extenderla a TikTok. El formato corto " +
      "(hacks/reels) sustituye la pauta paga que el área no tiene.",
  },
  {
    id: "extension-solidaria",
    title: "Extensión Solidaria",
    quadrants: ["D", "O", "A"],
    dofaSummary:
      "D/A: 271 de 275 colegios contactados sin respuesta (98,5%) y sin aval de Vicedecanatura en 2026-I. " +
      "O: existen convocatorias de extensión y proyectos estudiantiles que no dependen de ese aval.",
    projects: ["Extensión Solidaria"],
    status: "covered",
    techStrategy:
      "El proyecto ya existe y tiene una ruta de financiamiento alterna. El rol de la tecnología aquí es la " +
      "evidencia: el propio tablero de ET en Marcha puede convertir ese 98,5% de no-respuesta en el argumento " +
      "cuantitativo que le falta al área para escalar la gestión ante Decanatura.",
  },
  {
    id: "liderazgo-alianzas",
    title: "Liderazgo y alianzas empresariales",
    quadrants: ["F", "O", "A"],
    dofaSummary:
      "F: el Director tiene un perfil y una red empresarial afines al área. O: esa red hoy se usa sobre todo para " +
      "la Hackatón, no para más. A: las alianzas externas sin trayectoria pueden fallar — antecedente: la Fundación " +
      "VGB, suspendida en 2025.",
    projects: ["Red de Aliados Académicos UIFCE"],
    status: "partial",
    techStrategy:
      "El proyecto que capitaliza esta fortaleza sigue en Backlog. Priorizarlo es la forma de convertir una relación " +
      "personal del Director en un activo institucional del área, con criterios explícitos de verificación que " +
      "eviten repetir el caso de la Fundación VGB.",
  },
  {
    id: "memoria-continuidad",
    title: "Memoria institucional y continuidad del equipo",
    quadrants: ["F", "D", "A"],
    dofaSummary:
      "F: los informes semestrales sistemáticos ya dejan trazabilidad. D: el Drive de la Unidad sigue desorganizado " +
      "y la operación depende de estudiantes auxiliares sin planta fija. A: la rotación estructural (Junior, Ad " +
      "honorem, Máster) y factores imprevisibles — el paro académico de 2026-I — pueden borrar en un semestre buena " +
      "parte del avance logrado.",
    projects: [
      "Repositorio documental permanente de Estrategias Tecnológicas",
      "Propuesta de reorganización del Drive UIFCE ante Gestión del Conocimiento (GC)",
      "Memorias UIFCE 2026-2S",
      "Memoria institucional audiovisual del equipo y del semestre 2026-2S",
    ],
    status: "partial",
    techStrategy:
      "Documentar el qué ya está en marcha; falta documentar el cómo. Un checklist de empalme por rol dentro de la " +
      "misma app, apoyado en las grabaciones que el Manual ya exige, permite que un monitor nuevo se autoforme sin " +
      "depender de que quien se va alcance a explicarle todo antes de irse.",
  },
  {
    id: "comunicaciones",
    title: "Alianza con Comunicaciones e Imagen Institucional",
    quadrants: ["F", "O"],
    dofaSummary:
      "F: la difusión de MicroTalleres ya se apoya en el correo masivo de Comunicaciones de la Facultad. " +
      "O: la alianza se amplió en 2026-I a micrositio, Blog UIFCE y carteleras.",
    projects: ["Carteleras UIFCE (física y digital)", "Micrositio UIFCE", "Blog UIFCE"],
    status: "covered",
    techStrategy:
      "Validar cada pieza con Comunicaciones antes de publicarla — como ya ocurrió con el ajuste de color pedido en " +
      "2026-I — es un paso de revisión, no una herramienta nueva, y evita retrocesos más costosos después de publicado.",
  },
  {
    id: "identidad-licencias",
    title: "Identidad visual y licencias de software",
    quadrants: ["D"],
    dofaSummary:
      "D: el Brandbook no se actualiza desde 2021. El área tampoco tiene licencias oficiales de diseño (Adobe/Canva " +
      "son personales) y el equipo UIFCE-08 es insuficiente, sin confirmación de que se haya resuelto en 2026-I.",
    projects: [],
    status: "gap",
    techStrategy: "Ningún proyecto vigente del portafolio lo cubre — ver las dos iniciativas propuestas más abajo.",
  },
  {
    id: "hackaton-semana",
    title: "Semana UIFCE y Hackatón Bizagi",
    quadrants: ["D", "O"],
    dofaSummary:
      "D: la Hackatón se canceló en 2025-II por baja inscripción. O: la Semana UIFCE (heredera de la Semana de " +
      "Investigación FCE) es la plataforma para relanzarla en 2026-2 junto con un microtaller y una conferencia.",
    projects: [
      "Semana UIFCE — primera edición",
      "Hackatón Bizagi UIFCE: Optimización y Simulación de Procesos Empresariales",
    ],
    status: "covered",
    techStrategy:
      "El proyecto ya existe y está en curso — pero la razón de fondo de la cancelación de 2025-II (baja inscripción) " +
      "sigue sin una respuesta explícita para 2026-2, justo cuando además colapsaron los canales masivos del área. " +
      "Es el tema pendiente de la conversación específica sobre cómo reestructurar la convocatoria de la Hackatón.",
  },
  {
    id: "espacios",
    title: "Espacios físicos",
    quadrants: ["D", "A"],
    dofaSummary:
      "D: de las salas del Ed. 310, solo la Sala 6 (Ed. 238, 16 equipos) aparecía disponible, sin dato más reciente " +
      "que confirme un cambio. A: el área compite en desventaja por salones frente a Escuelas con más peso institucional.",
    projects: [],
    status: "partial",
    techStrategy:
      "No se propone un proyecto de infraestructura nueva — la estrategia tecnológica es reducir la dependencia del " +
      "espacio físico: la modalidad virtual ya reglamentada (MicroTalleres) absorbe la demanda que la Sala 6 no " +
      "alcanza a cubrir, y el tracker de Herramientas y licencias de Sala 1 ya deja registrado qué PC puede además " +
      "usarse para proyectar, sin pedir un salón nuevo.",
  },
  {
    id: "tecnologia-aplicada",
    title: "Tecnología aplicada (demanda empresarial)",
    quadrants: ["O"],
    dofaSummary:
      "O: demanda no satisfecha en SAP, Odoo, Quickbooks, Salesforce, Power BI/Tableau, Power Automate, Blockchain e IA.",
    projects: ["Repositorio de material con IA y automatización de producción de video"],
    status: "partial",
    techStrategy:
      "La Hackatón Bizagi es, en sí misma, la primera respuesta directa a esta oportunidad: Bizagi es una herramienta " +
      "de BPM, exactamente el tipo de software empresarial que el diagnóstico señala como brecha. El catálogo de " +
      "próximos MicroTalleres es el vehículo natural para cubrir el resto de la lista.",
  },
];

export type ProposedInitiative = {
  id: string;
  title: string;
  fromThemeId: string;
  description: string;
  techAngle: string;
};

/** Iniciativas nuevas: solo para los temas que el portafolio actual no cubre
 *  (status "gap" arriba). No se inventan proyectos donde ya hay uno vigente. */
export const PROPOSED_INITIATIVES: ProposedInitiative[] = [
  {
    id: "modalidad-hibrida",
    title: "Piloto de modalidad híbrida para MicroTalleres",
    fromThemeId: "microtalleres",
    description:
      "Definir y probar en un MicroTaller la transmisión simultánea presencial + virtual, resolviendo en el mismo " +
      "paso la inconsistencia de aforo entre las dos versiones del Manual.",
    techAngle:
      "Un único formulario de preinscripción, dentro de ET en Marcha, que registre la modalidad elegida y aplique " +
      "un solo número de aforo virtual — no dos documentos que pueden contradecirse.",
  },
  {
    id: "empalme-continuidad",
    title: "Programa de empalme y continuidad de talento",
    fromThemeId: "memoria-continuidad",
    description:
      "Convertir el Manual de Funciones en un checklist de empalme operativo por rol, más una biblioteca corta de " +
      "video-tutoriales grabados con el mismo equipo que ya graba los MicroTalleres.",
    techAngle:
      "Un monitor nuevo se autoforma con lo que el área ya produce por obligación (grabaciones), en vez de depender " +
      "de una transición verbal con quien se va.",
  },
  {
    id: "brandbook-2026",
    title: "Actualización del Brandbook UIFCE 2026",
    fromThemeId: "identidad-licencias",
    description:
      "Reemplazar el brandbook de 2021 usando la página «Línea gráfica» de ET en Marcha como el documento vivo — " +
      "colores, tipografías y plantillas versionados en el mismo lugar donde ya se consultan.",
    techAngle: "Una guía de marca que vive en la app no vuelve a desactualizarse en silencio: cambia con un commit, no con un PDF que nadie reemplaza.",
  },
  {
    id: "gestion-licencias",
    title: "Gestión institucional de licencias de software",
    fromThemeId: "identidad-licencias",
    description:
      "Usar el tracker de software por PC de Herramientas y licencias (Sala 1) como reporte de brecha — qué equipo " +
      "tiene qué — para sustentar ante la Unidad la compra de licencias oficiales de diseño.",
    techAngle: "La evidencia para pedir presupuesto ya existe en la app; falta solo convertir el inventario visual en un reporte de faltantes.",
  },
];
