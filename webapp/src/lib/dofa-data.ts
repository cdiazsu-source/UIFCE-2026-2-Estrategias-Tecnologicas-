/** Contenido del "Diagnóstico DOFA — Área de Estrategias Tecnológicas (UIFCE)",
 *  elaborado por César Díaz S. (última actualización: septiembre de 2026).
 *  Es un documento fijo (diagnóstico fechado, con autor y fuentes citadas), no
 *  una lista editable en el día a día como la línea gráfica o el checklist —
 *  por eso vive como datos estáticos y no como modelo de Prisma. Formato de
 *  bullets concisos (dato + cifra), pensado para lectura en presentación
 *  corporativa, no en prosa. Ver la versión completa en el .docx entregado
 *  (`Diagnostico_DOFA_ET_UIFCE.docx`). */

export type DofaItem = { text: string; source?: string };

export const DOFA_META = {
  elaboradoPor: "César Díaz S. (equipo de Estrategias Tecnológicas, UIFCE)",
  ultimaActualizacion: "Septiembre de 2026",
  director: "profesor Henry Martínez Sarmiento",
  /** Solo las fuentes de datos usadas para construir el diagnóstico. */
  fuentes: [
    "3 informes de gestión del área: 2025-I, 2025-II, 2026-I",
    "Bases de los tableros de Power BI: BBDD Dashboard Final 2025-I, Datos Power BI 2026-I",
    "Manual de MicroTalleres y MicroEventos, 2026 (versión PDF «Monitor Máster» y versión Word «Manual Microtaller»)",
    "Formatos de correos de confirmación de cupo a microtalleres o microeventos, 2026",
    "Los .pbix no se procesaron directamente (binarios propietarios) — su información está en los .xlsx citados",
  ],
};

export const FORTALEZAS: DofaItem[] = [
  {
    text: "MicroTalleres ejecutados: 4,72/5 dominio técnico · 4,66/5 aplicabilidad · 4,54/5 expectativas (68 respuestas)",
    source: "Datos Power BI 2026-I, hoja Percepción",
  },
  {
    text: "Demanda > capacidad: «Macros en Excel» 80 inscritos / 40 cupos (200%); 2026-I: 267 inscritos en 10 MicroTalleres",
    source: "BBDD Dashboard Final 2025-I; Informe 2026-I",
  },
  {
    text: "Manual de MicroTalleres y MicroEventos (2026): aforo mínimo 15, reglas por modalidad, evaluación y grabación obligatorias, roles monitor/Unidad definidos",
    source: "Manual de MicroTalleres y MicroEventos, 2026; Informe 2026-I",
  },
  {
    text: "Correos oficiales de cupo: sin asistencia no hay grabación ni material; envío a cargo del monitor Máster",
    source: "Formatos de correos de confirmación de cupo, 2026; Informe 2025-II",
  },
  {
    text: "Difusión con apoyo de Comunicaciones de la Facultad (correo masivo), además de Instagram",
    source: "Manual Microtaller — versión Word, 2026",
  },
  {
    text: "Instagram: 11 hacks (23.029 vistas, 526 likes), 25 reels (83.649 vistas, 2.323 interacciones); LinkedIn: 7 publicaciones, 1.491 impresiones, 42 reacciones",
    source: "Informe 2026-I",
  },
  {
    text: "Instagram y LinkedIn oficializados institucionalmente (Oficina de Medios Digitales UNAL)",
    source: "Informe 2025-II",
  },
  {
    text: "80 inscritos en 2025-I: Economía 27 · Contaduría 25 · Administración 13",
    source: "BBDD Dashboard Final 2025-I",
  },
  { text: "Director con perfil afín: administrador de empresas, magíster UNAL, exdirector de virtualización, consultor empresarial" },
  { text: "Informes semestrales sistemáticos: dificultades, propuestas y proyectos a continuar" },
];

