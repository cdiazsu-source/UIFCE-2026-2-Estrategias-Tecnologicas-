/** Cruce estratégico entre el Diagnóstico DOFA (`dofa-data.ts`) y el
 *  portafolio de proyectos vigente (`planeacion/planeacion_del_area.csv`),
 *  agrupado por tema en vez de hallazgo por hallazgo — así una fortaleza, una
 *  debilidad y una oportunidad que hablan de lo mismo (ej. MicroTalleres)
 *  quedan juntas, con el mismo criterio de claridad ejecutiva que el resto
 *  del panel.
 *
 *  Contenido en bullets cortos a propósito (una idea por línea, sin prosa de
 *  transición): esto se muestra en una capa a pantalla completa pensada para
 *  exponer, no para leer de corrido.
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

/** Un hallazgo condensado del DOFA, ya atribuido a su cuadrante — para que la
 *  tarjeta pinte un punto de color por bullet en vez de repetir "F ·" / "D ·"
 *  como texto. */
export type QuadrantFinding = { quadrant: DofaQuadrantKey; text: string };

export type StrategicTheme = {
  id: string;
  title: string;
  /** Un hallazgo por cuadrante involucrado, ya condensado a una línea. */
  findings: QuadrantFinding[];
  /** Proyectos vigentes del portafolio que ya atienden el tema (título tal
   *  como aparece en `planeacion_del_area.csv`). Vacío si es un vacío puro. */
  projects: string[];
  status: CoverageStatus;
  /** La palanca tecnológica concreta, en 1-2 bullets — no la gestión
   *  administrativa alrededor. */
  action: string[];
};

export const STRATEGIC_INTRO: string[] = [
  "Qué dice el DOFA, hallazgo por cuadrante (F · D · O · A)",
  "Qué proyecto del portafolio 2026-2 ya lo atiende",
  "Dónde no hay proyecto, la iniciativa nueva que lo resolvería — con enfoque tecnológico",
];

