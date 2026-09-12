/** Contenido del "Diagnóstico DOFA — Área de Estrategias Tecnológicas (UIFCE)",
 *  elaborado por César Díaz S. (última actualización: septiembre de 2026).
 *  Es un documento fijo (diagnóstico fechado, con autor y fuentes citadas), no
 *  una lista editable en el día a día como la línea gráfica o el checklist —
 *  por eso vive como datos estáticos y no como modelo de Prisma. Ver la
 *  versión completa en el .docx entregado (`Diagnostico_DOFA_ET_UIFCE.docx`). */

export type DofaItem = { text: string; source?: string };

export const DOFA_META = {
  elaboradoPor: "César Díaz S. (equipo de Estrategias Tecnológicas, UIFCE)",
  ultimaActualizacion: "Septiembre de 2026",
  director: "profesor Henry Martínez Sarmiento",
  objetivo:
    "Diagnóstico DOFA construido a partir de los tres informes de gestión más recientes del área (2025-I, 2025-II, 2026-I), las bases de datos que soportan sus tableros de Power BI (BBDD Dashboard Final 2025-I, Datos Power BI 2026-I), el Manual de MicroTalleres y MicroEventos (versión PDF «Monitor Máster» y versión Word «Manual Microtaller», ambas de 2026) y el documento «Formatos de correos de confirmación de cupo a microtalleres o microeventos». Enfocado en el rol del área dentro de la FCE: público natural (Economía, Contaduría Pública, Administración de Empresas), relación con Decanatura/Vicedecanatura/Comunicaciones, y aporte a la identidad y visibilidad de la UIFCE dentro de la Facultad. Los .pbix no se procesaron directamente (binarios propietarios de Power BI); su información subyacente está en los .xlsx citados. Cada hallazgo cita el informe o documento de origen.",
};

export const FORTALEZAS: DofaItem[] = [
  {
    text: "Alta satisfacción en los MicroTalleres que sí se ejecutan: en 2026-I, sobre 68 respuestas de percepción, promedios de 4,72/5 (dominio técnico), 4,66/5 (aplicabilidad), 4,54/5 (expectativas y aprendizaje).",
    source: "Datos Power BI 2026-I, hoja Percepción",
  },
  {
    text: "Demanda que supera la capacidad instalada: «Macros en Excel» (2025-I) tuvo 80 inscritos para 40 cupos (200%); en 2026-I, 10 MicroTalleres con 267 inscritos/admitidos.",
    source: "BBDD Dashboard Final 2025-I; Informe 2026-I",
  },
  {
    text: "Estandarización reciente: el Manual de MicroTalleres y MicroEventos (2026) define con precisión ambos formatos, fija aforo mínimo de 15 personas, distingue reglas de preinscripción/asistencia/constancia por modalidad, exige encuesta de evaluación y grabación obligatoria para memoria institucional, y asigna roles diferenciados monitor/Unidad — cierra el vacío de «ficha de términos y condiciones» señalado en 2025-II.",
    source: "Manual de MicroTalleres y MicroEventos, 2026; Informe 2026-I",
  },
  {
    text: "Política explícita de consecuencias por inasistencia: las plantillas oficiales de correo de confirmación de cupo advierten que quien sea admitido y no asista no recibirá grabación ni material, resolviendo la falta de claridad sobre penalizaciones señalada en 2025-II; el envío de estos correos (admitidos y no admitidos) queda asignado formalmente al monitor Máster.",
    source: "Formatos de correos de confirmación de cupo, 2026; Informe 2025-II",
  },
  {
    text: "Difusión con apoyo formal de la Facultad: además de Instagram, la difusión de MicroTalleres/MicroEventos cuenta con apoyo del área de Comunicaciones de la Facultad mediante correo masivo.",
    source: "Manual Microtaller — versión Word, 2026",
  },
  {
    text: "Salto en estrategia digital: 11 «hacks informáticos» (23.029 vistas, 526 likes) y 25 reels (83.649 vistas, 2.323 interacciones) en Instagram; LinkedIn reactivado (7 publicaciones, 1.491 impresiones, 42 reacciones).",
    source: "Informe 2026-I",
  },
  {
    text: "Canales oficializados institucionalmente (Instagram y LinkedIn vía Oficina de Medios Digitales UNAL).",
    source: "Informe 2025-II",
  },
  {
    text: "Público natural cautivo en la FCE: en 2025-I, Economía (27), Contaduría (25) y Administración (13) concentraron la mayoría de 80 inscritos.",
    source: "BBDD Dashboard Final 2025-I",
  },
  {
    text: "Liderazgo con perfil gerencial afín: el director, profesor Henry Martínez Sarmiento, administrador de empresas y magíster en Administración UNAL, profesor asociado, exdirector de proyectos de virtualización y consultor empresarial.",
  },
  {
    text: "Trazabilidad de la gestión: informes semestrales sistemáticos con dificultades, propuestas y proyectos a continuar.",
  },
];

