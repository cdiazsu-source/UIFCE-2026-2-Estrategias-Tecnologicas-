/**
 * Deja el proyecto «Propuesta de reorganización del Drive UIFCE ante Gestión del Conocimiento (GC)» como lo que
 * resultó ser: un proyecto hecho con GC (infografía + guía didáctica de cómo quedaron las carpetas de 2026-2 y
 * promoción de un formato único para nombrar carpetas), ya finalizado.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/finalizar-propuesta-drive-gc.mjs
 *     node scripts/finalizar-propuesta-drive-gc.mjs --apply      <- aplica los cambios
 *
 * Qué cambia en ese único proyecto (id documentacion-propuesta-drive-gc):
 *   - categoría -> «Articulación con Gestión del Conocimiento»; estado -> COMPLETADO; solicitante -> GC
 *   - descripción, resultado esperado y fundamento reescritos
 *   - se agregan 2 enlaces (la página «Mapa del Drive UIFCE» y su repositorio), sin repetir los que ya tenga
 *   - subtareas: las 3 existentes quedan hechas (la tercera se reescribe) y se suma la de la infografía
 *   - editedInApp = true, para que el resync desde el CSV no pise estos cambios
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

const ID = "documentacion-propuesta-drive-gc";
const CATEGORY = "Articulación con Gestión del Conocimiento";
const LINKS = [
  { label: "Mapa del Drive UIFCE (página)", url: "https://cdiazsu-source.github.io/ET-Organizaci-nDeCarpetas-GC/" },
  { label: "Repositorio de la guía en GitHub", url: "https://github.com/cdiazsu-source/ET-Organizaci-nDeCarpetas-GC" },
];

const DESCRIPTION =
  "Hacer con Gestión del Conocimiento (GC) una infografía interactiva y su guía didáctica que muestran cómo quedó organizado el Drive de la UIFCE en 2026-2 (las siete áreas, sus carpetas de proceso y las reglas de numeración y escritura), y promover con GC un formato único para nombrar carpetas: «Código. SIGLA - Concepto - Semestre». El resultado es la página «Mapa del Drive UIFCE», con explorador de las siete áreas, anatomía del nombre de una carpeta y validador de nombres en tiempo real.";
const EXPECTED =
  "Una infografía y una guía didáctica publicadas, que cualquier monitor puede consultar para ubicar y nombrar sus carpetas, y un formato único de nombres que GC promueve en todas las áreas. Proyecto finalizado.";
const RATIONALE =
  "El diagnóstico identificó que el conocimiento del área se pierde si no se organiza, y la reunión de empalme llegó de forma independiente a la misma conclusión. Como el Drive general lo administra GC y no ET, la propuesta se resolvió como un proyecto conjunto: ET aporta el diseño (línea gráfica de la UIFCE y su mascota) y GC la guía de nomenclatura, de cuyo cumplimiento vela.";

const TEXT_THIRD_OLD = "Aval de GC y plan de migración acordado.";
const TEXT_THIRD_NEW = "Guía didáctica de cómo quedaron las carpetas y promoción del formato único de nombres, con GC.";
const TEXT_NEW_ITEM = "Infografía interactiva «Mapa del Drive UIFCE» publicada.";

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
    const p = (await client.query(`SELECT id, category, status, "requesterArea", links, "editedInApp" FROM "Project" WHERE id = $1`, [ID])).rows[0];
    if (!p) throw new Error(`No existe el proyecto ${ID} (¿corriste npm run db:seed?).`);
    const items = (await client.query(`SELECT id, text, done, "order" FROM "ChecklistItem" WHERE "projectId" = $1 ORDER BY "order"`, [ID])).rows;

    const links = Array.isArray(p.links) ? p.links : [];
    const newLinks = LINKS.filter((l) => !links.some((x) => x.url === l.url));
    const hasNewItem = items.some((i) => i.text === TEXT_NEW_ITEM);
    const maxOrder = items.reduce((m, i) => Math.max(m, i.order), -1);

    console.log(`Proyecto: ${ID}`);
    console.log(`  categoría:   ${p.category}  ->  ${CATEGORY}`);
    console.log(`  estado:      ${p.status}  ->  COMPLETADO`);
    console.log(`  solicitante: ${p.requesterArea ?? "(vacío)"}  ->  GC`);
    console.log(`  enlaces:     ${links.length}  ->  +${newLinks.length}`);
    console.log(`  subtareas (${items.length}):`);
    for (const i of items) {
      const to = i.text === TEXT_THIRD_OLD ? `«${TEXT_THIRD_NEW}»` : `«${i.text}»`;
      console.log(`    [${i.done ? "x" : " "}] -> [x] ${to}`);
    }
    if (!hasNewItem) console.log(`    (nueva) [x] «${TEXT_NEW_ITEM}»`);

    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    await client.query(
      `UPDATE "Project" SET category = $2, status = $3, "requesterArea" = $4, description = $5, "expectedOutcome" = $6,
         rationale = $7, links = $8::jsonb, "editedInApp" = true, "updatedAt" = now() WHERE id = $1`,
      [ID, CATEGORY, "COMPLETADO", "GC", DESCRIPTION, EXPECTED, RATIONALE, JSON.stringify([...links, ...newLinks])],
    );
    await client.query(`UPDATE "ChecklistItem" SET text = $2 WHERE "projectId" = $1 AND text = $3`, [ID, TEXT_THIRD_NEW, TEXT_THIRD_OLD]);
    await client.query(`UPDATE "ChecklistItem" SET done = true, "updatedAt" = now() WHERE "projectId" = $1 AND done = false`, [ID]);
    if (!hasNewItem) {
      await client.query(
        `INSERT INTO "ChecklistItem" (id, "projectId", text, "order", done, "mentionIds", "updatedAt") VALUES ($1, $2, $3, $4, true, '{}', now())`,
        ["ci" + randomBytes(10).toString("hex"), ID, TEXT_NEW_ITEM, maxOrder + 1],
      );
    }
    await client.query("COMMIT");
    console.log("\nListo: proyecto actualizado y marcado como completado.");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

await withRetry(run);
