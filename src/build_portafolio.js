const fs = require('fs');
const { Packer, titlePage, h1, h2, h3, p, bullet, bulletBold, headerRow, dataRow, makeTable, buildDoc } = require('./docHelpers');

const children = [];

children.push(...titlePage(
  'Portafolio de Proyectos 2026-2',
  'Área de Estrategias Tecnológicas (ET)',
  ['Visibilidad digital, alcance analógico/institucional y posicionamiento en redes', 'Unidad de Informática de la Facultad de Ciencias Económicas (UIFCE)', 'Consultoría en Gobernanza de TI y Estrategia Digital Universitaria', '20 de agosto de 2026 · Actualizado 21 de agosto de 2026']
));

// 1. Introducción
children.push(h1('1. Introducción y Metodología'));
children.push(p('Este portafolio consolida las iniciativas de comunicación, visibilidad y posicionamiento del área de Estrategias Tecnológicas (ET) para el periodo 2026-2. Se construyó a partir de dos fuentes: (a) los proyectos ya formulados o iniciados en 2025-1, 2025-2 y 2026-1 que requieren continuidad, y (b) cuatro propuestas nuevas alineadas con los frentes definidos institucionalmente para este semestre: visibilidad digital, alcance analógico/institucional, posicionamiento en redes, e innovación y eficiencia operativa.'));
children.push(p('Todo el portafolio se rige por el principio de calidad sobre cantidad adoptado para 2026-2 (ver Manual de Funciones y Estandarización, numeral 2.5): el objetivo no es maximizar el número de piezas, eventos o canales, sino posicionar de forma sostenida a la UIFCE en la comunidad universitaria. La incorporación activa de inteligencia artificial (numeral 3.4) es la palanca operativa que permite sostener ese estándar de calidad sin aumentar la carga del único monitor de artes del área.'));
children.push(p('Cada iniciativa incluye objetivo, justificación con base en el diagnóstico 2025-1 → 2026-1, alcance, entregables, cronograma tentativo e indicadores, de forma que puedan incorporarse directamente al plan de acción semestral del área.'));

// 2. Proyectos en continuidad
children.push(h1('2. Proyectos en Continuidad'));
children.push(p('Iniciativas formuladas o iniciadas en semestres anteriores que deben cerrarse o ejecutarse durante 2026-2.'));

{
  const widths = [2200, 2900, 2440, 2000];
  const rows = [headerRow(['Proyecto', 'Estado a cierre de 2026-1', 'Meta 2026-2', 'Responsable'], widths)];
  const data = [
    ['Semana UIFCE', 'Documento técnico, estudio de viabilidad y cronograma preliminar formulados', 'Ejecutar la primera edición, articulada con la Semana de Investigación (VIE)', 'Máster ET'],
    ['Hackatón (Bizagi)', 'Propuesta técnica lista (base documental de Gabriel); cancelada en 2025-2 por baja inscripción', 'Ejecutar dentro de Semana UIFCE con convocatoria anticipada y alianzas con asignaturas', 'Máster ET + Ad Honorem'],
    ['Extensión Solidaria', 'Propuesta técnica, metodología y cotizaciones completas; falta presupuesto formal y aval', 'Presentar y obtener aval de Vicedecanatura; iniciar gestión de ejecución', 'Máster ET'],
    ['Blog UIFCE', 'Diseño validado y desplegado en el micrositio', 'Aprobar y ejecutar la estrategia de difusión del blog', 'Máster ET (difusión) + GC (contenido)'],
    ['Términos y Condiciones ET', 'Pendiente ("<3" en seguimiento 2026-1)', 'Documento formal aprobado y difundido', 'Máster ET'],
    ['Oficialización de YouTube', 'Trámite en curso ante Oficina de Medios Digitales UNAL', 'Cerrar el trámite y consolidar la cuenta institucional', 'Máster ET'],
    ['Renovación línea gráfica Cursos Libres', 'Nueva línea implementada; despliegue en curso', 'Completar despliegue en todos los medios físicos y digitales', 'Junior de Artes ET'],
  ];
  data.forEach((d, i) => rows.push(dataRow(d, widths, { shadeAlt: i % 2 === 1 })));
  children.push(makeTable(widths, rows));
}
children.push(p('', {}));

