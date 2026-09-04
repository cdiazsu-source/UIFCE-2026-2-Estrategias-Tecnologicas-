import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
import { personColor } from "../src/lib/person-color";

const prisma = new PrismaClient();

// Fuente de verdad editada por personas: no se reemplaza, solo se lee.
// Ver CLAUDE.md numeral 6 y prisma/schema.prisma para el porqué de este diseño.
const CSV_PATH = path.resolve(__dirname, "../../planeacion/planeacion_del_area.csv");

type CsvRow = {
  ID: string;
  Categoría: string;
  Actividad: string;
  "Qué se debe hacer": string;
  "Qué se espera": string;
  Fundamento: string;
  Entregables: string;
};

function splitCategory(raw: string): { category: string; priorityTag: string | null } {
  const parts = raw.split(" — ");
  if (parts.length === 2 && ["CRÍTICO", "PRIORITARIO", "NUEVO"].includes(parts[1].trim())) {
    return { category: parts[0].trim(), priorityTag: parts[1].trim() };
  }
  return { category: raw.trim(), priorityTag: null };
}

function splitDeliverables(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.replace(/^\*\s*/, "").trim())
    .filter((line) => line.length > 0);
}

// Proyectos cuyo checklist lo administra una función dedicada del seed
// (texto rico por ítem que no cabe en las viñetas del CSV). El resync no
// toca su checklist.
const CHECKLIST_OWNED_ELSEWHERE = new Set(["cursoslibres-piezas-primer-lanzamiento"]);

// --- Semestres -----------------------------------------------------------
// Los proyectos del CSV pertenecen a este semestre. El próximo semestre se
// crea desde la app (no toca el CSV).
const CURRENT_SEMESTER_LABEL = "2026-2S";

const OBJETIVOS_2026_2 = [
  "Restablecer y consolidar la presencia en los canales oficiales: recuperar o recrear Instagram, priorizar LinkedIn, poner en marcha TikTok y cerrar la oficialización de YouTube.",
  "Sostener una producción de contenido constante y con estándar de calidad, bajo un calendario editorial único y con licencias institucionales de diseño y edición.",
  "Ejecutar la primera edición de la Semana UIFCE —Hackatón, microtaller y conferencia— y racionalizar los microtalleres priorizando la asistencia efectiva y la certificación de participación.",
  "Formalizar la gobernanza y la memoria del área: Términos y Condiciones, repositorio documental permanente y propuesta de repositorio compartido a Gestión del Conocimiento.",
  "Incorporar inteligencia artificial como palanca de eficiencia operativa, para sostener la calidad sin aumentar la carga del equipo.",
  "Garantizar el acompañamiento a las demás áreas de la UIFCE con niveles de servicio (SLA) definidos y un canal único de solicitudes.",
];

/** Crea el semestre vigente si no existe y le pone los objetivos base solo si
 *  todavía no tiene ninguno (no pisa lo que edite el equipo). Devuelve su id. */
async function ensureCurrentSemester(): Promise<string> {
  const existing = await prisma.semester.findUnique({ where: { label: CURRENT_SEMESTER_LABEL } });
  if (existing) {
    if (existing.objectives.length === 0) {
      await prisma.semester.update({ where: { id: existing.id }, data: { objectives: OBJETIVOS_2026_2 } });
    }
    return existing.id;
  }
  const created = await prisma.semester.create({
    data: { label: CURRENT_SEMESTER_LABEL, objectives: OBJETIVOS_2026_2, isCurrent: true, order: 0 },
  });
  console.log(`Semestre creado: ${CURRENT_SEMESTER_LABEL}`);
  return created.id;
}

async function seedProjectsFromCsv() {
  const csvText = fs.readFileSync(CSV_PATH, "utf-8");
  const rows: CsvRow[] = parse(csvText, { columns: true, skip_empty_lines: true });

  const semesterId = await ensureCurrentSemester();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const { category, priorityTag } = splitCategory(row["Categoría"]);

    const existingProject = await prisma.project.findUnique({
      where: { id: row.ID },
      select: { editedInApp: true },
    });

    const csvContent = {
      category,
      priorityTag,
      title: row["Actividad"],
      description: row["Qué se debe hacer"],
      expectedOutcome: row["Qué se espera"],
      rationale: row["Fundamento"],
    };

    // Si alguien editó el contenido en la app, el resync solo mantiene el
    // orden del CSV y respeta el texto editado. El semestre solo se fija al crear.
    const project = await prisma.project.upsert({
      where: { id: row.ID },
      update: existingProject?.editedInApp ? { sourceOrder: i } : { ...csvContent, sourceOrder: i },
      create: { id: row.ID, ...csvContent, sourceOrder: i, semesterId },
    });

    if (CHECKLIST_OWNED_ELSEWHERE.has(project.id)) continue;

    // Checklist: se siembra una sola vez por texto. Un resync nunca sobrescribe
    // ni borra ítems existentes (aunque el usuario los haya marcado como hechos
    // o editado) — solo agrega los que falten.
    const deliverables = splitDeliverables(row["Entregables"]);
    const existing = await prisma.checklistItem.findMany({
      where: { projectId: project.id },
      select: { text: true },
    });
    const existingTexts = new Set(existing.map((e) => e.text));

    let order = existing.length;
    for (const text of deliverables) {
      if (existingTexts.has(text)) continue;
      await prisma.checklistItem.create({
        data: { projectId: project.id, text, order: order++ },
      });
    }
  }

  console.log(`Proyectos sincronizados desde CSV: ${rows.length}`);
}