export const DEBILIDADES: DofaItem[] = [
  {
    text: "Diseño: una sola persona, sin dominio técnico garantizado (2025-I: monitor de Arquitectura)",
    source: "Informes 2025-I, 2025-II",
  },
  {
    text: "Sin licencias oficiales (Adobe/Canva personales); equipo UIFCE-08 insuficiente",
    source: "Informes 2025-I, 2025-II",
  },
  {
    text: "2026-I: 267 inscritos/admitidos vs. ~139 asistentes (~52%), agravado por paro académico",
    source: "Informe 2026-I; Datos Power BI 2026-I",
  },
  {
    text: "Espacios: 3 salas del Ed. 310 copadas; solo Sala 6 disponible (Ed. 238, 16 equipos)",
    source: "Informe 2025-I",
  },
  { text: "Solo 1 MicroTaller ejecutado en 2025-I por baja disponibilidad de monitores", source: "Informe 2025-I" },
  { text: "Drive de la Unidad desorganizado, persistente entre semestres", source: "Informes 2025-I, 2025-II" },
  {
    text: "Gobernanza: LinkedIn con cuenta personal; YouTube tardó semestres en resolverse",
    source: "Informes 2025-I, 2025-II",
  },
  { text: "Brandbook desactualizado (2021)", source: "Informes 2025-I, 2025-II" },
  {
    text: "Extensión Solidaria: 271/275 colegios sin respuesta (98,5%); sin aval de Vicedecanatura en 2026-I",
    source: "Informe 2025-I; BBDD Dashboard Final 2025-I; Informe 2026-I",
  },
  { text: "Hackatón cancelada en 2025-II por baja inscripción", source: "Informe 2025-II" },
  { text: "Operación dependiente de estudiantes auxiliares, sin planta fija" },
  {
    text: "Aforo virtual sin conciliar: PDF sin máximo vs. Word 35-100 (Meet)",
    source: "Manual PDF vs. Manual Word, 2026",
  },
  {
    text: "Manual descarta la modalidad híbrida que el informe 2026-I recomienda priorizar",
    source: "Manual de MicroTalleres y MicroEventos, 2026; Informe 2026-I",
  },
];

export const OPORTUNIDADES: DofaItem[] = [
  { text: "Semana de Investigación FCE → futura Semana UIFCE (2026-2)", source: "Informes 2025-II, 2026-I" },
  {
    text: "Alianza con Comunicaciones e Imagen Institucional: micrositio, Blog UIFCE, carteleras (2026-I)",
    source: "Informe 2026-I",
  },
  {
    text: "Convocatorias de extensión y proyectos estudiantiles para destrabar Extensión Solidaria",
    source: "Informes 2025-I, 2025-II, 2026-I",
  },
  { text: "Red de contactos empresariales del Director (Hackatón, financiamiento externo)" },
  {
    text: "Demanda no satisfecha: SAP, Odoo, Quickbooks, Salesforce, Power BI/Tableau, Power Automate, Blockchain, IA",
    source: "Informes 2025-II, 2026-I; Datos Power BI 2026-I",
  },
  {
    text: "Modalidad virtual ya reglamentada (aforo, preinscripción, grabación): escalable sin más salas",
    source: "Informe 2026-I; Manual de MicroTalleres y MicroEventos, 2026",
  },
];

export const AMENAZAS: DofaItem[] = [
  { text: "Depende de avales externos (Vicedecanatura/Decanatura) para Extensión Solidaria", source: "Informe 2025-I" },
  { text: "Factores institucionales imprevisibles (paro académico 2026-I)", source: "Informe 2026-I" },
  { text: "Competencia interna por espacios físicos con Escuelas y profesores", source: "Informe 2025-I" },
  { text: "Alcance orgánico limitado, sin presupuesto de pauta", source: "Informe 2025-I" },
  { text: "Alianzas externas poco confiables (Fundación VGB suspendida en 2025)", source: "Informe 2025-I" },
  { text: "98,5% sin respuesta en el público objetivo de Extensión Solidaria", source: "BBDD Dashboard Final 2025-I" },
  { text: "Rotación estructural de monitores (Junior, Ad honorem, Máster)" },
  {
    text: "Dinámicas lúdicas sujetas a recomendaciones de Bienestar Universitario",
    source: "Manual Microtaller — versión Word, 2026",
  },
];

