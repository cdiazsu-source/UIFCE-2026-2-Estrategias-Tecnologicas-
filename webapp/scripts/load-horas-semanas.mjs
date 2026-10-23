/**
 * Carga en «Horas del equipo» las semanas ya transcurridas del semestre (por ejemplo, de la 1 a la 8) con las horas de cada
 * persona: crea las semanas (lunes a sábado) y un registro por categoría o proyecto, con las horas dadas por hechas.
 *
 * Por qué es un script y no código del repositorio: son horas de personas concretas y el repositorio es PÚBLICO. Los datos
 * viven solo en un archivo local que git ignora (webapp/private/horas-semanas-1-8.json) y de ahí pasan a la BD.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/load-horas-semanas.mjs
 *     node scripts/load-horas-semanas.mjs --apply      <- aplica los cambios
 *     node scripts/load-horas-semanas.mjs --file private/otro.json   <- otro archivo de datos
 *
 * Qué hace (idempotente; se puede volver a correr):
 *   - Antes de tocar la BD revisa que cada persona sume la meta (20 h) en cada semana; si no, se detiene.
 *   - Crea las semanas que falten en el semestre vigente (no toca las que ya existan).
 *   - Crea los registros que falten (misma semana, persona, categoría y proyecto o título); no repite ni modifica los que
 *     ya existan, así que lo que ya hayas editado en la app se respeta.
 *   - Los registros nacen «Terminada» con las horas hechas = planeadas, porque son semanas ya cerradas.
 * Requiere que la migración de horas esté aplicada (npm run db:deploy). Escribe en la BD de producción (la de webapp/.env):
 * lo corre una persona del equipo, no el agente.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, isAbsolute } from "node:path";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const require = createRequire(join(root, "package.json"));
const APPLY = process.argv.includes("--apply");
const fileArg = process.argv.indexOf("--file");
const FILE = fileArg > -1 ? (isAbsolute(process.argv[fileArg + 1]) ? process.argv[fileArg + 1] : join(root, process.argv[fileArg + 1])) : join(root, "private", "horas-semanas-1-8.json");

// Variables de webapp/.env (sin depender de dotenv).
if (existsSync(join(root, ".env"))) {
  for (const l of readFileSync(join(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const CATEGORIES = ["GESTION_CONOCIMIENTO", "PROYECTO_ESTUDIO", "PUNTO_INFORMACION", "PROYECTO", "APOYO_ACADEMICO", "CURSOS_LIBRES"];
const fold = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const DAY = 24 * 60 * 60 * 1000;
const h = (n) => String(Math.round(n * 100) / 100).replace(".", ",");

if (!existsSync(FILE)) {
  console.error(`No encuentro ${FILE}. Es el archivo local con las horas (no está en git).`);
  process.exit(1);
}
const data = JSON.parse(readFileSync(FILE, "utf8"));
const N = data.weeks;
const TARGET = data.targetPerWeek ?? 20;

// 1) Revisión previa, sin tocar la BD: cada fila tiene N números y cada persona suma la meta cada semana.
let problems = 0;
for (const p of data.people) {
  for (const r of p.rows) {
    if (!CATEGORIES.includes(r.category)) throw new Error(`Categoría no válida: ${r.category}`);
    if (!Array.isArray(r.hours) || r.hours.length !== N) throw new Error(`«${r.title ?? r.projectId}» (${p.match}) debe tener ${N} números.`);
    if (!r.title && !r.projectId) throw new Error(`Una fila de ${p.match} no tiene título ni proyecto.`);
  }
  const totals = Array.from({ length: N }, (_, i) => p.rows.reduce((a, r) => a + r.hours[i], 0));
  const bad = totals.map((t, i) => (t === TARGET ? null : `S${i + 1}=${h(t)}`)).filter(Boolean);
  console.log(`${p.match.padEnd(16)} totales por semana: ${totals.map(h).join(" ")}${bad.length ? `   <-- NO SUMA ${TARGET}: ${bad.join(", ")}` : ""}`);
  problems += bad.length;
}
if (problems > 0) {
  console.error(`\nHay semanas que no suman ${TARGET} h. Corrige el archivo y vuelve a correrlo.`);
  process.exit(1);
}
console.log(`\nTodas las personas suman ${TARGET} h en cada una de las ${N} semanas.\n`);

// 2) Con la BD.
const { PrismaClient } = require("@prisma/client");
const { PrismaNeon } = require("@prisma/adapter-neon");
const { Pool, neonConfig } = require("@neondatabase/serverless");
neonConfig.webSocketConstructor = require("ws");
const prisma = new PrismaClient({ adapter: new PrismaNeon(new Pool({ connectionString: process.env.DATABASE_URL })) });

try {
  console.log(APPLY ? "MODO: aplicar cambios\n" : "MODO: solo mostrar (agrega --apply para aplicar)\n");
  const semester = await prisma.semester.findFirst({ where: { isCurrent: true }, select: { id: true, label: true } });
  if (!semester) throw new Error("No hay un semestre vigente.");
  const users = await prisma.user.findMany({
    where: { active: true, area: "ET", role: { in: ["MASTER", "JUNIOR_ARTES", "JUNIOR_AUXILIAR"] } },
    select: { id: true, name: true },
  });
  const projectIds = new Set((await prisma.project.findMany({ select: { id: true } })).map((p) => p.id));

  // Semanas: lunes a sábado desde firstWeekStart, de 7 en 7 días.
  const first = new Date(`${data.firstWeekStart}T00:00:00Z`);
  const weekIds = [];
  let weeksCreated = 0;
  for (let i = 0; i < N; i++) {
    const number = i + 1;
    const start = new Date(first.getTime() + i * 7 * DAY);
    const end = new Date(start.getTime() + 5 * DAY);
    const found = await prisma.hourWeek.findFirst({ where: { semesterId: semester.id, number }, select: { id: true } });
    if (found) {
      weekIds.push(found.id);
      console.log(`= semana ${number} ya existe`);
    } else {
      weeksCreated++;
      console.log(`+ ${APPLY ? "creada  " : "se crearía"} semana ${number} (${start.toISOString().slice(0, 10)} a ${end.toISOString().slice(0, 10)})`);
      weekIds.push(APPLY ? (await prisma.hourWeek.create({ data: { semesterId: semester.id, number, startDate: start, endDate: end } })).id : null);
    }
  }

  let created = 0;
  let skipped = 0;
  for (const person of data.people) {
    const found = users.filter((u) => fold(u.name).includes(fold(person.match)));
    if (found.length !== 1) {
      console.error(`\n«${person.match}»: ${found.length === 0 ? "no encuentro a nadie" : "hay más de una persona"} con ese nombre; se omite.`);
      continue;
    }
    const user = found[0];
    console.log(`\n${user.name}`);
    for (const r of person.rows) {
      let projectId = null;
      if (r.projectId) {
        if (projectIds.has(r.projectId)) projectId = r.projectId;
        else console.warn(`  ! el proyecto «${r.projectId}» no existe en la app; se carga solo con el título.`);
      }
      const title = r.title ?? null;
      for (let i = 0; i < N; i++) {
        const hours = r.hours[i];
        if (!hours) continue;
        const weekId = weekIds[i];
        const label = `S${i + 1} · ${h(hours)} h · ${r.category} · ${title ?? r.projectId}`;
        const existing = weekId
          ? await prisma.hourEntry.findFirst({
              where: { weekId, userId: user.id, category: r.category, ...(projectId ? { projectId } : { projectId: null, title }) },
              select: { id: true },
            })
          : null;
        if (existing) {
          skipped++;
          console.log(`  = ya está   ${label}`);
          continue;
        }
        created++;
        console.log(`  + ${APPLY ? "creado  " : "se crearía"} ${label}`);
        if (APPLY) {
          await prisma.hourEntry.create({
            data: { weekId, userId: user.id, category: r.category, title, plannedHours: hours, doneHours: hours, status: "TERMINADA", projectId },
          });
        }
      }
    }
  }
  console.log(`\n${APPLY ? "Creados" : "Por crear"}: ${weeksCreated} semana(s) y ${created} registro(s) · ya existían: ${skipped}`);
} finally {
  await prisma.$disconnect();
}