async function seedSituationStats() {
  const count = await prisma.situationStat.count();
  if (count > 0) return;

  const stats = [
    { label: "Canal en riesgo", value: "Instagram @uifce_un (cuenta perdida)", order: 0 },
    { label: "Canales activos", value: "LinkedIn, YouTube (en trámite), TikTok (nuevo)", order: 1 },
    { label: "Principio del semestre", value: "Calidad sobre cantidad", order: 2 },
    { label: "Alertas críticas", value: "1 — recuperación de Instagram", order: 3 },
  ];

  await prisma.situationStat.createMany({ data: stats });
  console.log(`Situation stats sembrados: ${stats.length}`);
}

async function seedTools() {
  const count = await prisma.tool.count();
  if (count > 0) return;

  const tools = [
    { name: "Photoshop", status: "SIN_LICENCIA" as const, location: "Equipo del monitor de artes (verificar vigencia Adobe)" },
    { name: "Illustrator", status: "SIN_LICENCIA" as const, location: "Equipo del monitor de artes (verificar vigencia Adobe)" },
    { name: "Lightroom", status: "SIN_LICENCIA" as const, location: null },
    { name: "InDesign", status: "SIN_LICENCIA" as const, location: null },
    { name: "Figma", status: "GRATUITA" as const, location: "Cuenta de equipo ET" },
    { name: "Canva", status: "GRATUITA" as const, location: "Cuenta de equipo ET" },
    { name: "CapCut", status: "GRATUITA" as const, location: null },
  ];

  await prisma.tool.createMany({ data: tools });
  console.log(`Herramientas sembradas: ${tools.length}`);
}

async function seedContacts() {
  const count = await prisma.contact.count();
  if (count > 0) return;

  const contacts = [
    {
      name: "Carlos Osorio Ramírez",
      role: "CIID",
      notes: "Donación de cupos en diplomados como premio de la Hackatón (Semana UIFCE).",
      projectId: "eventos-semana-uifce",
    },
    {
      name: "Sandra Carlos Vargas",
      role: "Vicedecanatura de Investigación y Extensión (VIE)",
      notes: "Contacto para la convocatoria de extensión asociada a problemáticas de Bogotá y para el presupuesto de patrocinios de la Semana UIFCE.",
      projectId: "eventos-semana-uifce",
    },
    {
      name: "Juan Martínez",
      role: "Ex-monitor de geología",
      notes: "Confirmar si dicta el microtaller ya diseñado de Análisis espacial aplicado a las ciencias económicas (5 sesiones).",
      projectId: "eventos-microtalleres",
    },
    {
      name: "Jonny",
      role: "Monitor / docente de apoyo",
      notes: "Confirmar horario del microtaller de Introducción a la Lógica de Programación.",
      projectId: "eventos-microtalleres",
    },
    {
      name: "Johnny",
      role: "Desarrollo (DS)",
      notes: "Viabilidad técnica de enlazar la foto de cada integrante del equipo a su perfil de LinkedIn en el micrositio.",
      projectId: "continuidad-micrositio",
    },
    {
      name: "Profesor Montoya (vía Daniel)",
      role: "Gestión de conferencia — sector empresarial",
      notes: "Gestiona la conferencia con invitado del sector empresarial de la Semana UIFCE. Fecha límite: 17 de septiembre.",
      projectId: "eventos-semana-uifce",
    },
    {
      name: "Gau y Ángela",
      role: "Coordinación Hackatón Bizagi",
      notes: "Ya tienen la capacitación y el proyecto de estudio documentados para la Hackatón.",
      projectId: "eventos-semana-uifce",
    },
  ];

  await prisma.contact.createMany({ data: contacts });
  console.log(`Contactos sembrados: ${contacts.length}`);
}