// 3. Nuevos proyectos
children.push(h1('3. Portafolio de Nuevos Proyectos 2026-2'));
children.push(p('Cuatro propuestas nuevas: tres alineadas con los frentes estratégicos solicitados (visibilidad digital, alcance analógico/institucional, posicionamiento en redes) y una cuarta de innovación y eficiencia operativa que sostiene la calidad del resto del portafolio.'));

// 3.1
children.push(h2('3.1 Boletín Digital UIFCE — Visibilidad digital'));
children.push(bulletBold('Objetivo. ', 'Consolidar un boletín digital periódico que reúna en un solo espacio los servicios, convocatorias, logros y novedades de todas las áreas de la UIFCE.'));
children.push(bulletBold('Justificación. ', 'La planeación 2026-1 identificó la "publicación de boletines informativos" como entregable pendiente sin ejecutar. El diagnóstico muestra además que buena parte de la información institucional (aplicativos de Desarrollo, avances de Virtualización, resultados del Observatorio Tecnológico de GC) no cuenta hoy con un canal de difusión consolidado más allá de Instagram.'));
children.push(bulletBold('Alcance. ', 'Boletín mensual distribuido por correo institucional y publicado en el micrositio, con secciones fijas por área (ET, AA, GC, DS, Virtualización, CL).'));
children.push(bulletBold('Entregables. ', 'Plantilla de boletín aprobada por Imagen Institucional; cronograma de recolección de contenido por área; primeros tres números publicados en 2026-2.'));
children.push(bulletBold('Cronograma tentativo. ', 'Semanas 1-2: diseño de plantilla y protocolo de recolección. Semana 4: primer número. Semanas 8 y 12: números siguientes.'));
children.push(bulletBold('Indicadores. ', 'Número de ediciones publicadas; tasa de apertura del correo; participación de las demás áreas con contenido propio.'));
children.push(bulletBold('Responsable. ', 'Máster ET, con contenido aportado por cada área a través del protocolo de acompañamiento interárea (ver documento correspondiente).'));

// 3.2
children.push(h2('3.2 Red de Aliados Académicos UIFCE — Alcance analógico/institucional'));
children.push(bulletBold('Objetivo. ', 'Construir una red formal de profesores y asignaturas aliadas que faciliten la convocatoria presencial a los eventos y servicios de la UIFCE.'));
children.push(bulletBold('Justificación. ', 'La planeación 2026-1 ya identificaba la necesidad de "aumentar difusión implementando alianzas con asignaturas/profesores que incentiven a sus estudiantes a la participación... por medio de un bono/ensayo/resumen/trabajo" para la Semana UIFCE, y de mantener un listado de profesores/dependencias aliadas. Este proyecto generaliza esa necesidad puntual en un mecanismo permanente del área, en lugar de reconstruirlo cada vez que se organiza un evento.'));
children.push(bulletBold('Alcance. ', 'Listado vivo de profesores y asignaturas aliadas por programa curricular (administración, economía, contaduría); esquema de incentivos académicos coordinado con los docentes; protocolo de activación para cada evento (Semana UIFCE, microtalleres, Hackatón).'));
children.push(bulletBold('Entregables. ', 'Base de datos de aliados; convenio informal de colaboración por asignatura; reporte de asistencia atribuible a cada alianza.'));
children.push(bulletBold('Cronograma tentativo. ', 'Semanas 1-3: identificación y primer contacto con docentes. Semana 6: red activa para la convocatoria de Semana UIFCE. Cierre de semestre: evaluación de la red.'));
children.push(bulletBold('Indicadores. ', 'Número de asignaturas aliadas; porcentaje de asistentes a eventos ET provenientes de la red; renovación de alianzas para 2027-1.'));
children.push(bulletBold('Responsable. ', 'Máster ET, con apoyo de Coordinación para la interlocución formal con las escuelas.'));

