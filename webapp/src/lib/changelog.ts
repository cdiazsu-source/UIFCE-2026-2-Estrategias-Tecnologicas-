/** Historial de versiones de «ET en Marcha» (el «Resumen de versiones» de Desarrollador). Se escribe a mano, de la más nueva a la más
 *  antigua, en lenguaje claro para el equipo (qué cambió para quien usa la app, no qué archivos). Cada cambio o grupo de cambios que se
 *  publica suma una entrada ARRIBA: así la versión actual es siempre la primera. La versión es la fecha (AAAA.MM.DD) más un número
 *  de publicación del día (.1, .2…). Desarrollador muestra solo las últimas 10 (`CHANGELOG_SHOWN`). */

export type ChangeType = "NUEVO" | "MEJORA" | "CORRECCION";

export const CHANGE_TYPE_LABEL: Record<ChangeType, string> = { NUEVO: "Nuevo", MEJORA: "Mejora", CORRECCION: "Corrección" };

export type VersionEntry = {
  /** «AAAA.MM.DD.N». */
  version: string;
  /** Día de la publicación, «AAAA-MM-DD» (hora de Colombia). */
  date: string;
  title: string;
  changes: { type: ChangeType; text: string }[];
};

/** Cuántas versiones muestra Desarrollador. */
export const CHANGELOG_SHOWN = 10;