// --- Equipo ------------------------------------------------------------------
// Directorio base. El upsert por correo mantiene el nombre, el rol y el área de
// esta lista como fuente de verdad; NO toca color, foto ni estado activo (eso se
// edita desde /equipo). Los "@example.com" son marcadores hasta tener el correo
// real. Cada quien lleva un color de acento.
const SEED_USERS: {
  name: string;
  email: string;
  role: "MASTER" | "JUNIOR_ARTES" | "JUNIOR_AUXILIAR" | "EQUIPO" | "COORDINADOR" | "DIRECTOR";
  area: string | null;
  color: string;
  credentialKey?: string;
}[] = [
  { name: "Cesar Diaz", email: "cdiazsu@unal.edu.co", role: "MASTER", area: "ET", color: "#2563EB" },
  { name: "Maria Fernanda Celis", email: "mafe@example.com", role: "JUNIOR_ARTES", area: "ET", color: "#DB2777" },
  { name: "Jean Carlos Baquero", email: "jean@example.com", role: "JUNIOR_AUXILIAR", area: "ET", color: "#0D9488" },
  { name: "Estrategias Tecnológicas (ET)", email: "et@example.com", role: "EQUIPO", area: "ET", color: "#4A7729" },
  { name: "Lina Sanabria", email: "lina.sanabria@example.com", role: "COORDINADOR", area: null, color: "#7C3AED" },
  { name: "Santiago Parra", email: "santiago.parra@example.com", role: "COORDINADOR", area: null, color: "#EA580C" },
  { name: "Daniel Moreno", email: "daniel.moreno@example.com", role: "COORDINADOR", area: null, color: "#C026D3" },
  {
    name: "Henry Sarmiento",
    email: "henry@example.com",
    role: "DIRECTOR",
    area: null,
    color: "#4F46E5",
    // Casa con DIRECTOR_WHO en src/lib/auth.ts: habilita el registro de última visita.
    credentialKey: "henry-sarmiento",
  },
];

function foldName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

async function seedUsers() {
  for (const u of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        area: u.area,
        ...(u.credentialKey ? { credentialKey: u.credentialKey } : {}),
      },
      create: u,
    });
  }
  // Completa el color de quien no lo tenga (persona creada antes de esa columna).
  const sinColor = await prisma.user.findMany({ where: { color: null } });
  for (const u of sinColor) {
    const known = SEED_USERS.find((s) => s.email === u.email);
    await prisma.user.update({
      where: { id: u.id },
      data: { color: known?.color ?? personColor({ id: u.id }) },
    });
  }
  console.log(`Usuarios sincronizados: ${SEED_USERS.length}; colores completados: ${sinColor.length}`);
}

// Fusiona duplicados de una persona del directorio base (mismo nombre, otro
// correo): reasigna sus notas / subtareas / proyectos de estudio a la fila
// canónica (la del correo del SEED_USERS) y borra la sobrante.
async function dedupeSeededPeople() {
  const all = await prisma.user.findMany();
  let merged = 0;
  for (const seed of SEED_USERS) {
    const canonical = all.find((u) => u.email === seed.email);
    if (!canonical) continue;
    const dups = all.filter((u) => u.id !== canonical.id && foldName(u.name) === foldName(seed.name));
    for (const d of dups) {
      await prisma.projectNote.updateMany({ where: { authorId: d.id }, data: { authorId: canonical.id } });
      await prisma.checklistItem.updateMany({ where: { assigneeId: d.id }, data: { assigneeId: canonical.id } });
      await prisma.studyProject.updateMany({ where: { ownerId: d.id }, data: { ownerId: canonical.id } });
      await prisma.user.delete({ where: { id: d.id } });
      merged++;
      console.log(`Usuario duplicado fusionado: "${d.name}" <${d.email}> -> <${canonical.email}>`);
    }
  }
  if (merged === 0) console.log("Sin duplicados de equipo que fusionar.");
}

// --- Proyectos de estudio --------------------------------------------------
// Dos por cada Junior actual, cada uno con sus 4 puntos de corte sin fecha,
// listos para que los llenen desde /proyectos-de-estudio.
const CHECKPOINT_LABELS = ["Primer corte", "Segundo corte", "Tercer corte", "Cuarto corte"];

async function seedStudyProjects() {
  const count = await prisma.studyProject.count();
  if (count > 0) return;

  const juniors = await prisma.user.findMany({
    where: { role: { in: ["JUNIOR_ARTES", "JUNIOR_AUXILIAR"] } },
    select: { id: true },
  });

  let made = 0;
  for (const junior of juniors) {
    await prisma.studyProject.create({
      data: {
        ownerId: junior.id,
        title: "Proyecto de estudio",
        order: 0,
        checkpoints: {
          create: CHECKPOINT_LABELS.map((label, idx) => ({ number: idx + 1, label })),
        },
      },
    });
    made++;
  }
  console.log(`Proyectos de estudio sembrados: ${made} (1 por Junior)`);
}

