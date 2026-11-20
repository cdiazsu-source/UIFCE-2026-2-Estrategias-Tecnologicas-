/**
 * Sube la «Red de Aliados Académicos UIFCE» de Backlog a «Próximo ciclo».
 *
 * Con la sección «Aliados académicos» de /aliados (profesores con apoyos y mallas) la red deja de estar solo en idea: ya tiene su base
 * de aliados. El CSV de planeación y la lista IDEAS ya dicen «Próximo ciclo»; este script lo lleva al proyecto que ya existe en la BD,
 * porque el seed no pisa lo ya creado.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/priorizar-red-aliados-academicos.mjs
 *     node scripts/priorizar-red-aliados-academicos.mjs --apply      <- aplica el cambio
 *
 * Es idempotente: si el proyecto ya está en Próximo ciclo (o en Atención inmediata) no hace nada.
 * Escribe en la BD de producción (la de webapp/.env): lo corre una persona del equipo, no el agente.
 * Se puede borrar después de usarlo.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const ID = "estrategicos-red-aliados-academicos";

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
    const p = (await client.query(`SELECT id, title, "priorityTag" FROM "Project" WHERE id = $1`, [ID])).rows[0];
    if (!p) throw new Error(`El proyecto ${ID} no existe (¿corriste npm run db:seed?).`);

    console.log(`Proyecto: ${p.title}`);
    console.log(`Prioridad actual: ${p.priorityTag ?? "(sin prioridad)"}`);

    if (p.priorityTag === "PROXIMO_CICLO" || p.priorityTag === "ATENCION_INMEDIATA") {
      console.log("\nYa está en Próximo ciclo o por encima: no hay nada que cambiar.");
      return;
    }
    if (!APPLY) {
      console.log("\nSimulación: pasaría a «Próximo ciclo». Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    await client.query(`UPDATE "Project" SET "priorityTag" = 'PROXIMO_CICLO', "updatedAt" = now() WHERE id = $1`, [ID]);
    await client.query("COMMIT");
    console.log("\nListo: el proyecto pasó a «Próximo ciclo».");
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