export const DEBILIDADES: DofaItem[] = [
  {
    text: "Equipo de diseño de una sola persona, sin dominio técnico garantizado (en 2025-I, monitor de Arquitectura).",
    source: "Informes 2025-I, 2025-II",
  },
  {
    text: "Sin licencias oficiales de software (depende de licencias personales de Adobe/Canva) y equipo UIFCE-08 insuficiente.",
    source: "Informes 2025-I, 2025-II",
  },
  {
    text: "Brecha inscripción→asistencia real: 267 inscritos/admitidos vs. ~139 asistentes reales (~52%) en 2026-I, agravado por paro académico.",
    source: "Informe 2026-I; Datos Power BI 2026-I",
  },
  {
    text: "Restricción crítica de espacios físicos: 3 salas del Ed. 310 copadas por Escuelas/profesores; solo Sala 6 (Ed. 238, 16 equipos) disponible.",
    source: "Informe 2025-I",
  },
  {
    text: "Baja disponibilidad de monitores para dictar MicroTalleres (solo 1 ejecutado en 2025-I).",
    source: "Informe 2025-I",
  },
  {
    text: "Gestión del conocimiento desorganizada en el Drive de la Unidad, persistente entre semestres.",
    source: "Informes 2025-I, 2025-II",
  },
  {
    text: "Riesgos de gobernanza: LinkedIn oficializado con cuenta personal; YouTube tardó semestres en resolver propiedad institucional.",
    source: "Informes 2025-I, 2025-II",
  },
  { text: "Brandbook desactualizado (2021).", source: "Informes 2025-I, 2025-II" },
  {
    text: "Extensión Solidaria estancada: 271 de 275 colegios contactados sin respuesta (98,5%); pausada repetidamente por trámites con Decanatura; aún sin aval de Vicedecanatura en 2026-I.",
    source: "Informe 2025-I; BBDD Dashboard Final 2025-I; Informe 2026-I",
  },
  {
    text: "Eventos insignia con baja convocatoria: Hackatón cancelada en 2025-II por baja inscripción.",
    source: "Informe 2025-II",
  },
  { text: "Modelo operativo dependiente de estudiantes auxiliares, sin planta fija." },
  {
    text: "Versiones del manual sin conciliar: el PDF dice que en modalidad virtual (lives) no hay máximo de asistentes; la versión Word fija para Meet un mínimo de 35 y máximo de 100 — conviene unificar antes de publicar el manual como definitivo.",
    source: "Manual PDF vs. Manual Word, 2026",
  },
  {
    text: "El manual vigente descarta justo la modalidad que el área quiere potenciar: tanto el PDF como el Word del manual son explícitos en que «no se contempla la modalidad híbrida», mientras el informe 2026-I recomienda como línea prioritaria «fortalecer la oferta de microtalleres virtuales o híbridos» — el manual, tal como está redactado, no habilita esa recomendación.",
    source: "Manual de MicroTalleres y MicroEventos, 2026; Informe 2026-I",
  },
];

export const OPORTUNIDADES: DofaItem[] = [
  { text: "Semana de Investigación FCE / futura Semana UIFCE (2026-2).", source: "Informes 2025-II, 2026-I" },
  {
    text: "Alianza creciente con Comunicaciones e Imagen Institucional (micrositio, Blog UIFCE, carteleras validados conjuntamente en 2026-I).",
    source: "Informe 2026-I",
  },
  {
    text: "Convocatorias de extensión y proyectos estudiantiles de la Universidad para destrabar Extensión Solidaria.",
    source: "Informes 2025-I, 2025-II, 2026-I",
  },
  { text: "Red de contactos empresariales del Director para Hackatón y financiamiento externo." },
  {
    text: "Demanda no satisfecha de tecnología aplicada a ciencias económicas (SAP, Odoo, Quickbooks, Salesforce, Power BI/Tableau, Power Automate, Blockchain, IA).",
    source: "Informes 2025-II, 2026-I; Datos Power BI 2026-I",
  },
  {
    text: "Modalidad virtual como palanca de escala: ya está reglamentada en el manual (aforo, preinscripción, grabación), por lo que puede escalarse de inmediato sin depender de más salas.",
    source: "Informe 2026-I; Manual de MicroTalleres y MicroEventos, 2026",
  },
];