// --- Línea gráfica -------------------------------------------------------------
async function seedBrandGuidelines() {
  const count = await prisma.brandGuideline.count();
  if (count > 0) return;

  const guidelines: {
    section: string;
    title: string;
    body: string;
    colorHex?: string;
  }[] = [
    {
      section: "Lineamientos",
      title: "Identidad visual de la Universidad Nacional",
      body: "Toda pieza conserva los elementos de identidad de la UNAL: el escudo, la tipografía Ancízar, los márgenes/áreas de protección y la paleta institucional (verde Pantone 376 C como color institucional, rojo Pantone 187 C como alterno). Fuera de esos mínimos hay libertad creativa: se anima a variar la línea gráfica entre semestres para romper la monotonía visual. Guía completa: https://identidad.unal.edu.co/guia-identidad-visual/",
    },
    {
      section: "Lineamientos",
      title: "Tipografía institucional — Ancízar",
      body: "Ancízar es la tipografía institucional exclusiva de la UNAL (familia con múltiples pesos, +500 caracteres, soporte para alfabetos latino y griego). Es la fuente por defecto de las piezas; usar otras solo como recurso puntual y nunca para el nombre de la Universidad ni de la dependencia.",
    },
    {
      section: "Lineamientos",
      title: "Escudo — tamaños y área de protección",
      body: "Tamaño mínimo del escudo: 11 mm de alto en versiones de línea, 15 mm en versión a color. La versión a color solo va sobre fondo blanco; sobre otros fondos, versión monocromática con contraste suficiente. Área de protección alrededor del escudo: ¼ de su altura (X). Ninguna dependencia puede crear logos propios distintos a los institucionales.",
    },
    {
      section: "Lineamientos",
      title: "Aprobación antes de publicar",
      body: "Toda pieza pasa por el grupo de chat \"Piezas Redes Sociales\" (equipo de ET + los dos coordinadores) para obtener el visto bueno de coordinación antes de salir.",
    },
    {
      section: "Lineamientos",
      title: "Contenido en cuentas institucionales",
      body: "El contenido publicado en cuentas institucionales pasa, en última instancia, por el criterio de Comunicaciones e Imagen Institucional, aunque ET tenga margen creativo por ser un equipo de estudiantes. Si una pieza no se republica en la cuenta oficial, siempre debe poder compartirse por canales internos.",
    },
    {
      section: "Lineamientos",
      title: "Documento de Imagen Institucional (Unimedios)",
      body: "El documento \"Imagen institucional\" (carpeta 3 del Drive de ET) resume la reunión con Imagen Institucional / Unimedios: cuándo usar la franja institucional, el escudo y los márgenes. Debe leerlo la máster y todo el equipo, en especial quien asuma la monitoría de artes.",
    },
    {
      section: "Lineamientos",
      title: "Lenguaje de la señalética",
      body: "Evitar el lenguaje restrictivo tipo \"prohibido\" en las piezas de salas y señalética (observación de la reunión de cierre de 2026-1). Preferir un tono informativo.",
    },
    {
      section: "Colores",
      title: "Color institucional — Pantone 376 C",
      body: "Verde institucional de la UNAL, tomado del escudo. Es el color principal de las piezas. Equivalente aproximado: HEX #84BD00 · RGB (132, 189, 0). Sobre él, el texto debe ir en un tono oscuro (no blanco) para mantener contraste.",
      colorHex: "#84BD00",
    },
    {
      section: "Colores",
      title: "Color alterno — Pantone 187 C",
      body: "Rojo institucional. Sustituye al verde cuando es necesario (por contraste, legibilidad o intención de la pieza). Equivalente aproximado: HEX #A6192E · RGB (166, 25, 46).",
      colorHex: "#A6192E",
    },
    {
      section: "Colores",
      title: "Complementario — Pantone 7743 C",
      body: "Verde oscuro. Para textos, fondos sólidos y elementos que necesitan más peso visual que el verde institucional. Equivalente aproximado: HEX #4A7729 · RGB (74, 119, 41). Es el verde primario de esta app.",
      colorHex: "#4A7729",
    },
    {
      section: "Colores",
      title: "Complementario — Pantone 188 C",
      body: "Rojo oscuro / vino. Acompaña al rojo alterno para dar profundidad. Equivalente aproximado: HEX #76232F · RGB (118, 35, 47).",
      colorHex: "#76232F",
    },
    {
      section: "Colores",
      title: "Complementario — Pantone 425 C",
      body: "Gris oscuro neutro. Para textos largos, cuerpos de texto y elementos secundarios. Equivalente aproximado: HEX #54585A · RGB (84, 88, 90).",
      colorHex: "#54585A",
    },
    {
      section: "Colores",
      title: "Complementario — Pantone 421 C",
      body: "Gris claro neutro. Para fondos, separadores y bordes. Equivalente aproximado: HEX #C1C6C8 · RGB (193, 198, 200).",
      colorHex: "#C1C6C8",
    },
    {
      section: "Colores",
      title: "Nota sobre los equivalentes digitales",
      body: "Los HEX/RGB de arriba son conversiones de referencia de los Pantone para pantalla; para impresión usar siempre el Pantone o el CMYK del documento oficial de paleta de la UNAL (identidad.unal.edu.co). La app \"ET en Marcha\" usa estos mismos valores: verde #4A7729 como primario y #84BD00 para estados de \"completado\".",
    },
    {
      section: "Franjas",
      title: "Franja institucional",
      body: "Elemento de identidad de la UNAL. Su uso —cuándo va y cuándo puede omitirse— está definido en el documento de Imagen Institucional. Ante la duda, mantenerla en piezas para canales oficiales y consultar con Unimedios.",
    },
    {
      section: "Formatos",
      title: "Reel / video corto",
      body: "Formato de mayor alcance del área. Cadencia histórica de referencia: un reel por semana. Prioridad: calidad sobre cantidad.",
    },
    {
      section: "Formatos",
      title: "Pieza gráfica",
      body: "Cadencia histórica de referencia: una pieza cada 15 días. Debe pasar por el grupo \"Piezas Redes Sociales\".",
    },
    {
      section: "Formatos",
      title: "Carteleras digitales — edificios 310 y 311",
      body: "Piezas para las carteleras digitales de los edificios 310 y 311, en articulación con la Dependencia de Comunicaciones de la Facultad.",
    },
    {
      section: "Formatos",
      title: "Piezas TV",
      body: "Plantillas activas para las pantallas/televisores de oficina y pasillo. Viven en la carpeta \"Piezas TV\" del Drive de ET.",
    },
    {
      section: "Formatos",
      title: "Video de lanzamiento de Curso Libre",
      body: "Formato estándar en Drive: \"Hola, soy [nombre]. Inscríbete al curso libre de [tema]. Vas a aprender [contenido].\" Se anima a variar el formato para no volverlo monótono.",
    },
  ];

  await prisma.brandGuideline.createMany({
    data: guidelines.map((g, i) => ({
      section: g.section,
      title: g.title,
      body: g.body,
      colorHex: g.colorHex ?? null,
      order: i,
    })),
  });
  console.log(`Indicaciones de línea gráfica sembradas: ${guidelines.length}`);
}

