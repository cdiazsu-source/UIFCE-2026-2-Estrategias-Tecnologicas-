/** Contenido del "Diagnóstico DOFA — Área de Estrategias Tecnológicas (UIFCE)",
 *  elaborado por César Díaz S. (última actualización: septiembre de 2026).
 *  Es un documento fijo (diagnóstico fechado, con autor y fuentes citadas), no
 *  una lista editable en el día a día como la línea gráfica o el checklist —
 *  por eso vive como datos estáticos y no como modelo de Prisma. Formato de
 *  bullets concisos (dato + cifra), pensado para lectura en presentación
 *  corporativa, no en prosa.
 *
 *  Cada hallazgo trae un `period`: el semestre de la fuente que lo sustenta.
 *  El reporte prioriza 2026-I (el semestre inmediatamente anterior a
 *  2026-2S) y lo estructural/vigente; lo de 2025-I y 2025-II queda como
 *  antecedente al final de cada cuadrante — visible para tener memoria del
 *  área, pero no al frente como si fuera el diagnóstico actual. Un hallazgo
 *  de un semestre anterior que ya no aplica (una persona que ya no está, algo
 *  que un dato más reciente contradice) se retira o se marca como superado en
 *  vez de dejarlo como si describiera hoy.
 *
 *  Ver la versión completa en el .docx entregado (`Diagnostico_DOFA_ET_UIFCE.docx`). */

export type DofaPeriod = "2026-I" | "Estructural" | "2025-II" | "2025-I";

/** `thesis`: la lectura/interpretación del hallazgo — qué implica para la
 *  estrategia del área, no solo el dato. Es la síntesis, el dato bruto es
 *  `text`. */
export type DofaItem = { text: string; source?: string; period: DofaPeriod; thesis: string };

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

/** Contraste explícito con el semestre inmediatamente anterior (2026-I) y,
 *  donde aplica, con 2025-II — el eje que pidió el diagnóstico. */
export const COMPARATIVO_SEMESTRAL: { indicador: string; antes: string; ahora: string }[] = [
  {
    indicador: "MicroTalleres ejecutados",
    antes: "2025-I: 1 ejecutado (baja disponibilidad de monitores)",
    ahora: "2026-I: 10 ejecutados, 267 inscritos/admitidos",
  },
  {
    indicador: "Instagram",
    antes: "2025-I/2025-II: sin formato de contenido corto propio",
    ahora: "2026-I: 11 hacks informáticos (23.029 vistas) + 25 reels (83.649 vistas)",
  },
  {
    indicador: "LinkedIn",
    antes: "Canal poco activo",
    ahora: "2026-I: reactivado — 7 publicaciones, 1.491 impresiones, 42 reacciones",
  },
  {
    indicador: "Hackatón",
    antes: "2025-II: cancelada por baja inscripción",
    ahora: "2026-2S: retomada («Hackatón Bizagi UIFCE», proyecto en curso)",
  },
];

export const FORTALEZAS: DofaItem[] = [
  {
    text: "MicroTalleres ejecutados: 4,72/5 dominio técnico · 4,66/5 aplicabilidad · 4,54/5 expectativas (68 respuestas)",
    source: "Datos Power BI 2026-I, hoja Percepción",
    period: "2026-I",
    thesis: "La calidad del formato ya está probada — el cuello de botella es la cobertura, no el diseño del programa.",
  },
  {
    text: "Demanda > capacidad: «Macros en Excel» 80 inscritos / 40 cupos (200%, 2025-I); 2026-I: 267 inscritos en 10 MicroTalleres",
    source: "BBDD Dashboard Final 2025-I; Informe 2026-I",
    period: "2026-I",
    thesis: "La demanda insatisfecha es la señal más clara de que escalar, no solo mantener, debe ser la prioridad de 2026-2.",
  },
  {
    text: "Manual de MicroTalleres y MicroEventos (2026): aforo mínimo 15, reglas por modalidad, evaluación y grabación obligatorias, roles monitor/Unidad definidos",
    source: "Manual de MicroTalleres y MicroEventos, 2026; Informe 2026-I",
    period: "2026-I",
    thesis: "La estandarización reciente convierte la organización de MicroTalleres en un proceso repetible, no en el criterio de cada monitor.",
  },
  {
    text: "Instagram: 11 hacks (23.029 vistas, 526 likes), 25 reels (83.649 vistas, 2.323 interacciones); LinkedIn: 7 publicaciones, 1.491 impresiones, 42 reacciones",
    source: "Informe 2026-I",
    period: "2026-I",
    thesis: "El salto digital confirma que el contenido corto (hacks/reels) es el formato que mejor conecta con la audiencia de la FCE.",
  },
  {
    text: "Director con perfil afín: administrador de empresas, magíster UNAL, exdirector de virtualización, consultor empresarial",
    period: "Estructural",
    thesis: "El liderazgo tiene el perfil y la red para abrir puertas empresariales que el área por sí sola no alcanzaría.",
  },
  {
    text: "Informes semestrales sistemáticos: dificultades, propuestas y proyectos a continuar",
    period: "Estructural",
    thesis: "La trazabilidad ya instalada es la base para medir progreso real semestre a semestre, no solo percepción.",
  },
  {
    text: "Difusión con apoyo de Comunicaciones de la Facultad (correo masivo), además de Instagram",
    source: "Manual Microtaller — versión Word, 2026",
    period: "Estructural",
    thesis: "La difusión ya no depende solo de las redes propias del área, lo que reduce el riesgo de baja convocatoria.",
  },
  {
    text: "Instagram y LinkedIn oficializados institucionalmente (Oficina de Medios Digitales UNAL)",
    source: "Informe 2025-II",
    period: "2025-II",
    thesis: "La oficialización institucional protege los canales de quedar atados a una sola persona, como pasó con la cuenta que se perdió.",
  },
  {
    text: "Correos oficiales de cupo: sin asistencia no hay grabación ni material; envío a cargo del monitor Máster",
    source: "Formatos de correos de confirmación de cupo, 2026; Informe 2025-II",
    period: "2025-II",
    thesis: "La política de consecuencias por inasistencia le da al área una herramienta formal para mejorar la asistencia real.",
  },
  {
    text: "80 inscritos en 2025-I: Economía 27 · Contaduría 25 · Administración 13 (antecedente del público natural en la FCE)",
    source: "BBDD Dashboard Final 2025-I",
    period: "2025-I",
    thesis: "El público natural de la FCE es amplio y conocido — el reto no es conseguir audiencia, es tener cupos suficientes.",
  },
];

