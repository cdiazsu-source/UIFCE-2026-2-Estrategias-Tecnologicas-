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

async function main() {
  await seedProjectsFromCsv();
  await seedSituationStats();
  await seedTools();
  await seedContacts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