// --- Checklist de Cursos Libres — Primer lanzamiento ------------------------
// Un ítem por curso con toda su ficha (fechas, sesiones, horas, horario,
// ubicación, prerrequisitos y nota de certificado en LinkedIn). Reemplaza las
// viñetas genéricas que sembró el CSV en versiones anteriores.
const CL_PROJECT_ID = "cursoslibres-piezas-primer-lanzamiento";

const CL_OLD_BULLETS = [
  "Excel Básico Virtualizado (CLEBV-I) — monitor: María Fernanda Celis · sem 4-8 (14 sep - 17 oct) · 5 sesiones · cupo 10-20 · prerrequisito: ninguno.",
  "Excel Intermedio Virtualizado (VEA-20202) — monitor: Joel Santiago Rodríguez Guzmán · sem 4-9 (14 sep - 24 oct) · 6 sesiones · cupo 12-24 · prerrequisito: Excel Básico Virtualizado.",
  "Econometría en Python (CLEPY202602) — monitor: Laura Angélica Cárdenas Cely · sem 4-8 (14 sep - 17 oct) · 5 sesiones · cupo 10-20 · prerrequisito: Introducción a la Programación o a Lógica, y estar cursando o haber cursado Econometría I.",
  "Introducción a la Programación en Python y R (CLIPPYR292602) — monitor: Diego Alejandro Garnica Mamanché · sem 4-8 (14 sep - 17 oct) · 5 sesiones · cupo 10-20 · prerrequisito: ninguno.",
  "Introducción a Power BI (CLIPBI202602) — monitor: Paula Sofía Bocarejo Alberto · sem 4-8 (14 sep - 17 oct) · 5 sesiones · cupo 10-20 · prerrequisito: Excel Intermedio Virtualizado.",
  "Siigo Nube (CLSIN2020602) — monitor: Jean Carlos Baquero García · sem 4-8 (14 sep - 17 oct) · 5 sesiones · cupo 10-20 · prerrequisito: Contabilidad de Inversión y Financiación.",
];

