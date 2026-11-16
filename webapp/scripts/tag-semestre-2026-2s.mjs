/**
 * Agrega la etiqueta «2026-2S» a cada proyecto del semestre 2026-2S (los que tienen ese semestre asignado).
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/tag-semestre-2026-2s.mjs
 *     node scripts/tag-semestre-2026-2s.mjs --apply      <- aplica los cambios
 *
 * Es idempotente: no repite la etiqueta en los proyectos que ya la tienen ni toca las demás etiquetas.
 * Escribe en la BD de producción (la de webapp/.env): lo corre una persona del equipo, no el agente.
 * Se puede borrar después de usarlo.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const LABEL = "2026-2S";

const url = readFileSync(join(here, "..", ".env"), "utf8").match(/^DATABASE_URL="([^"]+)"/m)?.[1];
if (!url) {
  console.error("No encontré DATABASE_URL en webapp/.env");
  process.exit(1);
}

const { Pool, neonConfig } = await import("@neondatabase/serverless");
neonConfig.webSocketConstructor = (await import("ws")).default;

async function run() {
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    const sem = (await client.query(`SELECT id FROM "Semester" WHERE label = $1`, [LABEL])).rows[0];
    if (!sem) throw new Error(`El semestre ${LABEL} no existe (¿corriste npm run db:seed?).`);

    const all = (await client.query(`SELECT id, tags FROM "Project" WHERE "semesterId" = $1 ORDER BY "sourceOrder"`, [sem.id])).rows;
    const pending = all.filter((p) => !p.tags.includes(LABEL));
    const outside = (await client.query(`SELECT count(*)::int AS n FROM "Project" WHERE "semesterId" IS DISTINCT FROM $1`, [sem.id])).rows[0].n;

    console.log(`Proyectos del semestre ${LABEL}: ${all.length}`);
    console.log(`  ya tienen la etiqueta: ${all.length - pending.length}`);
    console.log(`  se les agregará:       ${pending.length}`);
    console.log(`Proyectos de otros semestres o sin semestre (no se tocan): ${outside}`);

    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    await client.query(
      `UPDATE "Project" SET tags = array_append(tags, $2), "updatedAt" = now()
       WHERE "semesterId" = $1 AND NOT ($2 = ANY(tags))`,
      [sem.id, LABEL],
    );
    await client.query("COMMIT");
    console.log(`\nListo: etiqueta «${LABEL}» agregada a ${pending.length} proyecto(s).`);
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
    if (/no existe/.test(String(e?.message))) process.exit(1);
    if (attempt < 4) await new Promise((r) => setTimeout(r, 4000));
  }
}
console.error("No se pudo completar tras 4 intentos. Reintenta o enciende WARP.");
process.exit(1);