// 3.3
children.push(h2('3.3 Recuperación y Consolidación de Canales UIFCE — Posicionamiento en redes'));
children.push(p('Este proyecto agrupa las cuatro decisiones de canal que definen el posicionamiento en redes de 2026-2. Instagram y LinkedIn se marcan como prioritarias; TikTok es un canal nuevo en evaluación; YouTube es continuidad administrativa.'));

children.push(h3('3.3.1 Instagram UIFCE — recuperación o recreación (crítico)'));
children.push(bulletBold('Objetivo. ', 'Recuperar la cuenta oficial @uifce_un o, si no es posible, crear y oficializar una nueva, sin perder la continuidad del canal de mayor alcance del área.'));
children.push(bulletBold('Justificación. ', 'La cuenta se perdió (reportado por el área en agosto de 2026). Instagram concentró en 2026-1 el 83.649 visualizaciones y 2.323 interacciones de 25 reels: es el canal del que depende la mayor parte de la estrategia de difusión y de la producción de contenido de este mismo portafolio.'));
children.push(bulletBold('Alcance. ', 'Gestión de recuperación ante Meta con apoyo de Imagen Institucional/Unimedios (semanas 1-3); si no se logra, creación y oficialización de cuenta nueva ante la Oficina de Medios Digitales UNAL.'));
children.push(bulletBold('Entregables. ', 'Cuenta activa y oficial (recuperada o nueva); migración del contenido disponible.'));
children.push(bulletBold('Cronograma tentativo. ', 'Semanas 1-4.'));
children.push(bulletBold('Indicadores. ', 'Cuenta operativa antes de semana 4; continuidad del calendario editorial sin interrupción mayor a un mes.'));
children.push(bulletBold('Responsable. ', 'Máster ET.'));

children.push(h3('3.3.2 LinkedIn UIFCE — posicionamiento prioritario'));
children.push(bulletBold('Objetivo. ', 'Consolidar LinkedIn como canal prioritario del semestre, con calendario propio y migración a la cuenta empresa de la Unidad.'));
children.push(bulletBold('Justificación. ', 'LinkedIn pasó en 2026-1 de una red subutilizada a 7 publicaciones con 1.491 impresiones y 42 reacciones, con oficialización institucional ya obtenida; sin embargo, quedó registrado con cuenta personal en lugar de cuenta empresa desde su oficialización en 2025-1. Ante la contingencia de Instagram, se prioriza como canal estable adicional.'));
children.push(bulletBold('Alcance. ', 'Calendario editorial propio (logros de monitores y egresados, proyectos de estudio, contenido profesional); decisión y ejecución de la migración a cuenta empresa.'));
children.push(bulletBold('Entregables. ', 'Calendario editorial LinkedIn; publicaciones mensuales mínimas; migración de cuenta resuelta.'));
children.push(bulletBold('Cronograma tentativo. ', 'Semanas 1-2: definición editorial y decisión de migración. Publicación continua desde semana 3.'));
children.push(bulletBold('Indicadores. ', 'Impresiones y reacciones superiores a 2026-1; cuenta empresa activa.'));
children.push(bulletBold('Responsable. ', 'Máster ET.'));

children.push(h3('3.3.3 TikTok UIFCE — canal nuevo'));
children.push(bulletBold('Objetivo. ', 'Evaluar el aporte de TikTok como canal adicional de video corto, con un formato propio.'));
children.push(bulletBold('Justificación. ', 'Los hacks informáticos y los reels ya demostraron en 2026-1 que el video corto es el formato de mayor alcance de la UIFCE; TikTok es la plataforma nativa de ese formato entre la población estudiantil.'));
children.push(bulletBold('Alcance. ', 'Trámite de oficialización ante Imagen Institucional/Unimedios; definición de un formato de contenido propio, no una réplica directa de los reels de Instagram.'));
children.push(bulletBold('Entregables. ', 'Cuenta creada y oficializada; primer lote de publicaciones.'));
children.push(bulletBold('Cronograma tentativo. ', 'Semanas 3-8.'));
children.push(bulletBold('Indicadores. ', 'Cuenta activa a mitad de semestre; alcance de las primeras publicaciones como línea base para 2027-1.'));
children.push(bulletBold('Responsable. ', 'Junior de Artes ET.'));