const CL_COURSE_ITEMS = [
  [
    "Excel Básico Virtualizado — CLEBV-I",
    "Fechas: 14 sep a 17 oct 2026 (semanas 4 a 8)",
    "Sesiones: 10 · Horas: 20",
    "Días y horario: virtual, sin franja fija",
    "Ubicación: virtual",
    "Prerrequisitos: ninguno",
    "Certificado en LinkedIn al finalizar",
  ].join("\n"),
  [
    "Excel Intermedio Virtualizado — VEA-20202",
    "Fechas: 14 sep a 24 oct 2026 (semanas 4 a 9)",
    "Sesiones: 12 · Horas: 24",
    "Días y horario: virtual, sin franja fija",
    "Ubicación: virtual",
    "Prerrequisitos: Excel Básico Virtualizado",
    "Certificado en LinkedIn al finalizar",
  ].join("\n"),
  [
    "Econometría en Python — CLEPY202602",
    "Fechas: 14 sep a 17 oct 2026 (semanas 4 a 8)",
    "Sesiones: 10 · Horas: 20",
    "Días y horario: lunes y miércoles, 11:00 a 13:00",
    "Ubicación: Sala de Informática 6",
    "Prerrequisitos: Introducción a la Programación o a Lógica, y estar cursando o haber cursado Econometría I",
    "Certificado en LinkedIn al finalizar",
  ].join("\n"),
  [
    "Introducción a la Programación en Python y R — CLIPPYR202602",
    "Fechas: 14 sep a 17 oct 2026 (semanas 4 a 8)",
    "Sesiones: 10 · Horas: 20",
    "Días y horario: lunes y viernes, 11:00 a 13:00",
    "Ubicación: Sala de Informática 2 y 3",
    "Prerrequisitos: ninguno",
    "Certificado en LinkedIn al finalizar",
  ].join("\n"),
  [
    "Introducción a Power BI — CLIPBI202602",
    "Fechas: 14 sep a 17 oct 2026 (semanas 4 a 8)",
    "Sesiones: 10 · Horas: 20",
    "Días y horario: martes y jueves, 16:00 a 18:00",
    "Ubicación: Sala de Informática 3",
    "Prerrequisitos: Excel Intermedio Virtualizado",
    "Certificado en LinkedIn al finalizar",
  ].join("\n"),
  [
    "Siigo Nube — CLSIN2020602",
    "Fechas: 14 sep a 17 oct 2026 (semanas 4 a 8)",
    "Sesiones: 10 · Horas: 20",
    "Días y horario: martes y jueves, 16:00 a 18:00",
    "Ubicación: Sala de Informática 3",
    "Prerrequisitos: Contabilidad de Inversión y Financiación",
    "Certificado en LinkedIn al finalizar",
  ].join("\n"),
];

async function seedCursosLibresChecklist() {
  const project = await prisma.project.findUnique({ where: { id: CL_PROJECT_ID }, select: { id: true } });
  if (!project) {
    console.log(`Checklist Cursos Libres omitido: no existe el proyecto ${CL_PROJECT_ID}.`);
    return;
  }

  // Limpia las viñetas genéricas anteriores (solo si nadie las marcó como hechas).
  const removed = await prisma.checklistItem.deleteMany({
    where: { projectId: CL_PROJECT_ID, text: { in: CL_OLD_BULLETS }, done: false },
  });

  const existing = await prisma.checklistItem.findMany({
    where: { projectId: CL_PROJECT_ID },
    select: { text: true },
  });
  const have = new Set(existing.map((e) => e.text));

  let order = existing.length;
  let created = 0;
  for (const text of CL_COURSE_ITEMS) {
    if (have.has(text)) continue;
    await prisma.checklistItem.create({ data: { projectId: CL_PROJECT_ID, text, order: order++ } });
    created++;
  }
  console.log(`Checklist Cursos Libres: ${created} ítems por curso creados, ${removed.count} viñetas viejas retiradas.`);
}