export const CHANGELOG: VersionEntry[] = [
  {
    version: "2026.10.23.8",
    date: "2026-10-23",
    title: "Reunión coordinación: resumen de cada proyecto",
    changes: [
      { type: "NUEVO", text: "Al tocar un proyecto en la presentación se abre un resumen corporativo con lo más importante: estado, responsable, avance, qué se hace y qué se espera, próximas subtareas y últimas novedades, con la plantilla asociada en grande (varias imágenes pasan solas y con flechas)." },
      { type: "MEJORA", text: "El botón «Ver proyecto» del resumen abre el proyecto y deja el botón flotante para volver a la presentación durante 30 segundos." },
    ],
  },
  {
    version: "2026.10.23.7",
    date: "2026-10-23",
    title: "Plantillas dentro de la página del proyecto",
    changes: [
      { type: "NUEVO", text: "Cada proyecto tiene un bloque «Plantillas»: muestra las plantillas enlazadas con su captura y sus piezas en un carrusel, y el botón que abre su enlace (Canva, Drive…)." },
      { type: "NUEVO", text: "Con perfil completo se enlazan o se quitan plantillas desde ese mismo bloque; las imágenes también salen en la tarjeta del proyecto en Reunión coordinación." },
    ],
  },
  {
    version: "2026.10.23.6",
    date: "2026-10-23",
    title: "Reunión coordinación: proyectos a la medida e imágenes de plantillas",
    changes: [
      { type: "NUEVO", text: "En el modo diseño, el máster agrega o quita proyectos en «Lo que entregamos», «En curso» y «En el próximo corte», y puede volver a la lista automática de cada sección." },
      { type: "NUEVO", text: "Cada proyecto puede enlazar plantillas: su captura y sus piezas salen como imagen mini en la tarjeta del proyecto, y si son varias se turnan con un fundido cada pocos segundos. Las imágenes también aparecen en los informes de reuniones guardadas." },
    ],
  },
  {
    version: "2026.10.23.5",
    date: "2026-10-23",
    title: "Reunión coordinación: portada, banner y regreso desde los proyectos",
    changes: [
      { type: "NUEVO", text: "Nueva página de portada con UIFCITO en grande y los integrantes del área con su foto, pintada con la paleta de UIFCITO." },
      { type: "NUEVO", text: "Banner permanente en todas las páginas de la presentación: escudo de la Unidad, nombre de la reunión, área y el máster a cargo con su foto." },
      { type: "NUEVO", text: "Al tocar un proyecto de la presentación se abre el proyecto y aparece un botón flotante «Volver a la reunión» durante 30 segundos, que regresa a la misma página." },
    ],
  },
  {
    version: "2026.10.23.4",
    date: "2026-10-23",
    title: "Tipo de enlace en las plantillas",
    changes: [
      { type: "NUEVO", text: "Al guardar una plantilla se elige de qué es su enlace (Canva, Drive, Figma, YouTube) o se escribe un nombre propio; el botón de la tarjeta dice «Abrir en Canva», «Abrir en Drive», etc." },
      { type: "MEJORA", text: "Si no se elige, la app lo reconoce por la dirección (Canva, Drive, Google Docs, Figma, YouTube, Dropbox, Notion). Los enlaces de las piezas también lo muestran." },
    ],
  },
  {
    version: "2026.10.23.3",
    date: "2026-10-23",
    title: "Piezas de un evento en Plantillas",
    changes: [
      { type: "NUEVO", text: "Cada plantilla puede guardar varias piezas: una imagen pequeña con su nombre y su enlace de Canva (por ejemplo, todas las piezas del lanzamiento especial de Cursos Libres). Se agregan varias imágenes a la vez, pegando o arrastrando." },
      { type: "NUEVO", text: "Las piezas se reordenan con un clic en las flechas de cada una. En la tarjeta se ven de una en una, con flechas (o ← → del teclado) para pasar de una a otra, su nombre, el botón que abre su enlace y miniaturas para saltar a cualquiera." },
    ],
  },
  {
    version: "2026.10.23.2",
    date: "2026-10-23",
    title: "Reunión coordinación: páginas, modo diseño e historial",
    changes: [
      { type: "NUEVO", text: "La presentación ahora tiene cinco páginas: una general con las cuatro partes y una página para cada una (lo que entregamos, en curso y bloqueos, en el próximo corte, notas y comentarios). Se pasa con los botones o con las flechas del teclado." },
      { type: "NUEVO", text: "Modo diseño: el máster cambia el título de cada página, agrega una nota y pone imágenes o GIFs tomados de las capturas de Plantillas (a la izquierda, a la derecha o a ancho completo, con pie de imagen)." },
      { type: "NUEVO", text: "Cada reunión se guarda con su fecha y queda como se presentó: en «Reuniones anteriores» se abre cualquiera de solo lectura." },
      { type: "MEJORA", text: "«Próximos 15 días» pasó a llamarse «En el próximo corte»." },
    ],
  },
  {
    version: "2026.10.23.1",
    date: "2026-10-23",
    title: "Reunión coordinación",
    changes: [
      { type: "NUEVO", text: "Nueva pantalla del máster «Reunión coordinación» para presentar a los líderes de área y a coordinación: lo que entregamos (con el estado real de cada proyecto), en curso y bloqueos, y lo de los próximos 15 días (proyectos en atención inmediata)." },
      { type: "NUEVO", text: "El máster agrega y quita los bloqueos desde la misma pantalla, y el botón «Presentar» la abre a pantalla completa, sin menú ni buscador." },
    ],
  },
  {
    version: "2026.10.22.15",
    date: "2026-10-22",
    title: "Post-it para quien elija el máster",
    changes: [
      { type: "NUEVO", text: "Al publicar el post-it, el máster elige si es para todos los Junior o solo para uno o varios (Junior Artes, Junior ET). Quien no es destinatario no lo ve ni en el panel ni en su pantalla de bienvenida." },
      { type: "MEJORA", text: "El bloque del post-it muestra para quién está vigente la nota." },
    ],
  },
  {
    version: "2026.10.22.14",
    date: "2026-10-22",
    title: "Panel del Junior: el post-it primero",
    changes: [
      { type: "MEJORA", text: "En el panel principal del Junior ya no aparecen El área, Situación actual, Objetivos del semestre ni Difusión y visibilidad; en su lugar va el post-it del máster." },
      { type: "MEJORA", text: "En «Integrantes», la tarjeta del propio Junior va primero, con su color, el borde resaltado y la marca «Tú»." },
    ],
  },
  {
    version: "2026.10.22.13",
    date: "2026-10-22",
    title: "Buscador en la barra superior",
    changes: [
      { type: "NUEVO", text: "Barra de búsqueda arriba de todas las pantallas: escribe una o varias palabras y encuentra módulos, proyectos, subtareas, notas de bitácora, proyectos de estudio, empresas de interés, plantillas y herramientas, agrupados por tipo. La tecla «/» la enfoca y se navega con las flechas y Enter." },
      { type: "MEJORA", text: "Cada perfil busca solo en lo que puede ver: un Junior encuentra únicamente su propio proyecto de estudio y no ve Calendario ni Desarrollador entre los módulos." },
    ],
  },
  {
    version: "2026.10.22.12",
    date: "2026-10-22",
    title: "Mi horario en el menú del Junior",
    changes: [
      { type: "NUEVO", text: "Los monitores Junior tienen «Mi horario» debajo de «Panel principal», que abre directo el horario de oficina. «Horas del equipo» conserva su pestaña de horario." },
      { type: "MEJORA", text: "«Calendario» ya no aparece en el menú lateral de los Junior." },
    ],
  },
  {
    version: "2026.10.22.11",
    date: "2026-10-22",
    title: "Post-it virtual del máster para los Junior",
    changes: [
      { type: "NUEVO", text: "El máster puede dejar una nota grande, con color y un leve giro de post-it, que es lo primero que ve cada Junior al abrir la app. Se escribe y se retira desde su pantalla de bienvenida o desde Equipo." },
      { type: "MEJORA", text: "Una nota nueva se muestra al Junior aunque haya pedido no ver la bienvenida hoy." },
    ],
  },
  {
    version: "2026.10.22.10",
    date: "2026-10-22",
    title: "Pantalla de bienvenida del Junior más clara",
    changes: [
      { type: "MEJORA", text: "Resumen en cifras al inicio: proyectos activos, novedades nuevas, subtareas pendientes (y vencidas) y tiempo tarde." },
      { type: "MEJORA", text: "«Tus proyectos»: un bloque por proyecto con su nombre, su rol, el avance de subtareas y, en viñetas, lo importante desde el último ingreso (notas de otras personas, etiquetas y subtareas terminadas)." },
      { type: "MEJORA", text: "«Tu horario»: el bloque de ahora, la lista de hoy y la semana completa plegada." },
    ],
  },
  {
    version: "2026.10.22.9",
    date: "2026-10-22",
    title: "Panel principal más limpio: los proyectos primero",
    changes: [
      { type: "MEJORA", text: "Para todos los perfiles, las tarjetas anteriores a «Integrantes» (El área, Situación actual, Objetivos y Difusión y visibilidad) arrancan contraídas y se pueden abrir con su ícono, de modo que los proyectos son lo primero desplegado." },
      { type: "MEJORA", text: "«Actividad» y los comentarios al equipo de ET también arrancan contraídos." },
      { type: "MEJORA", text: "El menú rápido lateral del Junior en el panel deja solo los íconos de Proyectos, Proyectos de estudio y Actividad reciente." },
    ],
  },
  {
    version: "2026.10.22.8",
    date: "2026-10-22",
    title: "Tiempo tarde acumulado del equipo",
    changes: [
      { type: "NUEVO", text: "Nueva pestaña «Puntualidad» en Horas del equipo: el máster registra cuántos minutos llegó tarde cada persona un día y la app acumula el total por persona y del equipo desde el inicio del semestre." },
      { type: "NUEVO", text: "El tiempo tarde acumulado de cada Junior aparece en su pantalla de bienvenida; cada uno ve solo el suyo." },
    ],
  },
  {
    version: "2026.10.22.7",
    date: "2026-10-22",
    title: "Pantalla de bienvenida con fondo difuminado",
    changes: [
      { type: "MEJORA", text: "Mientras se muestra la pantalla de bienvenida, todo lo que hay detrás se difumina para evitar ruido visual." },
      { type: "MEJORA", text: "Los monitores Junior no pueden cerrarla antes de 3 segundos: el botón de cerrar y «Ir al panel» muestran la cuenta regresiva." },
    ],
  },
  {
    version: "2026.10.22.6",
    date: "2026-10-22",
    title: "Resumen de versiones en Desarrollador",
    changes: [
      { type: "NUEVO", text: "Desarrollador muestra las últimas 10 versiones de la app, cada una con su fecha y sus cambios, como las notas de actualización de una aplicación." },
      { type: "MEJORA", text: "El prompt de Desarrollador le pide a la IA que sume una entrada a este historial con cada cambio que publique." },
    ],
  },
  {
    version: "2026.10.22.5",
    date: "2026-10-22",
    title: "Vista previa de la bienvenida en «Ver como»",
    changes: [
      { type: "NUEVO", text: "Con «Ver como» activo, el botón «Ver su pantalla de bienvenida» (menú lateral y franja amarilla) abre la capa tal como la verá ese perfil al abrir la app." },
      { type: "MEJORA", text: "La vista previa no guarda nada: no cuenta como actividad del Junior ni cambia lo de «no mostrar hoy»." },
    ],
  },
  {
    version: "2026.10.22.4",
    date: "2026-10-22",
    title: "Capa de bienvenida y huella digital",
    changes: [
      { type: "NUEVO", text: "Al entrar, cada perfil identificado ve una capa con su último ingreso, las novedades que lo involucran (lo etiquetaron, una subtarea suya o un proyecto suyo) y su semana con el bloque actual resaltado." },
      { type: "NUEVO", text: "El máster ve en esa capa la huella digital de los monitores Junior: días activos, clics, proyectos y cambios por persona, y visitas, clics y cambios por proyecto, con los proyectos sin actividad resaltados." },
      { type: "MEJORA", text: "La capa reemplaza al saludo anterior del panel. A los Junior se les avisa que su actividad en la app se registra; nunca se guarda lo que escriben." },
    ],
  },
  {
    version: "2026.10.22.3",
    date: "2026-10-22",
    title: "Edificios 310 y 238 en el horario",
    changes: [
      { type: "MEJORA", text: "Cada bloque del horario de oficina escribe siempre su edificio, el 310 o el 238." },
      { type: "MEJORA", text: "Al ver a una sola persona, los bloques se colorean por edificio: azul el 310 y morado el 238." },
    ],
  },
  {
    version: "2026.10.22.2",
    date: "2026-10-22",
    title: "Desarrollador: foco por módulo, apartado o proyecto",
    changes: [
      { type: "NUEVO", text: "Se puede elegir el módulo, los apartados o el proyecto que se va a estructurar, y el tipo de cambio (apartado, botones, enlaces, pantalla nueva, reestructurar o campos nuevos)." },
      { type: "MEJORA", text: "El prompt le entrega a la IA los archivos, modelos, permisos y apartados reales de lo elegido, y el contexto del proyecto con su checklist." },
    ],
  },
  {
    version: "2026.10.22.1",
    date: "2026-10-22",
    title: "Cargador de las horas de las semanas 1 a 8",
    changes: [{ type: "MEJORA", text: "Nuevo script para cargar el plan de horas de las primeras ocho semanas: comprueba que cada persona sume 20 h por semana y no duplica lo ya cargado." }],
  },
  {
    version: "2026.10.21.4",
    date: "2026-10-21",
    title: "Cada Junior ve solo lo suyo en Horas",
    changes: [
      { type: "NUEVO", text: "«Mis horas y mi horario»: cada Junior ve únicamente su contador, sus registros y sus bloques; los datos de los demás no llegan a su navegador." },
      { type: "NUEVO", text: "Tarjeta «Ahora» en tiempo real: el bloque en que está, el edificio, hasta qué hora y cuánto falta, o cuál sigue." },
      { type: "MEJORA", text: "En la grilla del horario, el bloque en curso lleva contorno y el día de hoy una línea roja con la hora actual." },
    ],
  },
  {
    version: "2026.10.21.3",
    date: "2026-10-21",
    title: "Control de horas del equipo y horario de oficina",
    changes: [
      { type: "NUEVO", text: "Nueva sección «Horas del equipo»: plan semanal y horas reales de cada persona, con meta de 20 h por semana (Gestión del Conocimiento, proyecto de estudio, punto de información y el resto)." },
      { type: "NUEVO", text: "Contador por persona y estadísticas del equipo por semana, mes o semestre. Solo el máster registra." },
      { type: "NUEVO", text: "Horario de oficina de lunes a sábado con el edificio de cada bloque, para ver dónde está cada persona." },
    ],
  },
  {
    version: "2026.10.21.2",
    date: "2026-10-21",
    title: "Líneas de trabajo en el perfil de LinkedIn",
    changes: [{ type: "MEJORA", text: "La plantilla del perfil de LinkedIn pregunta por las líneas de trabajo con respuestas sugeridas y un tope de tres." }],
  },
  {
    version: "2026.10.21.1",
    date: "2026-10-21",
    title: "Egresados, marca y lanzamiento especial",
    changes: [
      { type: "MEJORA", text: "En Egresados, la carrera y el semestre se eligen con listas en lugar de escribirse." },
      { type: "MEJORA", text: "El nombre «ET en Marcha» muestra debajo «Oficina de Gestión de Proyectos (PMO)»." },
      { type: "NUEVO", text: "Proyecto de piezas gráficas para el lanzamiento especial de Cursos Libres." },
    ],
  },
  {
    version: "2026.10.19.3",
    date: "2026-10-19",
    title: "Tracker de egresados",
    changes: [
      { type: "NUEVO", text: "Sección «Egresados» para rastrear a los antiguos monitores: empresa y cargo actuales, carrera, LinkedIn y estado del contacto." },
      { type: "NUEVO", text: "Botón grande desde el proyecto de egresados que lleva al tracker y muestra el avance." },
    ],
  },
  {
    version: "2026.10.19.2",
    date: "2026-10-19",
    title: "Empresas de interés con meta de contactos",
    changes: [
      { type: "NUEVO", text: "Meta de cuatro contactos por empresa (reclutador, gerente, recursos humanos y uno libre) con barra de progreso." },
      { type: "NUEVO", text: "Marca de egresados UNAL y FCE en cada contacto, y «Anexar perfil de LinkedIn» pegando uno o varios enlaces." },
    ],
  },
  {
    version: "2026.10.19.1",
    date: "2026-10-19",
    title: "Etiquetas en la campana y prompts en Plantillas",
    changes: [
      { type: "NUEVO", text: "La campana de novedades también avisa cuando alguien etiqueta a la persona en una nota de bitácora." },
      { type: "NUEVO", text: "Las plantillas pueden ser un prompt, con «Copiar prompt» y «Ver prompt»." },
    ],
  },
];

/** Versión actual: la primera del historial. */
export const CURRENT_VERSION = CHANGELOG[0].version;
