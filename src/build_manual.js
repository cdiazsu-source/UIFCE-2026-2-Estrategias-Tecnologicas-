const fs = require('fs');
const { Packer, titlePage, h1, h2, h3, p, pMixed, bullet, bulletBold, headerRow, dataRow, makeTable, buildDoc } = require('./docHelpers');

const W = 9540; // usable width

const children = [];

children.push(...titlePage(
  'Manual de Funciones y Estandarización',
  'Área de Estrategias Tecnológicas (ET)',
  ['Planeación 2026-2', 'Unidad de Informática de la Facultad de Ciencias Económicas (UIFCE)', 'Consultoría en Gobernanza de TI y Estrategia Digital Universitaria', '20 de agosto de 2026 · Actualizado 21 de agosto de 2026']
));

// 1. Introducción
children.push(h1('1. Introducción y objeto del documento'));
children.push(p('Este manual estandariza el rol del área de Estrategias Tecnológicas (ET) dentro de la Unidad de Informática de la Facultad de Ciencias Económicas (UIFCE) de la Universidad Nacional de Colombia. Su propósito es delimitar formalmente el alcance del área, fijar sus objetivos para el periodo 2026-2 y establecer una matriz de responsabilidades que evite solapamientos con las demás áreas de la Unidad: Apoyos Académicos (AA), Gestión del Conocimiento (GC), Desarrollo (DS), Virtualización, Cursos Libres (CL) y Coordinación.'));
children.push(p('El documento se elaboró a partir de los informes de gestión de ET correspondientes a los periodos 2025-1, 2025-2 y 2026-1, la planeación operativa de los tres periodos, y la Guía de Empalme UIFCE (versión 2025), documento de referencia mantenido por el área de Gestión del Conocimiento que describe de manera oficial las funciones y responsabilidades cruzadas de todas las áreas de la Unidad.'));
children.push(p('Este manual complementa —no reemplaza— el Manual de Microtalleres y Microeventos ya vigente, y sienta las bases para el cierre del documento de Términos y Condiciones de Estrategias Tecnológicas, identificado como pendiente en la planeación 2026-1.'));

// 2. Alcance del área
children.push(h1('2. Alcance del Área'));

children.push(h2('2.1 Misión del área'));
children.push(p('El área de Estrategias Tecnológicas tiene como misión dar a conocer la imagen y los servicios de la UIFCE dentro de la comunidad universitaria, mediante la generación y difusión de información sobre los servicios tecnológicos que ofrece la Unidad, la organización de eventos y actividades que complementan la formación académica de estudiantes, docentes y personal administrativo, y la construcción de alianzas que amplíen el alcance institucional de la UIFCE dentro y fuera de la Facultad de Ciencias Económicas.'));

children.push(h2('2.2 Objetivos clave 2026-2'));
children.push(bulletBold('Consolidar la estandarización operativa del área. ', 'Cerrar el documento de Términos y Condiciones de Estrategias Tecnológicas, dando continuidad al Manual de Microtalleres y Microeventos ya vigente.'));
children.push(bulletBold('Ejecutar la primera edición de la Semana UIFCE. ', 'Materializar el evento institucional formulado en 2026-1, articulado con la Semana de Investigación de la Facultad.'));
children.push(bulletBold('Cerrar el ciclo de aprobación de Extensión Solidaria. ', 'Obtener el aval de Vicedecanatura y avanzar hacia la ejecución de la capacitación dirigida a madres cabeza de familia.'));
children.push(bulletBold('Consolidar la presencia institucional en redes emergentes. ', 'Formalizar LinkedIn y completar el trámite de oficialización de YouTube, sosteniendo el crecimiento alcanzado en Instagram.'));
children.push(bulletBold('Delimitar y formalizar el acompañamiento a otras áreas. ', 'Fijar criterios de priorización y tiempos de respuesta razonables para las solicitudes de apoyo gráfico y comunicacional de AA, GC, DS, Virtualización y CL, dada la limitación actual de contar con un único monitor de artes.'));
children.push(bulletBold('Adoptar calidad sobre cantidad como principio rector del semestre. ', 'Reorientar la producción de contenido, la ejecución de eventos y la gestión de canales hacia el posicionamiento real de la UIFCE, apoyándose en inteligencia artificial para sostener ese estándar sin aumentar la carga operativa del equipo (ver numeral 2.5).'));

