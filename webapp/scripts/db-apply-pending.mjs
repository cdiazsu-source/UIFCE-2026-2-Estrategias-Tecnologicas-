/**
 * Aplica las migraciones de Prisma pendientes contra Neon POR WEBSOCKET (:443),
 * para redes que bloquean el puerto 5432 de Postgres (campus UNAL, algunos ISP),
 * donde `prisma migrate deploy` no logra conectar.
 *
 *   Uso, desde webapp/:   node scripts/db-apply-pending.mjs
 *
 * Recorre prisma/migrations/, y para cada carpeta cuyo nombre NO esté en la
 * tabla _prisma_migrations, ejecuta su migration.sql y la registra con el mismo
 * checksum que usa Prisma (SHA-256 del archivo, con CRLF normalizado a LF).
 * Es idempotente: correrlo de nuevo cuando no hay pendientes no hace nada.
 *
 * NOTA: hace exactamente lo que haría `prisma migrate deploy`. No lo ejecuta el
 * agente; lo corre una persona del equipo (igual que `npm run db:deploy`).
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "prisma", "migrations");

const url = readFileSync(join(here, "..", ".env"), "utf8").match(/^DATABASE_URL="([^"]+)"/m)?.[1];
if (!url) {
  console.error("No encontré DATABASE_URL en webapp/.env");
  process.exit(1);
}

/** Mismo checksum que calcula Prisma: sha256 hex del archivo con CRLF -> LF. */
function checksum(sql) {
  return createHash("sha256").update(sql.replace(/\r\n/g, "\n")).digest("hex");
}

const pending = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()
  .map((name) => {
    const sql = readFileSync(join(migrationsDir, name, "migration.sql"), "utf8");
    return { name, sql, checksum: checksum(sql) };
  });

const { Pool, neonConfig } = await import("@neondatabase/serverless");
neonConfig.webSocketConstructor = (await import("ws")).default;

async function run() {
  const pool = new Pool({ connectionString: url });
  try {
    const applied = new Set(
      (await pool.query(`SELECT migration_name FROM "_prisma_migrations"`)).rows.map(
        (r) => r.migration_name,
      ),
    );
    const todo = pending.filter((m) => !applied.has(m.name));
    if (todo.length === 0) {
      console.log("No hay migraciones pendientes.");
      return;
    }
    for (const m of todo) {
      console.log(`Aplicando ${m.name} …`);
      await pool.query(m.sql); // el archivo puede tener varias sentencias
      await pool.query(
        `INSERT INTO "_prisma_migrations"
           (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
         VALUES (gen_random_uuid(), $1, now(), $2, now(), 1)`,
        [m.checksum, m.name],
      );
      console.log(`  ok`);
    }
    console.log(`Listo: ${todo.length} migración(es) aplicada(s).`);
  } finally {
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
    if (attempt < 4) await new Promise((r) => setTimeout(r, 4000));
  }
}
console.error("No se pudo conectar tras 4 intentos. Reintenta, enciende WARP, o usa el SQL Editor de Neon.");
process.exit(1);