// --- Redes sociales ---------------------------------------------------------
async function seedSocialChannels() {
  const count = await prisma.socialChannel.count();
  if (count > 0) return;

  const channels: {
    platform: "INSTAGRAM" | "LINKEDIN" | "X" | "TIKTOK" | "YOUTUBE";
    handle: string | null;
    url: string | null;
    status: "ACTIVA" | "EN_RIESGO" | "EN_TRAMITE" | "INACTIVA" | "PERDIDA";
    officialStatus: "OFICIALIZADA" | "EN_TRAMITE" | "SIN_OFICIALIZAR";
    cadence: string | null;
    nextAction: string | null;
    notes: string | null;
    projectId: string | null;
  }[] = [
    {
      platform: "INSTAGRAM",
      handle: "@ui_fce",
      url: "https://instagram.com/ui_fce",
      status: "EN_TRAMITE",
      officialStatus: "EN_TRAMITE",
      cadence: "1 reel por semana (referencia histórica)",
      nextAction:
        "Consolidar la cuenta nueva, migrar contenidos disponibles y tramitar la oficialización ante Medios Digitales UNAL.",
      notes:
        "Cuenta anterior @uifce_un no se pudo recuperar. Cuenta nueva @ui_fce creada. Canal principal de la UIFCE (referencia: 25 reels, 83.649 visualizaciones el semestre pasado).",
      projectId: "redes-instagram",
    },
    {
      platform: "LINKEDIN",
      handle: "UIFCE",
      url: "https://www.linkedin.com/company/uifce",
      status: "ACTIVA",
      officialStatus: "OFICIALIZADA",
      cadence: "Aumentar frecuencia frente a 2026-1 (7 publicaciones/sem)",
      nextAction: "Construir calendario editorial propio y decidir migración a cuenta empresa.",
      notes: "Canal prioritario del semestre. Oficializado en 2026-1.",
      projectId: "redes-linkedin",
    },
    {
      platform: "X",
      handle: null,
      url: null,
      status: "INACTIVA",
      officialStatus: "SIN_OFICIALIZAR",
      cadence: null,
      nextAction: "Definir si se abre cuenta institucional en X y con qué formato propio.",
      notes: "Sin cuenta activa todavía.",
      projectId: null,
    },
    {
      platform: "TIKTOK",
      handle: null,
      url: null,
      status: "EN_TRAMITE",
      officialStatus: "EN_TRAMITE",
      cadence: null,
      nextAction: "Crear y oficializar la cuenta; definir formato propio (no réplica de reels).",
      notes: "Cuenta nueva del semestre. Plataforma nativa del video corto.",
      projectId: "redes-tiktok",
    },
    {
      platform: "YOUTUBE",
      handle: null,
      url: null,
      status: "EN_TRAMITE",
      officialStatus: "EN_TRAMITE",
      cadence: null,
      nextAction: "Cerrar oficialización ante Medios Digitales UNAL y resolver titularidad de la cuenta.",
      notes: "Trámite en curso desde 2025-2. Aloja los videos de Virtualización.",
      projectId: "redes-youtube",
    },
  ];

  for (let i = 0; i < channels.length; i++) {
    const c = channels[i];
    const project = c.projectId
      ? await prisma.project.findUnique({ where: { id: c.projectId }, select: { id: true } })
      : null;
    await prisma.socialChannel.create({
      data: {
        platform: c.platform,
        handle: c.handle,
        url: c.url,
        status: c.status,
        officialStatus: c.officialStatus,
        cadence: c.cadence,
        nextAction: c.nextAction,
        notes: c.notes,
        projectId: project?.id ?? null,
        order: i,
      },
    });
  }
  console.log(`Cuentas de redes sociales sembradas: ${channels.length}`);
}

// La cuenta @uifce_un no se recuperó: se creó @ui_fce. Mueve la fila de
// Instagram a la cuenta nueva SI todavía apunta a la vieja (no pisa ediciones
// manuales a otra cosa). Corre siempre.
async function reconcileInstagramNewAccount() {
  const ig = await prisma.socialChannel.findUnique({ where: { platform: "INSTAGRAM" } });
  if (!ig) return;
  if (ig.handle === "@ui_fce") return;
  if (ig.handle && ig.handle !== "@uifce_un") return;

  await prisma.socialChannel.update({
    where: { id: ig.id },
    data: {
      handle: "@ui_fce",
      url: "https://instagram.com/ui_fce",
      status: "EN_TRAMITE",
      officialStatus: "EN_TRAMITE",
      notes:
        "Cuenta anterior @uifce_un no se pudo recuperar. Cuenta nueva @ui_fce creada. Canal principal de la UIFCE (referencia: 25 reels, 83.649 visualizaciones el semestre pasado).",
      nextAction:
        "Consolidar la cuenta nueva, migrar contenidos disponibles y tramitar la oficialización ante Medios Digitales UNAL.",
    },
  });
  console.log("Instagram reconciliada a la cuenta nueva @ui_fce.");
}

