/**
 * Carga en «Horas del equipo → Horario de oficina» los bloques de horario de los monitores Junior.
 *
 * Por qué es un script y no código del repositorio: el horario de una persona es un dato personal y el repositorio es
 * PÚBLICO. Los bloques viven solo en un archivo local que git ignora (webapp/private/horario-oficina.json) y de ahí pasan
 * a la BD.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/load-horario-oficina.mjs
 *     node scripts/load-horario-oficina.mjs --apply      <- aplica los cambios
 *
 * Qué hace (idempotente; se puede volver a correr): para cada persona del archivo, crea los bloques que falten (misma
 * persona, día, hora de inicio y de fin); no repite ni borra los que ya existan (si ya editaste uno en la app, lo respeta).
 * Requiere que la migración del horario esté aplicada (npm run db:deploy). Escribe en la BD de producción (la de
 * webapp/.env): lo corre una persona del equipo, no el agente.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const require = createRequire(join(root, "package.json"));
const APPLY = process.argv.includes("--apply");
const FILE = join(root, "private", "horario-oficina.json");

// Variables de webapp/.env (sin depender de dotenv).
if (existsSync(join(root, ".env"))) {
  for (const l of readFileSync(join(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const CATEGORIES = ["GESTION_CONOCIMIENTO", "PROYECTO_ESTUDIO", "PUNTO_INFORMACION", "PROYECTO", "APOYO_ACADEMICO", "CURSOS_LIBRES", "OFICINA"];
const BUILDINGS = ["310", "238"];
const fold = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const minutes = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`Hora no válida: ${hhmm}`);
  return Number(m[1]) * 60 + Number(m[2]);
};
const fmt = (n) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
const DAYS = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

if (!existsSync(FILE)) {
  console.error(`No encuentro ${FILE}. Es el archivo local con los horarios (no está en git).`);
  process.exit(1);
}
const data = JSON.parse(readFileSync(FILE, "utf8"));

const { PrismaClient } = require("@prisma/client");
const { PrismaNeon } = require("@prisma/adapter-neon");
const { Pool, neonConfig } = require("@neondatabase/serverless");
neonConfig.webSocketConstructor = require("ws");
const prisma = new PrismaClient({ adapter: new PrismaNeon(new Pool({ connectionString: process.env.DATABASE_URL })) });

try {
  const users = await prisma.user.findMany({
    where: { active: true, area: "ET", role: { in: ["MASTER", "JUNIOR_ARTES", "JUNIOR_AUXILIAR"] } },
    select: { id: true, name: true },
  });
  console.log(APPLY ? "MODO: aplicar cambios\n" : "MODO: solo mostrar (agrega --apply para aplicar)\n");

  let created = 0;
  let skipped = 0;
  for (const person of data.people) {
    const found = users.filter((u) => fold(u.name).includes(fold(person.match)));
    if (found.length !== 1) {
      console.error(`«${person.match}»: ${found.length === 0 ? "no encuentro a nadie" : "hay más de una persona"} con ese nombre; se omite.`);
      continue;
    }
    const user = found[0];
    const existing = await prisma.officeShift.findMany({ where: { userId: user.id }, select: { dayOfWeek: true, startMinutes: true, endMinutes: true } });
    console.log(`${user.name}`);
    for (const s of person.shifts) {
      const category = s.category;
      const location = s.location ?? "310";
      if (!CATEGORIES.includes(category)) throw new Error(`Categoría no válida: ${category}`);
      if (!BUILDINGS.includes(location)) throw new Error(`Edificio no válido: ${location}`);
      const start = minutes(s.start);
      const end = minutes(s.end);
      if (!(s.day >= 1 && s.day <= 6) || end <= start) throw new Error(`Bloque no válido: ${JSON.stringify(s)}`);
      const exists = existing.some((e) => e.dayOfWeek === s.day && e.startMinutes === start && e.endMinutes === end);
      const line = `${DAYS[s.day]} ${fmt(start)}–${fmt(end)} · ${category} · edificio ${location}`;
      if (exists) {
        skipped++;
        console.log(`  = ya está   ${line}`);
        continue;
      }
      created++;
      console.log(`  + ${APPLY ? "creado  " : "se crearía"} ${line}`);
      if (APPLY) {
        await prisma.officeShift.create({
          data: { userId: user.id, dayOfWeek: s.day, startMinutes: start, endMinutes: end, category, location, label: s.label ?? null },
        });
      }
    }
  }
  console.log(`\n${APPLY ? "Creados" : "Por crear"}: ${created} · ya existían: ${skipped}`);
} finally {
  await prisma.$disconnect();
}