export const DEBILIDADES: DofaItem[] = [
  {
    text: "2026-I: 267 inscritos/admitidos vs. ~139 asistentes (~52%), agravado por paro académico",
    source: "Informe 2026-I; Datos Power BI 2026-I",
    period: "2026-I",
    thesis: "La demanda no se traduce en impacto real: cerca de la mitad de quienes se inscriben no llega a beneficiarse del MicroTaller.",
  },
  {
    text: "Extensión Solidaria: 271/275 colegios sin respuesta (98,5%); sin aval de Vicedecanatura en 2026-I",
    source: "Informe 2025-I; BBDD Dashboard Final 2025-I; Informe 2026-I",
    period: "2026-I",
    thesis: "El proyecto insignia de proyección social del área está bloqueado por fuera del área, no por falta de gestión propia.",
  },
  {
    text: "Manual descarta la modalidad híbrida que el informe 2026-I recomienda priorizar",
    source: "Manual de MicroTalleres y MicroEventos, 2026; Informe 2026-I",
    period: "2026-I",
    thesis: "El propio manual le cierra la puerta a la modalidad que el diagnóstico recomienda — hay que decidir esto antes de escalar.",
  },
  {
    text: "Operación dependiente de estudiantes auxiliares, sin planta fija",
    period: "Estructural",
    thesis: "Sin planta fija, cada semestre el área vuelve a empezar de cero en continuidad institucional.",
  },
  {
    text: "Aforo virtual sin conciliar: PDF sin máximo vs. Word 35-100 (Meet)",
    source: "Manual PDF vs. Manual Word, 2026",
    period: "Estructural",
    thesis: "Una inconsistencia de redacción, no de fondo, puede frenar la escala virtual si no se corrige antes de publicar el manual.",
  },
  {
    text: "Sin licencias oficiales (Adobe/Canva personales); equipo UIFCE-08 insuficiente — sin confirmación de que se haya resuelto en 2026-I",
    source: "Informes 2025-I, 2025-II",
    period: "2025-II",
    thesis: "La calidad del contenido depende de herramientas que no son del área: un riesgo de continuidad si esa licencia deja de estar disponible.",
  },
  {
    text: "Drive de la Unidad desorganizado, persistente entre semestres",
    source: "Informes 2025-I, 2025-II",
    period: "2025-II",
    thesis: "Sin una estructura de archivo estable, cada relevo de monitores pierde parte de lo ya construido.",
  },
  {
    text: "Gobernanza: LinkedIn con cuenta personal; YouTube tardó semestres en resolver propiedad institucional",
    source: "Informes 2025-I, 2025-II",
    period: "2025-II",
    thesis: "Los canales institucionales siguen dependiendo de cuentas personales: un riesgo de continuidad si esa persona se va.",
  },
  {
    text: "Brandbook desactualizado (2021), sin actualización reportada desde entonces",
    source: "Informes 2025-I, 2025-II",
    period: "2025-II",
    thesis: "Sin una guía de marca vigente, cada monitor de diseño termina interpretando la identidad visual a su criterio.",
  },
  {
    text: "Hackatón cancelada en 2025-II por baja inscripción — retomada en 2026-2S («Hackatón Bizagi UIFCE», en curso)",
    source: "Informe 2025-II",
    period: "2025-II",
    thesis: "La baja convocatoria de 2025-II es la razón de fondo para probar un formato o una difusión distinta en la edición retomada.",
  },
  {
    text: "Espacios: 3 salas del Ed. 310 copadas; solo Sala 6 disponible (Ed. 238, 16 equipos) — sin dato más reciente que confirme cambio",
    source: "Informe 2025-I",
    period: "2025-I",
    thesis: "La capacidad presencial del área depende de un solo salón: cualquier evento grande necesita otra modalidad.",
  },
  {
    text: "Solo 1 MicroTaller ejecutado en 2025-I por baja disponibilidad de monitores — superado en 2026-I (10 ejecutados)",
    source: "Informe 2025-I",
    period: "2025-I",
    thesis: "La disponibilidad de monitores fue el techo real de la oferta en 2025-I, más que la demanda o el espacio.",
  },
];