export type DofaQuadrantKey = "F" | "D" | "O" | "A";

export const DOFA_QUADRANTS: {
  key: DofaQuadrantKey;
  label: string;
  emoji: string;
  color: string;
  items: DofaItem[];
}[] = [
  { key: "F", label: "Fortalezas", emoji: "💪", color: "#3f6b2c", items: FORTALEZAS },
  { key: "D", label: "Debilidades", emoji: "⚠️", color: "#b23a2a", items: DEBILIDADES },
  { key: "O", label: "Oportunidades", emoji: "🚀", color: "#2f5f8a", items: OPORTUNIDADES },
  { key: "A", label: "Amenazas", emoji: "🛑", color: "#c49a00", items: AMENAZAS },
];

export const CRUCE_ESTRATEGICO: { code: "FO" | "DO" | "FA" | "DA"; title: string; points: string[] }[] = [
  {
    code: "FO",
    title: "Fortalezas + Oportunidades",
    points: [
      "Posicionar la UIFCE como puente universidad-empresa",
      "Escalar la Semana UIFCE apoyada en el Manual y el crecimiento en redes",
    ],
  },
  {
    code: "DO",
    title: "Debilidades + Oportunidades",
    points: [
      "Resolver licencias/marca con Comunicaciones e Imagen Institucional",
      "Dar continuidad presupuestal a Extensión Solidaria vía convocatorias estudiantiles",
      "Cerrar el manual: conciliar aforo virtual y validar dinámicas lúdicas con Bienestar",
    ],
  },
  {
    code: "FA",
    title: "Fortalezas + Amenazas",
    points: [
      "Argumentar con evidencia de satisfacción/demanda ante Decanatura/Vicedecanatura",
      "Blindar el conocimiento frente a la rotación con la documentación ya sistemática",
    ],
  },
  {
    code: "DA",
    title: "Debilidades + Amenazas",
    points: [
      "Priorizar la modalidad virtual para aliviar la restricción de espacio",
      "Decidir si se habilita también la modalidad híbrida (recomendación del informe 2026-I)",
      "Profesionalizar la convocatoria del monitor de diseño (perfil + prueba técnica)",
    ],
  },
];

export const PARAMETROS_OPERATIVOS: { label: string; points: string[] }[] = [
  {
    label: "Definiciones",
    points: [
      "MicroTaller: práctico, ligado a un software, 1+ sesiones",
      "MicroEvento: divulgativo/reflexivo (conversatorio, ponencia, panel, debate…), normalmente 1 día",
    ],
  },
  {
    label: "Aforo",
    points: [
      "Mínimo 15 para no cancelar/reprogramar",
      "Presencial: limitado por el espacio físico",
      "Virtual (Meet): 35-100 según la versión Word ⚠ inconsistencia con el PDF",
    ],
  },
  {
    label: "Elegibilidad",
    points: ["Exclusiva para comunidad UNAL (correo institucional)", "Modalidades presencial y virtual — sin híbrida"],
  },
  {
    label: "Preinscripción / asistencia / constancias",
    points: [
      "Obligatoria en presencial (y, según el Word, también en virtual)",
      "Constancia solo para presencial",
      "Virtual: no se valida asistencia individual",
    ],
  },
  {
    label: "Evaluación y memoria institucional",
    points: [
      "Grabación obligatoria de toda sesión",
      "Encuesta de satisfacción: mostrarla obligatorio, diligenciarla opcional",
      "Grabaciones alimentan la formación de nuevos monitores",
    ],
  },
  {
    label: "Roles y plantillas",
    points: [
      "Monitor Máster: envía correos de cupo (admitidos/no admitidos)",
      "Unidad: formularios, piezas de difusión, reunión virtual, constancias",
    ],
  },
];

export const PROXIMOS_PASOS: string[] = [
  "Validar el diagnóstico y cerrar el manual (conciliar aforo virtual, decidir la modalidad híbrida)",
  "Elegir 2-3 acciones de alto impacto y bajo costo para 2026-2, no todas a la vez",
  "Usar la evidencia de demanda/satisfacción para destrabar Extensión Solidaria ante Vicedecanatura",
];
