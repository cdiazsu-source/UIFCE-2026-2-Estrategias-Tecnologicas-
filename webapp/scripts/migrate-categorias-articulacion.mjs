/**
 * Reasigna la categoría de los proyectos ya creados a la nueva clasificación (líneas de trabajo y
 * categorías «Articulación con …», «Canales digitales», «Mejora de procesos», etc.).
 *
 * Por qué hace falta: el seed NO pisa la categoría de un proyecto editado en la app, y la categoría vieja
 * por sí sola no alcanza para decidir el destino (p. ej. «Proyectos estratégicos» se reparte en tres).
 * La regla vive en scripts/categorias-articulacion-map.mjs (por id de proyecto) y coincide con
 * src/lib/category-groups.ts.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/migrate-categorias-articulacion.mjs
 *     node scripts/migrate-categorias-articulacion.mjs --apply      <- aplica los cambios
 *
 * Qué hace (es idempotente; se puede volver a correr):
 *   - Cambia solo `Project.category` de los proyectos con regla. No toca título, urgencia, estado,
 *     subtareas, bitácora ni la marca «editado en la app».
 *   - Lista aparte los proyectos «sin regla» (p. ej. los creados a mano en la app): no los cambia;
 *     asígnales la categoría desde la app o añádelos al mapa y vuelve a correr el script.
 *
 * Escribe en la BD de producción (la de webapp/.env): lo corre una persona del equipo, no el agente.
 * Se puede borrar después de usarlo.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { newCategoryFor } from "./categorias-articulacion-map.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

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
    const projects = (await client.query(`SELECT id, title, category FROM "Project" ORDER BY "sourceOrder", id`)).rows;

    const changes = [];
    const noRule = [];
    let already = 0;
    for (const p of projects) {
      const next = newCategoryFor(p.id, p.category);
      if (!next) noRule.push(p);
      else if (next === p.category) already++;
      else changes.push({ ...p, next });
    }

    console.log(`Proyectos en la BD: ${projects.length}`);
    console.log(`Ya con la categoría nueva: ${already}`);
    console.log(`Por cambiar: ${changes.length}`);
    for (const c of changes) console.log(`  ${c.id}\n    «${c.category}» → «${c.next}»`);
    if (noRule.length) {
      console.log(`\nSin regla (no se tocan): ${noRule.length}`);
      for (const p of noRule) console.log(`  ${p.id} · «${p.category}» · ${p.title}`);
    }

    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    for (const c of changes) {
      await client.query(`UPDATE "Project" SET category = $2 WHERE id = $1`, [c.id, c.next]);
    }
    await client.query("COMMIT");
    console.log(`\nListo: ${changes.length} proyectos reasignados.`);
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {}
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
    if (attempt < 4) await new Promise((r) => setTimeout(r, 4000));
  }
}
console.error("No se pudo completar tras 4 intentos. Reintenta o enciende WARP.");
process.exit(1);