children.push(h2('2.3 Público objetivo'));
children.push(p('El público objetivo principal son los estudiantes de pregrado de la Facultad de Ciencias Económicas, principales usuarios de los servicios, actividades y espacios de formación de la UIFCE. De manera complementaria, las estrategias del área también se dirigen a estudiantes de posgrado, docentes y personal administrativo de la Facultad y, cuando la naturaleza de la actividad lo permite, a miembros de otras facultades de la Universidad Nacional de Colombia.'));

children.push(h2('2.4 Servicios fundamentales'));
children.push(p('ET presta cuatro servicios fundamentales, consolidados a partir de la experiencia acumulada en 2025-2 y 2026-1:'));
children.push(bulletBold('Comunicación y difusión institucional. ', 'Administración de redes sociales (Instagram, LinkedIn, YouTube), calendario editorial, gestión del micrositio y del correo institucional.'));
children.push(bulletBold('Diseño y producción de contenido digital. ', 'Piezas gráficas, material audiovisual, imagen institucional y apoyo gráfico a otras áreas y dependencias de la Facultad, apoyada progresivamente en herramientas de IA para clasificación de material y automatización de edición de video.'));
children.push(bulletBold('Gestión de eventos. ', 'Microtalleres, microeventos, Hackatón/competencias de simulación, Semana UIFCE y demás actividades de formación complementaria.'));
children.push(bulletBold('Gestión y fortalecimiento del área. ', 'Documentación, estandarización y mejora continua de los procesos propios de ET (manuales, términos y condiciones, reglamentaciones, repositorio documental permanente).'));

children.push(h2('2.5 Principio rector: calidad sobre cantidad'));
children.push(p('Los informes de gestión de 2025-1, 2025-2 y 2026-1 muestran de forma consistente que el volumen de actividad del área —número de piezas, de microtalleres, de eventos formulados— no siempre se traduce en una proporción equivalente de impacto o posicionamiento institucional: microtalleres con alta inscripción y baja asistencia efectiva, una Hackatón formulada dos veces antes de lograr ejecutarse, y piezas producidas sin licencias institucionales adecuadas.'));
children.push(p('Por esta razón, ET adopta para 2026-2 la calidad sobre la cantidad como principio rector transversal a todo su portafolio, no solo a los microtalleres: menos piezas mejor dirigidas, eventos con convocatoria asegurada antes de ejecutarse y canales consolidados —no multiplicados sin criterio— como vía real de posicionamiento de la Unidad frente a la comunidad universitaria.'));
children.push(p('Como palanca para sostener este estándar sin incrementar la carga del único monitor de artes del área, ET trabajará activamente con inteligencia artificial en dos frentes: (1) un repositorio de material asistido por IA que facilite la búsqueda, clasificación y reutilización de piezas, hacks y videos ya producidos, evitando que el conocimiento se pierda entre semestres, y (2) la automatización de tareas repetitivas de edición y producción de video (subtitulado, recortes, adaptación de formato por plataforma), liberando tiempo del equipo para el trabajo creativo y estratégico. El detalle operativo de esta iniciativa se desarrolla como proyecto propio en el Portafolio de Proyectos 2026-2.'));

// 3. Roles internos
children.push(h1('3. Roles y Estructura Interna de ET'));
children.push(p('De acuerdo con la Guía de Empalme UIFCE, el área opera con la siguiente estructura de roles:'));

