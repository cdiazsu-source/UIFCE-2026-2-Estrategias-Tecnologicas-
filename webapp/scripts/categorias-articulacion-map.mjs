/**
 * Nueva clasificación de proyectos (líneas de trabajo y categorías «Articulación con …»).
 * Fuente única para el script de migración a la BD y para la reescritura de los CSV.
 * Debe coincidir con webapp/src/lib/category-groups.ts.
 *
 * Regla: se decide por proyecto (id), porque la categoría vieja sola no basta
 * («Proyectos estratégicos» y «Acompañamiento interárea» se reparten en varios destinos).
 * Si un id no está aquí, se usa el nombre antiguo (OLD_NAME_TO_NEW); si tampoco, queda «sin regla».
 */

const CL = "Articulación con Cursos Libres";
const AA = "Articulación con Apoyos Académicos";
const DS = "Articulación con Desarrollo";
const VIRT = "Articulación con Virtualización";
const COORD = "Articulación con Coordinación";
const TRANSV = "Articulación transversal";
const PROD = "Producción de contenido";
const CART = "Carteleras y pantallas";
const CANAL = "Canales digitales";
const EVT = "Eventos y formación";
const ALIAN = "Alianzas y comunidad";
const DOC = "Documentación y memoria";
const NORM = "Normativa y cumplimiento";
const MEJ = "Mejora de procesos";

export const NEW_CATEGORY_BY_ID = {
  // Articulación interna
  "cursoslibres-linea-grafica": CL,
  "cursoslibres-piezas-primer-lanzamiento": CL,
  "cursoslibres-pieza-audiovisual-aplicativo": CL,
  "cursoslibres-piezas-lanzamiento-especial": CL,
  "aa-pieza-audiovisual-docentes": AA,
  "aa-cartelera-fisica": AA,
  "ds-solicitudes-uifce-tarjetas": DS,
  "virtualizacion-poster-encuesta-automatizacion": VIRT,
  "interarea-plantillas-powerpoint-aa-cl": COORD,
  "interarea-infografia-puntualidad": COORD, // provisional: el CSV no dice quién la pidió
  "acompanamiento-interarea": TRANSV,
  // Comunicación
  "produccion-senaletica-salas": CART,
  "produccion-carteleras": CART,
  "estrategicos-boletin-digital": CANAL,
  "continuidad-blog": CANAL,
  "continuidad-micrositio": CANAL,
  "micrositio-equipo-de-trabajo": CANAL,
  "micrositio-ex-monitores": CANAL,
  // Eventos y vinculación
  "eventos-semana-uifce": EVT,
  "eventos-microtalleres": EVT,
  "estrategicos-extension-solidaria": ALIAN,
  "estrategicos-red-aliados-academicos": ALIAN,
  "estrategicos-divulgacion-primeros-semestres": ALIAN,
  "redes-rastreo-contactos-empresas": ALIAN,
  "estrategicos-tracker-egresados-uifce": ALIAN,
  // Gestión interna (los de «Documentación», «Normativa» e «Innovación» salen por nombre antiguo)
  "et-en-marcha": MEJ,
  // Revisión de categorías (2026-11-12). Lo que pide Coordinación va a «Articulación con Coordinación»,
  // sea cual sea el formato; el resto se ajustó a la definición de cada categoría.
  "produccion-capsulas-tecnologia-pantallas": COORD,
  "video-tutorial-para-el-aplicativo-programacion-de-salones": COORD,
  "pagina-permanente-de-oferta-de-eventos": CANAL, // es una página web de ET, no un evento
  "canal-oficial-de-atencion-virtual-via-whatsapp-business-uifc": CANAL, // canal de cara al usuario
  "correo-institucional-unificado-de-redes-comunicaciones-y-eve": MEJ, // herramienta interna de gestión
  "innovacion-experiencia-nfc-uifce": PROD, // experiencia audiovisual para el público, no un proceso interno
  // Es ET pidiéndole algo a Gestión del Conocimiento (no apoyándola): va a Documentación.
  "documentacion-propuesta-drive-gc": DOC,
};

/** Categorías vigentes de la nueva clasificación: lo que ya esté en una de ellas no se toca. */
export const CURRENT_CATEGORIES = new Set([
  "Articulación con Apoyos Académicos",
  "Articulación con Cursos Libres",
  "Articulación con Desarrollo",
  "Articulación con Gestión del Conocimiento",
  "Articulación con Virtualización",
  "Articulación con Coordinación",
  "Articulación transversal",
  "Producción de contenido",
  "Carteleras y pantallas",
  "Canales digitales",
  "Eventos y formación",
  "Alianzas y comunidad",
  "Documentación y memoria",
  "Normativa y cumplimiento",
  "Mejora de procesos",
]);

/** Respaldo cuando el id no está arriba: categoría antigua (sin sufijo de urgencia) -> categoría nueva. */
export const OLD_NAME_TO_NEW = {
  "Producción de contenido": PROD,
  "Redes y canales": CANAL,
  "Eventos": EVT,
  "Eventos / Proyectos estratégicos": EVT,
  "Documentación y memoria institucional": DOC,
  "Normativa": NORM,
  "Innovación y eficiencia operativa": MEJ,
  "Acompañamiento a Cursos Libres": CL,
  "Acompañamiento a Apoyos Académicos": AA,
  "Acompañamiento a Apoyos académicos": AA,
  "Acompañamiento a Apoyos Académicos.": AA,
  "Acompañamiento a Virtualización": VIRT,
  "Acompañamiento a Desarrollo": DS,
};

/** Categoría nueva de un proyecto, o null si no hay regla. `oldCategory` puede traer el sufijo « — urgencia». */
export function newCategoryFor(id, oldCategory) {
  if (NEW_CATEGORY_BY_ID[id]) return NEW_CATEGORY_BY_ID[id];
  // Ya está en una categoría vigente (p. ej. el seed la reclasificó, o se creó así en la app): se respeta.
  if (CURRENT_CATEGORIES.has(String(oldCategory ?? "").trim())) return String(oldCategory).trim();
  const base = String(oldCategory ?? "").split(" — ")[0].trim();
  if (CURRENT_CATEGORIES.has(base)) return base;
  return OLD_NAME_TO_NEW[base] ?? null;
}
