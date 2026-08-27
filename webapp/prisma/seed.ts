import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

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

async function seedProjectsFromCsv() {
  const csvText = fs.readFileSync(CSV_PATH, "utf-8");
  const rows: CsvRow[] = parse(csvText, { columns: true, skip_empty_lines: true });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const { category, priorityTag } = splitCategory(row["Categoría"]);

    const project = await prisma.project.upsert({
      where: { id: row.ID },
      update: {
        category,
        priorityTag,
        title: row["Actividad"],
        description: row["Qué se debe hacer"],
        expectedOutcome: row["Qué se espera"],
        rationale: row["Fundamento"],
        sourceOrder: i,
      },
      create: {
        id: row.ID,
        category,
        priorityTag,
        title: row["Actividad"],
        description: row["Qué se debe hacer"],
        expectedOutcome: row["Qué se espera"],
        rationale: row["Fundamento"],
        sourceOrder: i,
      },
    });

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
// Directorio inicial. Los correos de placeholder ("@example.com") se editan
// desde /equipo. Cesar Díaz queda con el correo real usado en el historial git.
async function seedUsers() {
  const count = await prisma.user.count();
  if (count > 0) return;

  const users = [
    { name: "Cesar Diaz", email: "cdiazsu@unal.edu.co", role: "MASTER" as const, area: "ET" },
    { name: "Mafe", email: "mafe@example.com", role: "JUNIOR_ARTES" as const, area: "ET" },
    { name: "Jean", email: "jean@example.com", role: "JUNIOR_AUXILIAR" as const, area: "ET" },
    { name: "Lina Sanabria", email: "lina.sanabria@example.com", role: "COORDINADOR" as const, area: null },
    { name: "Santiago Parra", email: "santiago.parra@example.com", role: "COORDINADOR" as const, area: null },
    { name: "Henry", email: "henry@example.com", role: "DIRECTOR" as const, area: null },
  ];

  await prisma.user.createMany({ data: users });
  console.log(`Usuarios sembrados: ${users.length}`);
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
    for (let i = 1; i <= 2; i++) {
      await prisma.studyProject.create({
        data: {
          ownerId: junior.id,
          title: `Proyecto de estudio ${i}`,
          order: i - 1,
          checkpoints: {
            create: CHECKPOINT_LABELS.map((label, idx) => ({ number: idx + 1, label })),
          },
        },
      });
      made++;
    }
  }
  console.log(`Proyectos de estudio sembrados: ${made} (${juniors.length} Junior x 2)`);
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
      body: "Toda pieza conserva la fuente institucional, el escudo, los márgenes y la asociación de la Unidad con azul y amarillo. Fuera de esos mínimos hay libertad creativa: se anima a variar la línea gráfica entre semestres para romper la monotonía visual.",
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
      title: "Azul y amarillo institucionales",
      body: "Son los colores asociados a la Unidad y a la Universidad Nacional. El amarillo funciona como acento sobre el azul; confirmar los valores exactos con el documento de Imagen Institucional antes de aplicarlos en piezas oficiales.",
    },
    {
      section: "Colores",
      title: "Azul pizarra — primario de la app",
      body: "Color primario de \"ET en Marcha\" (botones, encabezados, enlaces). Referencia interna, no institucional.",
      colorHex: "#263B44",
    },
    {
      section: "Colores",
      title: "Fondo cálido — base de la app",
      body: "Color de fondo de \"ET en Marcha\". Referencia interna, no institucional.",
      colorHex: "#FFF4D6",
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

async function main() {
  await seedProjectsFromCsv();
  await seedSituationStats();
  await seedTools();
  await seedContacts();
  await seedUsers();
  await seedStudyProjects();
  await seedBrandGuidelines();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