children.push(h3('3.3.4 YouTube UIFCE — cierre de oficialización (continuidad)'));
children.push(bulletBold('Objetivo. ', 'Cerrar el trámite de oficialización pendiente desde 2025-2 y activar un calendario editorial propio.'));
children.push(bulletBold('Justificación. ', 'El canal ya cuenta con suscriptores y con contenido de Virtualización dependiendo de él, pero sigue sin respaldo institucional formal.'));
children.push(bulletBold('Alcance. ', 'Cierre del trámite ante la Oficina de Medios Digitales UNAL; calendario editorial propio (tutoriales, hacks en formato largo, videos institucionales); incrustación de videos de Virtualización.'));
children.push(bulletBold('Entregables. ', 'Trámite cerrado; al menos 4 videos propios en el semestre.'));
children.push(bulletBold('Cronograma tentativo. ', 'Semanas 1-4 para el trámite; publicación continua el resto del semestre.'));
children.push(bulletBold('Indicadores. ', 'Trámite cerrado; suscriptores y visualizaciones.'));
children.push(bulletBold('Responsable. ', 'Máster ET, en coordinación con Virtualización.'));

// 3.4
children.push(h2('3.4 Repositorio de Material con IA y Automatización de Producción de Video — Innovación y eficiencia operativa'));
children.push(bulletBold('Objetivo. ', 'Incorporar inteligencia artificial en dos frentes del trabajo diario de ET: un repositorio de material clasificado y buscable, y la automatización de tareas repetitivas de edición y producción de video.'));
children.push(bulletBold('Justificación. ', 'El diagnóstico identifica dos brechas que este proyecto ataca directamente: el conocimiento del área se pierde si no se organiza (material disperso en Drive sin estructura accesible desde 2025-1), y toda la edición de video se hace hoy de forma artesanal por un único monitor de artes. La adopción de IA es la palanca que permite sostener el principio de calidad sobre cantidad sin aumentar esa carga operativa.'));
children.push(bulletBold('Alcance. ', 'Repositorio de material (piezas, hacks, videos, documentos de proyectos) organizado y clasificado con apoyo de IA para facilitar búsqueda y reutilización, articulado con el repositorio documental permanente de ET; automatización asistida por IA de tareas de edición de video (subtitulado, recortes por plataforma, primeros cortes de edición) que hoy se hacen manualmente.'));
children.push(bulletBold('Entregables. ', 'Repositorio de material clasificado y en operación; al menos un flujo de edición de video automatizado en producción (por ejemplo, subtitulado o adaptación de formato por plataforma); guía interna de uso de las herramientas de IA adoptadas.'));
children.push(bulletBold('Cronograma tentativo. ', 'Semanas 1-4: evaluación y selección de herramientas. Semanas 5-8: montaje del repositorio y piloto de automatización. Semanas 9-16: operación regular y ajuste.'));
children.push(bulletBold('Indicadores. ', 'Tiempo de búsqueda de material reducido frente a la práctica actual en Drive; número de piezas producidas con al menos una etapa automatizada; adopción del flujo por el equipo del área.'));
children.push(bulletBold('Responsable. ', 'Máster ET y Junior de Artes ET.'));

