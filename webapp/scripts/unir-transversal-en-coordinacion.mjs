/**
 * Une la categoría «Articulación transversal» con «Articulación con Coordinación» y completa las etiquetas de carpeta (2026-11-16).
 *
 *   - Acompañamiento Interárea (acompanamiento-interarea): categoría -> «Articulación con Coordinación»
 *     y etiqueta de carpeta -> carpeta-2.5.3 (antes carpeta-2.6.1).
 *   - Feria de Servicios e Innovación (semana-uifce-feria): etiqueta -> carpeta-4.1.6; Página permanente de oferta
 *     de Eventos (pagina-permanente-de-oferta-de-eventos): etiqueta -> carpeta-4.1.7 (hasta hoy sin etiqueta).
 *   - Propuesta de reorganización del Drive con GC (documentacion-propuesta-drive-gc): etiqueta -> carpeta-2.6.1
 *     (antes carpeta-2.7.1), porque la carpeta 2.6 de Gestión del Conocimiento ocupa el lugar de la transversal.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/unir-transversal-en-coordinacion.mjs
 *     node scripts/unir-transversal-en-coordinacion.mjs --apply      <- aplica los cambios
 *
 * Es idempotente. Escribe en la BD de producción (la de webapp/.env): lo corre una persona del equipo, no el
 * agente. Se puede borrar después de usarlo.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const NEW_CATEGORY = "Articulación con Coordinación";

/** id -> { categoría nueva (opcional), etiqueta de carpeta nueva } */
const CHANGES = {
  "acompanamiento-interarea": { category: NEW_CATEGORY, tag: "carpeta-2.5.3" },
  "documentacion-propuesta-drive-gc": { tag: "carpeta-2.6.1" },
  "semana-uifce-feria": { tag: "carpeta-4.1.6" },
  "pagina-permanente-de-oferta-de-eventos": { tag: "carpeta-4.1.7" },
};

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
    const rows = (await client.query(`SELECT id, category, tags FROM "Project" WHERE id = ANY($1)`, [Object.keys(CHANGES)])).rows;
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const [id, c] of Object.entries(CHANGES)) {
      const r = byId.get(id);
      if (!r) {
        console.log(`${id}: no existe en la BD (se omite).`);
        continue;
      }
      const folder = r.tags.filter((t) => t.startsWith("carpeta-")).join(", ") || "(sin etiqueta)";
      console.log(`${id}`);
      if (c.category) console.log(`  categoría: ${r.category}  ->  ${c.category}`);
      console.log(`  etiqueta:  ${folder}  ->  ${c.tag}`);
    }
    const left = (await client.query(`SELECT id FROM "Project" WHERE category = 'Articulación transversal'`)).rows;
    console.log(`Proyectos que seguirán en «Articulación transversal»: ${left.filter((r) => !CHANGES[r.id]?.category).map((r) => r.id).join(", ") || "ninguno"}`);

    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    for (const [id, c] of Object.entries(CHANGES)) {
      if (!byId.has(id)) continue;
      if (c.category) await client.query(`UPDATE "Project" SET category = $2, "updatedAt" = now() WHERE id = $1`, [id, c.category]);
      await client.query(
        `UPDATE "Project" SET tags = array_append(array(SELECT t FROM unnest(tags) AS t WHERE t NOT LIKE 'carpeta-%'), $2::text), "updatedAt" = now() WHERE id = $1`,
        [id, c.tag],
      );
    }
    await client.query("COMMIT");
    console.log("\nListo: categoría y etiquetas de carpeta actualizadas.");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

await withRetry(run);
