/**
 * Carga a la BD los profesores aliados académicos y sus apoyos (lo que ya muestra /aliados desde el archivo estático).
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría), después de `npm run db:deploy`:
 *     node scripts/load-aliados-academicos.mjs
 *     node scripts/load-aliados-academicos.mjs --apply      <- aplica los cambios
 *
 * Lee src/lib/academic-allies-data.ts (que genera scripts/generar-aliados-academicos.py desde el Excel de asignaciones).
 * Es idempotente: un profesor se identifica por su nombre y un apoyo por profesor + asignatura + programa; al repetirlo actualiza
 * las sesiones, el software y el estado, y NO toca las notas, el correo ni el seguimiento de convocatorias.
 * Para cargar un Excel nuevo: correr primero el generador, luego este script.
 * Escribe en la BD de producción (la de webapp/.env): lo corre una persona del equipo, no el agente.
 */
import { randomUUID } from "node:crypto";
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

// Cada apoyo ocupa una línea del .ts con un objeto JSON: «  {"p":"…","c":"…",…},».
const rows = readFileSync(join(here, "..", "src", "lib", "academic-allies-data.ts"), "utf8")
  .split(/\r?\n/)
  .filter((l) => l.trim().startsWith('{"p":'))
  .map((l) => JSON.parse(l.trim().replace(/,$/, "")));
if (rows.length === 0) {
  console.error("No encontré apoyos en src/lib/academic-allies-data.ts");
  process.exit(1);
}
const names = [...new Set(rows.map((r) => r.p))];

const { Pool, neonConfig } = await import("@neondatabase/serverless");
neonConfig.webSocketConstructor = (await import("ws")).default;

async function run() {
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    const have = new Set((await client.query(`SELECT name FROM "AcademicAlly"`)).rows.map((r) => r.name));
    const newNames = names.filter((n) => !have.has(n));
    console.log(`Profesores en el archivo: ${names.length}  (nuevos: ${newNames.length}, ya cargados: ${names.length - newNames.length})`);
    console.log(`Apoyos (profesor + asignatura + programa): ${rows.length}`);

    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    const ids = new Map();
    for (const name of names) {
      const r = await client.query(
        `INSERT INTO "AcademicAlly" (id, name, "updatedAt") VALUES ($1, $2, now())
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [`ally_${randomUUID().replace(/-/g, "").slice(0, 20)}`, name],
      );
      ids.set(name, r.rows[0].id);
    }
    for (const r of rows) {
      await client.query(
        `INSERT INTO "AcademicAllySupport" (id, "allyId", course, program, "mallaCourse", sessions, software, states, "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb, now())
         ON CONFLICT ("allyId", course, program)
         DO UPDATE SET "mallaCourse" = EXCLUDED."mallaCourse", sessions = EXCLUDED.sessions, software = EXCLUDED.software,
                       states = EXCLUDED.states, "updatedAt" = now()`,
        [`sup_${randomUUID().replace(/-/g, "").slice(0, 20)}`, ids.get(r.p), r.c, r.pg, r.m, JSON.stringify(r.s), r.w, JSON.stringify(r.e)],
      );
    }
    await client.query("COMMIT");
    console.log(`\nListo: ${names.length} profesor(es) y ${rows.length} apoyo(s) cargados o actualizados.`);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

for (let attempt = 1; attempt <= 4; attempt++) {
  try {
    if (attempt > 1) console.log(`Reintento ${attempt}…`);
    await run();
    process.exit(0);
  } catch (e) {
    console.log(`  falló: ${(e?.message || e).toString().split("\n")[0]}`);
    if (/does not exist|no existe/.test(String(e?.message))) {
      console.error("Falta aplicar la migración: corre antes `npm run db:deploy`.");
      process.exit(1);
    }
    if (attempt < 4) await new Promise((r) => setTimeout(r, 4000));
  }
}
console.error("No se pudo completar tras 4 intentos. Reintenta o enciende WARP.");
process.exit(1);
