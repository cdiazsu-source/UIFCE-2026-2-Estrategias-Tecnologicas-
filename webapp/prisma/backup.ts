import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * Respaldo manual de la base de datos a un JSON con marca de tiempo.
 * Complementa (no reemplaza) el "point-in-time restore" de Neon — ver
 * webapp/README.md. Uso: `npm run db:backup`. Restaurar es manual: leer el
 * JSON y reinsertar con un script ad-hoc.
 */
const prisma = new PrismaClient();

async function main() {
  const outDir = path.resolve(__dirname, "../backups");
  fs.mkdirSync(outDir, { recursive: true });

  const [
    projects,
    checklistItems,
    projectNotes,
    situationStats,
    tools,
    contacts,
    users,
    studyProjects,
    studyCheckpoints,
    brandGuidelines,
  ] = await Promise.all([
    prisma.project.findMany(),
    prisma.checklistItem.findMany(),
    prisma.projectNote.findMany(),
    prisma.situationStat.findMany(),
    prisma.tool.findMany(),
    prisma.contact.findMany(),
    prisma.user.findMany(),
    prisma.studyProject.findMany(),
    prisma.studyCheckpoint.findMany(),
    prisma.brandGuideline.findMany(),
  ]);

  const dump = {
    exportedAt: new Date().toISOString(),
    counts: {
      projects: projects.length,
      checklistItems: checklistItems.length,
      projectNotes: projectNotes.length,
      situationStats: situationStats.length,
      tools: tools.length,
      contacts: contacts.length,
      users: users.length,
      studyProjects: studyProjects.length,
      studyCheckpoints: studyCheckpoints.length,
      brandGuidelines: brandGuidelines.length,
    },
    tables: {
      projects,
      checklistItems,
      projectNotes,
      situationStats,
      tools,
      contacts,
      users,
      studyProjects,
      studyCheckpoints,
      brandGuidelines,
    },
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = path.join(outDir, `backup-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(dump, null, 2), "utf-8");
  console.log(`Respaldo escrito: ${file}`);
  console.table(dump.counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