export const OPORTUNIDADES: DofaItem[] = [
  {
    text: "Semana de Investigación FCE → futura Semana UIFCE (2026-2)",
    source: "Informes 2025-II, 2026-I",
    period: "2026-I",
    thesis: "Un evento institucional ya existente es la plataforma más barata para lanzar la marca propia del área.",
  },
  {
    text: "Alianza con Comunicaciones e Imagen Institucional: micrositio, Blog UIFCE, carteleras (2026-I)",
    source: "Informe 2026-I",
    period: "2026-I",
    thesis: "Validar piezas junto con Comunicaciones reduce el riesgo de retrocesos, como el ajuste de color que pidieron en 2026-I.",
  },
  {
    text: "Convocatorias de extensión y proyectos estudiantiles para destrabar Extensión Solidaria",
    source: "Informes 2025-I, 2025-II, 2026-I",
    period: "2026-I",
    thesis: "Hay una vía de financiamiento y personal para Extensión Solidaria que no depende del aval de Decanatura.",
  },
  {
    text: "Demanda no satisfecha: SAP, Odoo, Quickbooks, Salesforce, Power BI/Tableau, Power Automate, Blockchain, IA",
    source: "Informes 2025-II, 2026-I; Datos Power BI 2026-I",
    period: "2026-I",
    thesis: "La brecha de formación en herramientas empresariales es el catálogo natural de los próximos MicroTalleres.",
  },
  {
    text: "Modalidad virtual ya reglamentada (aforo, preinscripción, grabación): escalable sin más salas",
    source: "Informe 2026-I; Manual de MicroTalleres y MicroEventos, 2026",
    period: "2026-I",
    thesis: "La reglamentación virtual ya existe: no hay que esperar más espacio físico para escalar cobertura.",
  },
  {
    text: "Red de contactos empresariales del Director (Hackatón, financiamiento externo)",
    period: "Estructural",
    thesis: "La relación del Director con el sector empresarial es un activo del área que hoy se usa poco fuera de la Hackatón.",
  },
];

export const AMENAZAS: DofaItem[] = [
  {
    text: "Factores institucionales imprevisibles (paro académico 2026-I)",
    source: "Informe 2026-I",
    period: "2026-I",
    thesis: "Los factores externos a la gestión del área pueden borrar en un semestre buena parte del avance logrado.",
  },
  {
    text: "Rotación estructural de monitores (Junior, Ad honorem, Máster)",
    period: "Estructural",
    thesis: "El conocimiento del área vive en personas de paso: sin documentación, se pierde con cada relevo.",
  },
  {
    text: "Dinámicas lúdicas sujetas a recomendaciones de Bienestar Universitario",
    source: "Manual Microtaller — versión Word, 2026",
    period: "Estructural",
    thesis: "La creatividad de los MicroEventos tiene un límite normativo que hay que validar antes, no después, de planearlos.",
  },
  {
    text: "Depende de avales externos (Vicedecanatura/Decanatura) para Extensión Solidaria — aún sin resolver en 2026-I",
    source: "Informe 2025-I",
    period: "2025-I",
    thesis: "Extensión Solidaria no avanza mientras la decisión siga fuera del control del área.",
  },
  {
    text: "Competencia interna por espacios físicos con Escuelas y profesores",
    source: "Informe 2025-I",
    period: "2025-I",
    thesis: "El área compite en desventaja por salones frente a Escuelas con más peso institucional.",
  },
  {
    text: "Alcance orgánico limitado, sin presupuesto de pauta",
    source: "Informe 2025-I",
    period: "2025-I",
    thesis: "Sin presupuesto de pauta, el crecimiento en redes depende por completo de la calidad y frecuencia del contenido.",
  },
  {
    text: "Alianzas externas poco confiables (ejemplo histórico: Fundación VGB suspendida en 2025)",
    source: "Informe 2025-I",
    period: "2025-I",
    thesis: "Depender de un tercero externo sin trayectoria puede dejar un proyecto varado, como ya pasó una vez.",
  },
  {
    text: "98,5% sin respuesta en el público objetivo de Extensión Solidaria (línea base, aún sin avance reportado)",
    source: "BBDD Dashboard Final 2025-I",
    period: "2025-I",
    thesis: "El problema de Extensión Solidaria no es solo el aval institucional: el público objetivo tampoco está respondiendo.",
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