{
  const widths = [2400, 1600, 5540];
  const rows = [headerRow(['Rol', 'Dedicación', 'Responsabilidades clave'], widths)];
  const data = [
    ['Monitor Máster ET', '20 h/semana (10 h investigación + 10 h proyecto)', 'Lidera el área: calendario editorial, supervisión de imagen institucional, gestión de microtalleres, Hackatón, Extensión Solidaria, alianzas interfacultades, actualización de certificados, gestión de YouTube y reporte quincenal a Coordinación.'],
    ['Monitor Junior de Artes ET', '16 h/semana (8 h investigación + 4 h proyecto + 4 h sala)', 'Diseño de piezas gráficas, publicación en redes, reels, actualización de televisores, apoyo logístico en eventos, mantenimiento de LinkTree y plantillas.'],
    ['Monitor Ad Honorem ET', 'Variable (colaboración voluntaria)', 'Apoyo puntual en publicación de disponibilidad de salas y otras tareas operativas delegables, según disponibilidad.'],
  ];
  data.forEach((d, i) => rows.push(dataRow(d, widths, { shadeAlt: i % 2 === 1 })));
  children.push(makeTable(widths, rows));
}
children.push(p('', {}));

// 4. Delimitación de alcance
children.push(h1('4. Delimitación de Alcance frente a Otras Áreas'));
children.push(p('Con el fin de evitar solapamientos, este manual adopta como referencia oficial la Tabla de Responsabilidades Cruzadas por Área de la Guía de Empalme UIFCE, precisando su aplicación a los procesos donde ET tiene participación directa o compartida.'));

{
  const widths = [2600, 2200, 2400, 2340];
  const rows = [headerRow(['Proceso', 'Lidera', 'Rol de ET', 'Colabora / aprueba'], widths)];
  const data = [
    ['Redes sociales y difusión institucional', 'ET', 'Responsable integral: estrategia, calendario editorial, publicación', 'Coordinación aprueba piezas sensibles'],
    ['Micrositio web — equipo de trabajo', 'ET (contenido) / DS (desarrollo)', 'Actualiza fotos, biografías y estructura de contenido', 'DS ejecuta cambios técnicos y despliegue'],
    ['Blog UIFCE', 'GC (contenido) / ET (diseño y despliegue)', 'Diseña la plataforma y acompaña el despliegue en el micrositio', 'GC cura y redacta los resúmenes de proyectos de estudio'],
    ['Piezas gráficas y difusión de Cursos Libres', 'CL (solicita) / ET (produce)', 'Elabora piezas gráficas y coordina fechas de publicación con CL', 'CL define contenido y calendario de lanzamientos'],
    ['Cartelera física y digital de Cursos Libres', 'ET', 'Diseña e implementa; coordina rediseños con CL', 'CL aporta lineamientos de contenido vigente'],
    ['Certificados institucionales', 'ET (diseño) / AA y CL (generación)', 'Diseña las plantillas conforme a Imagen Institucional', 'AA y CL generan los certificados vía script (AppScript) con sus propios datos'],
    ['YouTube — gestión del canal', 'ET (canal) / Virtualización (contenido de cursos)', 'Administra la cuenta, sube y nombra los videos', 'Virtualización entrega los videos de cursos virtualizados para incrustar en Moodle'],
    ['Imagen institucional y rebranding', 'ET', 'Interlocutor oficial con la Oficina de Imagen Institucional de la UNAL', 'Coordinación avala cambios de marca'],
    ['Eventos institucionales (Hackatón, Semana UIFCE, 40 años, etc.)', 'ET', 'Formula, planea y ejecuta', 'Coordinación aprueba presupuesto y logística mayor; VIE en el caso de Semana UIFCE'],
    ['Extensión Solidaria', 'ET', 'Formula la propuesta técnica y gestiona su aprobación', 'Vicedecanatura avala; Coordinación gestiona presupuesto ante el Consejo'],
    ['Informe de gestión semestral', 'Coordinación (consolida)', 'Contribuye con el reporte de métricas y logros del área', 'Todas las áreas contribuyen; Coordinación presenta a Decanatura'],
  ];
  data.forEach((d, i) => rows.push(dataRow(d, widths, { shadeAlt: i % 2 === 1 })));
  children.push(makeTable(widths, rows));
}
children.push(p('', {}));
children.push(p('Un punto de solapamiento potencial que este manual resuelve explícitamente es el Blog UIFCE: la curaduría y redacción de contenido de proyectos de estudio corresponde a Gestión del Conocimiento, mientras que el diseño de la plataforma, su despliegue en el micrositio y la estrategia de difusión del blog corresponden a Estrategias Tecnológicas. Ambas áreas deben articular un cronograma conjunto antes de cada publicación.'));

