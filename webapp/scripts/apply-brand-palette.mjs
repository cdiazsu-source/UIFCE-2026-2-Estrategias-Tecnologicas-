/**
 * Agrega a la guía «Línea gráfica» de la app la paleta cromática OFICIAL de la UIFCE
 * y la paleta de UIFCITO (prisma/brand-palette-uifce.json), y marca como provisional
 * la gama anterior de la app.
 *
 * Por qué hace falta: el seed solo siembra la línea gráfica cuando la tabla está vacía,
 * así que en la base de datos en vivo estas indicaciones no aparecerían solas.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/apply-brand-palette.mjs
 *     node scripts/apply-brand-palette.mjs --apply      <- aplica los cambios
 *
 * Qué hace (solo la tabla BrandGuideline):
 *   - inserta las indicaciones que falten (se identifican por sección + título);
 *   - actualiza el texto (y el color) de las que ya existan si el JSON cambió, incluida
 *     «Paleta propia de la Unidad de Informática».
 * No borra nada y es idempotente. Escribe en la BD de producción (la de webapp/.env):
 * lo corre una persona del equipo, no el agente. Se puede borrar después de usarlo.
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
const data = JSON.parse(readFileSync(join(here, "..", "prisma", "brand-palette-uifce.json"), "utf8"));

const { Pool, neonConfig } = await import("@neondatabase/serverless");
neonConfig.webSocketConstructor = (await import("ws")).default;

async function run() {
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    const existing = (await client.query(`SELECT id, section, title, body, "colorHex" FROM "BrandGuideline"`)).rows;
    const key = (s, t) => `${s}\u0000${t}`;
    const byKey = new Map(existing.map((r) => [key(r.section, r.title), r]));

    const toAdd = data.add.filter((g) => !byKey.has(key(g.section, g.title)));
    // Indicaciones del JSON que ya existen pero cuyo texto o color cambió (p. ej. al ajustar la redacción).
    const changedAdds = data.add
      .map((g) => ({ u: g, row: byKey.get(key(g.section, g.title)) }))
      .filter(({ u, row }) => row && (row.body !== u.body || (row.colorHex ?? null) !== (u.colorHex ?? null)));
    const toUpdate = [
      ...data.updates
        .map((u) => ({ u, row: byKey.get(key(u.section, u.title)) }))
        .filter(({ u, row }) => row && row.body !== u.body),
      ...changedAdds,
    ];
    const missingTargets = data.updates.filter((u) => !byKey.has(key(u.section, u.title)));

    console.log(`Indicaciones actuales: ${existing.length}`);
    for (const g of toAdd) console.log(`  agregar    [${g.section}] ${g.title}${g.colorHex ? `  ${g.colorHex}` : ""}`);
    for (const { u } of toUpdate) console.log(`  actualizar [${u.section}] ${u.title}`);
    for (const u of missingTargets) console.log(`  (no existe, se omite) [${u.section}] ${u.title}`);
    if (toAdd.length === 0 && toUpdate.length === 0) {
      console.log("\nNo hay nada por hacer: la guía ya está al día.");
      return;
    }

    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    let order = ((await client.query(`SELECT COALESCE(MAX("order"), -1) AS m FROM "BrandGuideline"`)).rows[0].m ?? -1) + 1;
    for (const g of toAdd) {
      await client.query(
        `INSERT INTO "BrandGuideline" (id, section, title, body, "colorHex", "order", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, now())`,
        [randomUUID(), g.section, g.title, g.body, g.colorHex ?? null, order++],
      );
    }
    for (const { u, row } of toUpdate) {
      await client.query(
        `UPDATE "BrandGuideline" SET body = $2, "colorHex" = COALESCE($3, "colorHex"), "updatedAt" = now() WHERE id = $1`,
        [row.id, u.body, u.colorHex ?? null],
      );
    }
    await client.query("COMMIT");
    console.log(`\nListo: ${toAdd.length} agregada(s), ${toUpdate.length} actualizada(s).`);
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
    if (attempt < 4) await new Promise((r) => setTimeout(r, 4000));
  }
}
console.error("No se pudo completar tras 4 intentos. Reintenta, enciende WARP, o edita la guía desde /linea-grafica.");
process.exit(1);