export const AMENAZAS: DofaItem[] = [
  { text: "Alta dependencia de avales externos (Vicedecanatura/Decanatura) para Extensión Solidaria.", source: "Informe 2025-I" },
  { text: "Factores institucionales imprevisibles (paro académico 2026-I).", source: "Informe 2026-I" },
  { text: "Competencia interna por espacios físicos con Escuelas y profesores.", source: "Informe 2025-I" },
  { text: "Alcance orgánico limitado sin presupuesto de pauta.", source: "Informe 2025-I" },
  { text: "Alianzas externas poco confiables (ej. Fundación VGB suspendida en 2025).", source: "Informe 2025-I" },
  {
    text: "Baja respuesta del público objetivo de Extensión Solidaria (98,5% sin respuesta).",
    source: "BBDD Dashboard Final 2025-I",
  },
  { text: "Rotación estructural de monitores (Junior, Ad honorem, Máster)." },
  {
    text: "Restricciones normativas internas sobre dinámicas lúdicas: el manual advierte que formatos como trivias o bingos en MicroEventos deben ajustarse a recomendaciones del área de Bienestar Universitario.",
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

export const CRUCE_ESTRATEGICO: { code: "FO" | "DO" | "FA" | "DA"; title: string; text: string }[] = [
  {
    code: "FO",
    title: "Fortalezas + Oportunidades",
    text: "Posicionar a la UIFCE como puente universidad-empresa (red del Director + demanda de MicroTalleres); escalar la Semana UIFCE con el Manual de MicroTalleres y el crecimiento en redes.",
  },
  {
    code: "DO",
    title: "Debilidades + Oportunidades",
    text: "Resolver licencias/marca vía Comunicaciones e Imagen Institucional; dar continuidad presupuestal a Extensión Solidaria vía convocatorias estudiantiles; cerrar el manual (conciliar aforo virtual y validar dinámicas lúdicas con Bienestar) antes de socializarlo como definitivo.",
  },
  {
    code: "FA",
    title: "Fortalezas + Amenazas",
    text: "Argumentar con evidencia de satisfacción/demanda ante Decanatura/Vicedecanatura para más prioridad en salas; blindar el conocimiento frente a la rotación con la documentación ya sistemática.",
  },
  {
    code: "DA",
    title: "Debilidades + Amenazas",
    text: "Priorizar modalidad virtual (ya reglamentada) para aliviar la restricción de espacio, y decidir explícitamente si se actualiza el manual para habilitar también la modalidad híbrida que recomienda el informe 2026-I; profesionalizar la convocatoria del monitor de diseño (perfil + prueba técnica).",
  },
];

export const PARAMETROS_OPERATIVOS: { label: string; text: string }[] = [
  {
    label: "Definiciones",
    text: "MicroTaller = práctico, ligado a un software, 1+ sesiones. MicroEvento = divulgativo/reflexivo (conversatorio, ponencia, panel, debate, presentación de proyectos, dinámicas participativas), normalmente 1 día.",
  },
  {
    label: "Aforo",
    text: "Mínimo 15 para no cancelar/reprogramar; presencial limitado por el espacio físico; virtual por Meet, entre 35 y 100 según la versión Word (ver inconsistencia en Debilidades).",
  },
  {
    label: "Elegibilidad",
    text: "Exclusiva para comunidad UNAL, verificable por correo institucional; modalidades presencial y virtual, sin híbrida (ver tensión con el informe 2026-I).",
  },
  {
    label: "Preinscripción / asistencia / constancias",
    text: "Obligatoria en presencial (y, según la versión Word, también en virtual); constancia solo para presencial; en virtual no se valida asistencia individual.",
  },
  {
    label: "Evaluación y memoria institucional",
    text: "Grabación obligatoria de toda sesión + encuesta de satisfacción (mostrarla obligatorio, diligenciarla opcional); las grabaciones alimentan la formación de nuevos monitores.",
  },
  {
    label: "Roles y plantillas",
    text: "El monitor Máster envía los correos de confirmación de cupo (admitidos/no admitidos) y recibe un recordatorio de logística de la Unidad; la Unidad gestiona formularios, piezas de difusión, la reunión virtual y las constancias.",
  },
];

export const PROXIMOS_PASOS: string[] = [
  "Validar el diagnóstico y cerrar el manual: socializarlo con el equipo y el profesor Henry Martínez, conciliar las cifras de aforo virtual entre las dos versiones del manual, y decidir si se habilita la modalidad híbrida hoy descartada.",
  "Elegir 2-3 acciones de alto impacto y bajo costo para 2026-2 (p. ej., MicroTalleres virtuales + licencias de diseño con Comunicaciones), en lugar de abordar todas las debilidades a la vez.",
  "Usar la evidencia de demanda y satisfacción para destrabar Extensión Solidaria ante Vicedecanatura.",
];