// 4. Cuadro consolidado
children.push(h1('4. Cuadro Consolidado del Portafolio'));
{
  const widths = [2500, 1600, 1900, 1740, 1800];
  const rows = [headerRow(['Proyecto', 'Tipo', 'Trimestre objetivo', 'Responsable', 'Entregable clave'], widths)];
  const data = [
    ['Semana UIFCE', 'Continuidad', 'Semana 8-9', 'Máster ET', 'Primera edición ejecutada'],
    ['Hackatón', 'Continuidad', 'Semana 8-9 (dentro de Semana UIFCE)', 'Máster ET', 'Competencia ejecutada'],
    ['Extensión Solidaria', 'Continuidad', 'Todo el semestre', 'Máster ET', 'Aval de Vicedecanatura'],
    ['Blog UIFCE', 'Continuidad', 'Semanas 1-4', 'Máster ET / GC', 'Estrategia de difusión ejecutada'],
    ['Términos y Condiciones ET', 'Continuidad', 'Semanas 1-6', 'Máster ET', 'Documento aprobado'],
    ['Oficialización YouTube', 'Continuidad', 'Semanas 1-4', 'Máster ET', 'Trámite cerrado'],
    ['Boletín Digital UIFCE', 'Nuevo — Visibilidad digital', 'Semanas 1-12', 'Máster ET', '3 ediciones publicadas'],
    ['Red de Aliados Académicos', 'Nuevo — Alcance institucional', 'Semanas 1-8', 'Máster ET / Coordinación', 'Base de aliados activa'],
    ['Instagram — recuperación/recreación', 'Nuevo — Posicionamiento en redes (CRÍTICO)', 'Semanas 1-4', 'Máster ET', 'Cuenta activa y oficial'],
    ['LinkedIn — posicionamiento prioritario', 'Nuevo — Posicionamiento en redes (PRIORITARIO)', 'Todo el semestre', 'Máster ET', 'Calendario editorial + migración a cuenta empresa'],
    ['TikTok — canal nuevo', 'Nuevo — Posicionamiento en redes', 'Semanas 3-8', 'Junior de Artes ET', 'Cuenta oficializada y primer lote publicado'],
    ['YouTube — cierre de oficialización', 'Continuidad — Posicionamiento en redes', 'Semanas 1-4', 'Máster ET', 'Trámite cerrado'],
    ['Repositorio con IA y automatización de video', 'Nuevo — Innovación y eficiencia operativa', 'Semanas 1-16', 'Máster ET / Junior de Artes', 'Repositorio en operación + flujo automatizado'],
  ];
  data.forEach((d, i) => rows.push(dataRow(d, widths, { shadeAlt: i % 2 === 1 })));
  children.push(makeTable(widths, rows));
}
children.push(p('', {}));

// 5. Riesgos
children.push(h1('5. Riesgos y Prerrequisitos'));
children.push(bulletBold('Licencias de software de diseño y edición. ', 'El área no cuenta con licencias institucionales de edición de imagen; varios proyectos de este portafolio dependen de licencias personales de los monitores. Se recomienda gestionar su adquisición como prerrequisito transversal.'));
children.push(bulletBold('Capacidad instalada limitada. ', 'Un único monitor Junior de artes atiende tanto el portafolio propio de ET como las solicitudes de otras áreas; el Boletín Digital y la Red de Aliados incrementan la carga de coordinación, no solo de producción gráfica.'));
children.push(bulletBold('Dependencia de aprobaciones externas. ', 'Extensión Solidaria depende de Vicedecanatura y Semana UIFCE de la articulación con VIE; ambos proyectos deben iniciarse en las primeras semanas del semestre para no comprometer su ejecución.'));
children.push(bulletBold('Calendario académico. ', 'Con base en la lección aprendida de 2026-1, ningún evento de convocatoria masiva (Hackatón, microtalleres clave, Semana UIFCE) debe programarse en las últimas semanas del calendario académico.'));
children.push(bulletBold('Contingencia de canal principal. ', 'Mientras no se resuelva la recuperación o recreación de Instagram (numeral 3.3.1), buena parte de la difusión del resto del portafolio —Boletín, Semana UIFCE, microtalleres— debe apoyarse temporalmente en LinkedIn y en los canales físicos (carteleras) para no perder alcance.'));
children.push(bulletBold('Curva de adopción de herramientas de IA. ', 'El repositorio con IA y la automatización de edición de video (numeral 3.4) requieren una fase de aprendizaje del equipo; su cronograma contempla un piloto antes de exigir operación regular, para no comprometer la calidad del contenido mientras el equipo se adapta.'));

const doc = buildDoc(children);
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/tmp/outputs/Portafolio_de_Proyectos_ET_2026-2.docx', buf);
  console.log('OK portafolio');
});
