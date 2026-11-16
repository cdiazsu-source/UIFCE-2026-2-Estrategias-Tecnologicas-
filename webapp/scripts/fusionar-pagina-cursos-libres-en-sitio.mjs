/**
 * Fusiona la «Página permanente de oferta de Cursos Libres» (carpeta 2.2.7) dentro del «Sitio estático de oferta
 * permanente de la ruta de aprendizaje…» (carpeta 2.2.6), 2026-11-16. El sitio estático incluye y amplía la página.
 *
 *   - La nota de bitácora de la página («Avance: publicada la página permanente…») pasa al sitio.
 *   - El sitio suma la subtarea ya hecha «Página permanente con la oferta vigente de Cursos Libres publicada
 *     (fusionada desde su proyecto propio).» y su descripción menciona que la página ya está publicada.
 *   - Si el sitio estaba «Por iniciar», pasa a «En curso» (ya tiene trabajo hecho).
 *   - Se elimina el proyecto de la página (pagina-permanente-de-oferta-de-cursos-libres). Es manual (no viene del CSV),
 *     así que el seed no lo vuelve a crear.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/fusionar-pagina-cursos-libres-en-sitio.mjs
 *     node scripts/fusionar-pagina-cursos-libres-en-sitio.mjs --apply      <- aplica los cambios
 *
 * Es idempotente. Escribe en la BD de producción (la de webapp/.env): lo corre una persona del equipo, no el
 * agente. Se puede borrar después de usarlo.
 */
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

const FROM_ID = "pagina-permanente-de-oferta-de-cursos-libres";
const TO_ID = "sitio-estatico-de-oferta-permanente-de-la-ruta-de-aprendizaj";
const NEW_ITEM = "Página permanente con la oferta vigente de Cursos Libres publicada (fusionada desde su proyecto propio).";
const DESC_ADDENDUM = " Incluye la página permanente con la oferta vigente de Cursos Libres, que ya está publicada.";

const url = readFileSync(join(here, "..", ".env"), "utf8").match(/^DATABASE_URL="([^"]+)"/m)?.[1];
if (!url) {
  console.error("No encontré DATABASE_URL en webapp/.env");
  process.exit(1);
}

const { Pool, neonConfig } = await import("@neondatabase/serverless");
neonConfig.webSocketConstructor = (await import("ws")).default;

async function withRetry(fn, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries) throw e;
      console.warn(`Intento ${i} falló (${e.message}); reintento…`);
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

async function run() {
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    const from = (await client.query(`SELECT id, status FROM "Project" WHERE id = $1`, [FROM_ID])).rows[0];
    const to = (await client.query(`SELECT id, status, description FROM "Project" WHERE id = $1`, [TO_ID])).rows[0];
    if (!to) throw new Error(`No existe el proyecto destino ${TO_ID}.`);
    if (!from) {
      console.log("La página permanente ya no existe como proyecto propio: nada que fusionar.");
      return;
    }
    const notes = (await client.query(`SELECT id FROM "ProjectNote" WHERE "projectId" = $1`, [FROM_ID])).rows;
    const items = (await client.query(`SELECT text, "order" FROM "ChecklistItem" WHERE "projectId" = $1`, [TO_ID])).rows;
    const hasItem = items.some((i) => i.text === NEW_ITEM);
    const hasDesc = to.description.includes("Incluye la página permanente");

    console.log(`Se fusiona «${FROM_ID}» (${from.status}) dentro de «${TO_ID}» (${to.status}).`);
    console.log(`  notas de bitácora que pasan al sitio: ${notes.length}`);
    console.log(hasItem ? "  la subtarea de la página ya existe." : `  subtarea nueva (hecha): «${NEW_ITEM}»`);
    console.log(hasDesc ? "  la descripción ya la menciona." : "  se agrega una frase a la descripción del sitio.");
    console.log(`  estado del sitio: ${to.status}${to.status === "POR_INICIAR" ? " -> EN_CURSO" : " (no cambia)"}`);
    console.log(`  se elimina el proyecto «${FROM_ID}».`);

    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    await client.query(`UPDATE "ProjectNote" SET "projectId" = $2 WHERE "projectId" = $1`, [FROM_ID, TO_ID]);
    if (!hasItem) {
      const next = items.reduce((m, i) => Math.max(m, i.order), -1) + 1;
      await client.query(
        `INSERT INTO "ChecklistItem" (id, "projectId", text, "order", done, "mentionIds", "updatedAt") VALUES ($1, $2, $3, $4, true, '{}', now())`,
        ["ci" + randomBytes(10).toString("hex"), TO_ID, NEW_ITEM, next],
      );
    }
    await client.query(
      `UPDATE "Project" SET description = CASE WHEN $3 THEN description ELSE description || $2 END,
         status = CASE WHEN status = 'POR_INICIAR' THEN 'EN_CURSO' ELSE status END,
         "editedInApp" = true, "updatedAt" = now() WHERE id = $1`,
      [TO_ID, DESC_ADDENDUM, hasDesc],
    );
    await client.query(`DELETE FROM "Project" WHERE id = $1`, [FROM_ID]);
    await client.query("COMMIT");
    console.log("\nListo: página fusionada dentro del sitio estático.");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

await withRetry(run);