// --- Plantillas -----------------------------------------------------------
async function seedTemplates() {
  const count = await prisma.template.count();
  if (count > 0) return;

  const templates: { name: string; category: string; format?: string; description?: string; notes?: string }[] = [
    {
      name: "Reel / video corto para redes",
      category: "Redes sociales",
      format: "Vertical 1080×1920",
      description: "Formato de mayor alcance del área. Cadencia de referencia: un reel por semana.",
      notes: "Pasa por el grupo \"Piezas Redes Sociales\" antes de publicar.",
    },
    {
      name: "Pieza gráfica para feed",
      category: "Redes sociales",
      format: "Cuadrada 1080×1080 / Vertical 1080×1350",
      description: "Cadencia de referencia: una pieza cada 15 días. Aplica paleta y tipografía institucional.",
    },
    {
      name: "Historia / Story",
      category: "Redes sociales",
      format: "Vertical 1080×1920",
      description: "Avisos rápidos, encuestas y difusión de eventos.",
    },
    {
      name: "Video de lanzamiento de Curso Libre",
      category: "Cursos Libres ofertados",
      format: "Vertical, ~20-30 s",
      description:
        "Guion estándar: \"Hola, soy [nombre]. Inscríbete al curso libre de [tema]. Vas a aprender [contenido].\" Se anima a variar el formato.",
    },
    {
      name: "Pieza de inscripción de Curso Libre",
      category: "Cursos Libres ofertados",
      format: "Cuadrada 1080×1080",
      description: "Nombre del curso, código, fechas, sesiones, horario, cupo y enlace de inscripción. Línea gráfica modular de CL.",
    },
    {
      name: "Plantilla de certificado",
      category: "Cursos Libres ofertados",
      format: "Horizontal A4",
      description: "Certificado de participación conforme a Imagen Institucional. Misma plantilla para microtalleres.",
    },
    {
      name: "Pieza para pantallas de oficina y pasillo",
      category: "Televisores de la unidad",
      format: "Horizontal 1920×1080",
      description: "Plantillas activas en la carpeta \"Piezas TV\" del Drive de ET.",
    },
    {
      name: "Cartelera digital edificios 310 y 311",
      category: "Televisores de la unidad",
      format: "Horizontal 1920×1080",
      description: "En articulación con la Dependencia de Comunicaciones de la Facultad.",
    },
    {
      name: "Correo de difusión",
      category: "Difusión por correo",
      format: "Correo HTML / texto",
      description: "Anuncio de evento, curso o convocatoria a la comunidad UIFCE. Asunto claro y un solo llamado a la acción.",
    },
    {
      name: "Boletín Digital UIFCE",
      category: "Difusión por correo",
      format: "Correo HTML",
      description: "Plantilla del boletín con secciones por área. Tres números por semestre.",
    },
    {
      name: "Pieza de disponibilidad de software por sala",
      category: "Disponibilidad de salas",
      format: "Horizontal para pantalla / A4 impreso",
      description: "Software disponible por sala. Tono informativo, evitar lenguaje restrictivo tipo \"prohibido\".",
    },
    {
      name: "Señalética de sala",
      category: "Disponibilidad de salas",
      format: "A4 / A3",
      description: "Normas de uso y horarios de la sala en tono informativo.",
    },
    {
      name: "Kit gráfico de evento",
      category: "Eventos",
      format: "Pieza feed + historia + pendón + certificado",
      description: "Set base para microtalleres, Semana UIFCE y Hackatón: anuncio, recordatorio, agenda y certificado.",
    },
    {
      name: "Registro de asistencia de evento",
      category: "Eventos",
      format: "Formulario / hoja de cálculo",
      description: "Control de asistencia efectiva para emitir certificados.",
    },
    {
      name: "Pieza de apoyo académico",
      category: "Apoyos académicos",
      format: "Cuadrada / Vertical",
      description: "Difusión de monitorías, asesorías y material de apoyo académico de la Facultad.",
    },
    {
      name: "Hack informático",
      category: "Apoyos académicos",
      format: "Vertical, video corto",
      description: "Tip o truco breve. Aplica la rúbrica de calificación de 2026-1 (duración, vigencia, calidad audiovisual).",
    },
  ];

  await prisma.template.createMany({
    data: templates.map((t, i) => ({
      name: t.name,
      category: t.category,
      format: t.format ?? null,
      description: t.description ?? null,
      notes: t.notes ?? null,
      order: i,
    })),
  });
  console.log(`Plantillas sembradas: ${templates.length}`);
}

async function main() {
  await seedProjectsFromCsv();
  await seedSituationStats();
  await seedTools();
  await seedContacts();
  await seedUsers();
  await dedupeSeededPeople();
  await seedStudyProjects();
  await seedBrandGuidelines();
  await seedCursosLibresChecklist();
  await seedSocialChannels();
  await reconcileInstagramNewAccount();
  await seedTemplates();

  // Cualquier proyecto sin semestre (creados antes de esta función) al vigente.
  const semesterId = await ensureCurrentSemester();
  const orphans = await prisma.project.updateMany({
    where: { semesterId: null },
    data: { semesterId },
  });
  if (orphans.count > 0) console.log(`Proyectos asignados a ${CURRENT_SEMESTER_LABEL}: ${orphans.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