// 5. Matriz de responsabilidades RACI
children.push(h1('5. Matriz de Responsabilidades (RACI) — Procesos Propios de ET'));
children.push(p('La siguiente matriz aplica el esquema Responsable / Aprueba / Consultado / Informado a los procesos que ET ejecuta de manera directa durante 2026-2.'));

{
  const widths = [3100, 1610, 1610, 1610, 1610];
  const rows = [headerRow(['Proceso / actividad', 'Responsable (R)', 'Aprueba (A)', 'Consultado (C)', 'Informado (I)'], widths)];
  const data = [
    ['Calendario editorial y estrategia de difusión', 'Máster ET', 'Coordinación', 'Comunicaciones FCE', 'Todas las áreas'],
    ['Piezas gráficas y contenido audiovisual', 'Junior de Artes ET', 'Máster ET', 'Imagen Institucional UNAL', 'Área solicitante'],
    ['Microtalleres y microeventos', 'Máster ET', 'Coordinación', 'Ad Honorem / egresados', 'Comunidad UIFCE'],
    ['Hackatón (Semana UIFCE)', 'Máster ET', 'Coordinación', 'Profesores aliados', 'Comunidad universitaria'],
    ['Extensión Solidaria', 'Máster ET', 'Vicedecanatura', 'Gestión de Fomento Socioeconómico', 'Coordinación'],
    ['Semana UIFCE', 'Máster ET', 'Coordinación / VIE', 'Profesores y dependencias aliadas', 'Comunidad universitaria'],
    ['Blog UIFCE (diseño y despliegue)', 'Máster ET', 'Coordinación', 'GC (contenido)', 'Comunicaciones FCE'],
    ['Micrositio (contenido de equipo)', 'Junior de Artes ET', 'Máster ET', 'DS (aspectos técnicos)', 'Coordinación'],
    ['Carteleras físicas y digitales', 'Junior de Artes ET', 'Máster ET', 'Comunicaciones FCE / CL', 'Coordinación'],
    ['Términos y Condiciones ET', 'Máster ET', 'Coordinación', 'GC (formato normativo)', 'Comunidad UIFCE'],
  ];
  data.forEach((d, i) => rows.push(dataRow(d, widths, { shadeAlt: i % 2 === 1 })));
  children.push(makeTable(widths, rows));
}
children.push(p('', {}));

// 6. Normativa
children.push(h1('6. Normativa y Documentos de Referencia'));
children.push(bulletBold('Manual de Microtalleres y Microeventos (vigente). ', 'Establece objetivos, modalidades, responsabilidades, inscripción, asistencia y evaluación de estas actividades.'));
children.push(bulletBold('Términos y Condiciones de Estrategias Tecnológicas (pendiente — prioridad 2026-2). ', 'Reglamentará de manera integral los tipos de evento de ET, cerrando la brecha identificada en el diagnóstico frente a la ausencia de penalizaciones claras por inasistencia.'));
children.push(bulletBold('Lineamientos de Imagen Institucional de la UNAL. ', 'Marco obligatorio para toda pieza gráfica, audiovisual y de certificación producida por el área.'));
children.push(bulletBold('Guía de Empalme UIFCE (versión 2025). ', 'Referencia oficial de responsabilidades cruzadas entre áreas, mantenida por Gestión del Conocimiento.'));

// 7. Vigencia
children.push(h1('7. Vigencia y Actualización'));
children.push(p('Este manual rige para el periodo académico 2026-2 y debe revisarse al inicio de cada semestre en el marco del proceso de empalme, en articulación con la actualización de la Guía de Empalme UIFCE liderada por Gestión del Conocimiento. Cualquier modificación a la matriz de responsabilidades debe ser avalada por Coordinación.'));

const doc = buildDoc(children);
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/tmp/outputs/Manual_de_Funciones_ET_2026-2.docx', buf);
  console.log('OK manual');
});