export const STRATEGIC_THEMES: StrategicTheme[] = [
  {
    id: "microtalleres",
    title: "MicroTalleres y MicroEventos",
    findings: [
      { quadrant: "F", text: "Calidad probada (4,72/5) y demanda que duplica cupos: 267 inscritos en 2026-I" },
      { quadrant: "D", text: "~52% de asistencia real; el Manual descarta la híbrida y desalinea el aforo virtual" },
      { quadrant: "O", text: "Modalidad virtual ya reglamentada — lista para escalar sin más salas" },
      { quadrant: "A", text: "MicroEventos lúdicos sujetos a aval de Bienestar Universitario" },
    ],
    projects: ["Microtalleres UIFCE", "Cierre de Términos y Condiciones de Estrategias Tecnológicas"],
    status: "partial",
    action: ["Un solo formulario de preinscripción que fije modalidad y aforo — no dos manuales que se contradicen"],
  },
  {
    id: "redes",
    title: "Redes sociales y contenido digital",
    findings: [
      { quadrant: "F", text: "23.029 vistas en Instagram + LinkedIn reactivado (2026-I)" },
      { quadrant: "D", text: "Canales aún atados a cuentas o gestiones personales (LinkedIn, histórico de YouTube)" },
      { quadrant: "A", text: "Sin presupuesto de pauta: el alcance depende solo del contenido" },
    ],
    projects: [
      "Recuperación o recreación de la cuenta de Instagram @uifce_un",
      "Posicionamiento prioritario de LinkedIn UIFCE",
      "Creación de la cuenta de TikTok UIFCE",
      "Consolidación y cierre de oficialización de YouTube UIFCE",
      "Repositorio de Hacks Informáticos",
    ],
    status: "covered",
    action: ["Oficializar cada cuenta ante Medios Digitales UNAL; el formato corto sustituye la pauta que falta"],
  },
  {
    id: "extension-solidaria",
    title: "Extensión Solidaria",
    findings: [
      { quadrant: "D", text: "271/275 colegios sin respuesta (98,5%), sin aval de Vicedecanatura" },
      { quadrant: "O", text: "Convocatorias de extensión y proyectos estudiantiles no dependen de ese aval" },
      { quadrant: "A", text: "Depende de avales externos que no llegan" },
    ],
    projects: ["Extensión Solidaria"],
    status: "covered",
    action: ["Usar el 98,5% de no-respuesta como evidencia cuantitativa ante Decanatura"],
  },
  {
    id: "liderazgo-alianzas",
    title: "Liderazgo y alianzas empresariales",
    findings: [
      { quadrant: "F", text: "Director con perfil y red empresarial afines al área" },
      { quadrant: "O", text: "Esa red hoy solo se usa para la Hackatón" },
      { quadrant: "A", text: "Alianzas externas sin trayectoria pueden fallar (antecedente: Fundación VGB, 2025)" },
    ],
    projects: ["Red de Aliados Académicos UIFCE"],
    status: "partial",
    action: ["Priorizar la Red de Aliados Académicos (hoy en Backlog) con criterios de verificación explícitos"],
  },
  {
    id: "memoria-continuidad",
    title: "Memoria institucional y continuidad del equipo",
    findings: [
      { quadrant: "F", text: "Informes semestrales sistemáticos ya dejan trazabilidad" },
      { quadrant: "D", text: "Drive desorganizado; operación depende de auxiliares sin planta fija" },
      { quadrant: "A", text: "Rotación estructural + riesgos externos (paro académico 2026-I) borran avance" },
    ],
    projects: [
      "Repositorio documental permanente de Estrategias Tecnológicas",
      "Propuesta de reorganización del Drive UIFCE ante Gestión del Conocimiento (GC)",
      "Memorias UIFCE 2026-2S",
      "Memoria institucional audiovisual del equipo y del semestre 2026-2S",
    ],
    status: "partial",
    action: ["Checklist de empalme por rol + video-tutoriales cortos (ya se graban por obligación)"],
  },
  {
    id: "comunicaciones",
    title: "Alianza con Comunicaciones e Imagen Institucional",
    findings: [
      { quadrant: "F", text: "Difusión de MicroTalleres ya usa el correo masivo de Comunicaciones" },
      { quadrant: "O", text: "Alianza ampliada en 2026-I: micrositio, Blog UIFCE y carteleras" },
    ],
    projects: ["Carteleras UIFCE (física y digital)", "Micrositio UIFCE", "Blog UIFCE"],
    status: "covered",
    action: ["Validar cada pieza con Comunicaciones antes de publicar, no después"],
  },
  {
    id: "identidad-licencias",
    title: "Identidad visual y licencias de software",
    findings: [
      { quadrant: "D", text: "Brandbook sin actualizar desde 2021" },
      { quadrant: "D", text: "Sin licencias oficiales de diseño (Adobe/Canva personales); equipo UIFCE-08 insuficiente" },
    ],
    projects: [],
    status: "gap",
    action: ["Ningún proyecto vigente lo cubre — ver las iniciativas nuevas"],
  },
  {
    id: "hackaton-semana",
    title: "Semana UIFCE y Hackatón Bizagi",
    findings: [
      { quadrant: "D", text: "Hackatón cancelada en 2025-II por baja inscripción" },
      { quadrant: "O", text: "Semana UIFCE es la plataforma para relanzarla en 2026-2" },
    ],
    projects: [
      "Semana UIFCE — primera edición",
      "Hackatón Bizagi UIFCE: Optimización y Simulación de Procesos Empresariales",
    ],
    status: "covered",
    action: ["La causa de fondo de 2025-II (baja inscripción) sigue sin respuesta explícita — tema pendiente"],
  },
  {
    id: "espacios",
    title: "Espacios físicos",
    findings: [
      { quadrant: "D", text: "Solo la Sala 6 disponible (16 equipos), sin dato más reciente" },
      { quadrant: "A", text: "El área compite en desventaja por salones frente a Escuelas" },
    ],
    projects: [],
    status: "partial",
    action: ["Absorber la demanda con la modalidad virtual (tema MicroTalleres) + el tracker de Sala 1 ya construido"],
  },
  {
    id: "tecnologia-aplicada",
    title: "Tecnología aplicada (demanda empresarial)",
    findings: [
      { quadrant: "O", text: "Demanda no satisfecha: SAP, Odoo, Salesforce, Power BI, Power Automate, Blockchain, IA" },
    ],
    projects: ["Repositorio de material con IA y automatización de producción de video"],
    status: "partial",
    action: ["La Hackatón Bizagi ya responde (Bizagi = BPM); el resto alimenta el catálogo de próximos MicroTalleres"],
  },
];

export type ProposedInitiative = {
  id: string;
  title: string;
  fromThemeId: string;
  /** Qué hacer, en 1 bullet. */
  what: string;
  /** Por qué es una palanca tecnológica, en 1 bullet. */
  why: string;
};

/** Iniciativas nuevas: solo para los temas que el portafolio actual no cubre
 *  (status "gap"/"partial" arriba). No se inventan proyectos donde ya hay uno vigente. */
export const PROPOSED_INITIATIVES: ProposedInitiative[] = [
  {
    id: "modalidad-hibrida",
    title: "Piloto de modalidad híbrida para MicroTalleres",
    fromThemeId: "microtalleres",
    what: "Probar transmisión simultánea presencial + virtual en un MicroTaller",
    why: "Un formulario único fija modalidad y aforo — resuelve la inconsistencia del Manual",
  },
  {
    id: "empalme-continuidad",
    title: "Programa de empalme y continuidad de talento",
    fromThemeId: "memoria-continuidad",
    what: "Checklist de empalme por rol + biblioteca corta de video-tutoriales",
    why: "Un monitor nuevo se autoforma sin depender de una transición verbal con quien se va",
  },
  {
    id: "brandbook-2026",
    title: "Actualización del Brandbook UIFCE 2026",
    fromThemeId: "identidad-licencias",
    what: "Reemplazar el brandbook de 2021 con la página «Línea gráfica» como documento vivo",
    why: "Una guía que vive en la app no se desactualiza en silencio: cambia con un commit, no con un PDF olvidado",
  },
  {
    id: "gestion-licencias",
    title: "Gestión institucional de licencias de software",
    fromThemeId: "identidad-licencias",
    what: "Convertir el tracker de software de Sala 1 (Herramientas y licencias) en un reporte de brecha",
    why: "La evidencia para pedir presupuesto ya existe en la app — falta solo presentarla como faltante",
  },
];
