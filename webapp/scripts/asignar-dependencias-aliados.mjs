/**
 * Asigna la dependencia (Contact.dependency) a los aliados que ya estaban en /aliados, para que queden en su grupo de
 * «Aliados dependencias». Solo toca a quien aún NO tiene dependencia escrita: lo que ya se editó en la app no se pisa.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría), después de `npm run db:deploy`:
 *     node scripts/asignar-dependencias-aliados.mjs
 *     node scripts/asignar-dependencias-aliados.mjs --apply      <- aplica los cambios
 *
 * Idempotente. Quien no aparece en la lista (ex-monitores, profesores invitados) se queda en «Otros aliados».
 * Escribe en la BD de producción (la de webapp/.env): lo corre una persona del equipo, no el agente.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

const url = readFileSync(join(here, "..", ".env"), "utf8").match(/^DATABASE_URL="([^"]+)"/m)?.[1];
if (!url) {
  console.error("No encontré DATABASE_URL en webapp/.env");
  process.exit(1);
}

const UIFCE = "Unidad de Informática (UIFCE)";

/** Nombre del aliado (sin tildes ni mayúsculas) → dependencia. */
const ASSIGN = [
  ["carlos osorio ramirez", "CIID"],
  ["daniel martinez", "ORI"],
  ["sandra carlos vargas", "Vicedecanatura"],
  ["diana yelithza villada correa", "Vicedecanatura"],
  ["bienestar", "Dirección de Bienestar"],
  ["yony chaparro", UIFCE],
  ["jonny", UIFCE],
  ["angela fierro", UIFCE],
];

const norm = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

const { Pool, neonConfig } = await import("@neondatabase/serverless");
neonConfig.webSocketConstructor = (await import("ws")).default;

const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  const rows = (await client.query(`SELECT id, name, role, dependency FROM "Contact" ORDER BY name`)).rows;
  let changes = 0;
  for (const r of rows) {
    const hit = ASSIGN.find(([n]) => n === norm(r.name));
    if (!hit) {
      console.log(`  (sin cambio)  ${r.name} [${r.role}] -> ${r.dependency ?? "Otros aliados"}`);
      continue;
    }
    if (r.dependency) {
      console.log(`  (ya tiene)    ${r.name} -> ${r.dependency}`);
      continue;
    }
    console.log(`  ASIGNA        ${r.name} [${r.role}] -> ${hit[1]}`);
    changes++;
    if (APPLY) await client.query(`UPDATE "Contact" SET dependency = $1, "updatedAt" = now() WHERE id = $2`, [hit[1], r.id]);
  }
  console.log(APPLY ? `\nListo: ${changes} aliado(s) actualizado(s).` : `\nSimulación: no se cambió nada (${changes} por asignar). Para aplicar, corre con --apply.`);
} finally {
  client.release();
  await pool.end();
}
