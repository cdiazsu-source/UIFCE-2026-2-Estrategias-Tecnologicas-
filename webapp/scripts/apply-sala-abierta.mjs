/**
 * Aplica a la base de datos el nuevo contenido del proyecto «produccion-sala-abierta»
 * (Campaña de difusión del aplicativo "Programación de Salones"), tomado de
 * planeacion/planeacion_del_area.csv.
 *
 * Por qué hace falta: el proyecto ya fue editado en la app (título) y el seed NO pisa
 * el contenido de un proyecto editado ni cambia el texto de las subtareas existentes
 * (si cambia el texto, las agrega como nuevas y quedarían duplicadas). Este script hace
 * ese cambio puntual y a propósito.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/apply-sala-abierta.mjs
 *     node scripts/apply-sala-abierta.mjs --apply      <- aplica los cambios
 *
 * Qué cambia (solo este proyecto):
 *   - título, «qué se debe hacer», «qué se espera» y fundamento (y lo marca como editado en la app);
 *   - lugar: edificios 238, 310 y 311;
 *   - subtareas: conserva las existentes (hechas, responsables, notas ligadas) y solo
 *     reescribe el texto de las 4 originales por el nuevo, sin crear duplicados.
 * Es idempotente. Escribe en la BD de producción (la de webapp/.env): lo corre una
 * persona del equipo, no el agente. Se puede borrar después de usarlo.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

const ID = "produccion-sala-abierta";
const LOCATION = "Edificios 238, 310 y 311 (Facultad de Ciencias Económicas - FCE)";

/** Textos originales de las 4 subtareas del CSV anterior, en su orden. La 1.ª subtarea
 *  nueva («Obtener la confirmación…») ya existe en la app, creada a mano. */
const OLD_ITEMS = [
  "Letrero de puerta instalado en cada sala de informática.",
  "Pieza 16:9 programada en las pantallas informativas institucionales.",
  "Póster A4/tabloide colocado en la Biblioteca Central y las salas de estudio.",
  "Tablero de seguimiento con los tres indicadores (ocupación, escaneos de QR y encuesta de percepción).",
];

const url = readFileSync(join(here, "..", ".env"), "utf8").match(/^DATABASE_URL="([^"]+)"/m)?.[1];
if (!url) {
  console.error("No encontré DATABASE_URL en webapp/.env");
  process.exit(1);
}

const { parse } = await import("csv-parse/sync");
const rows = parse(readFileSync(join(here, "..", "..", "planeacion", "planeacion_del_area.csv"), "utf8"), {
  columns: true,
  skip_empty_lines: true,
});
const row = rows.find((r) => r.ID === ID);
if (!row) {
  console.error(`No encontré ${ID} en planeacion_del_area.csv`);
  process.exit(1);
}
const lf = (s) => s.replace(/\r\n/g, "\n").trim();
const next = {
  title: lf(row["Actividad"]),
  description: lf(row["Qué se debe hacer"]),
  expectedOutcome: lf(row["Qué se espera"]),
  rationale: lf(row["Fundamento"]),
};
const newItems = lf(row["Entregables"])
  .split("\n")
  .map((l) => l.replace(/^\*\s*/, "").trim())
  .filter(Boolean);
if (newItems.length !== OLD_ITEMS.length + 1) {
  console.error(`Se esperaban ${OLD_ITEMS.length + 1} entregables en el CSV y hay ${newItems.length}.`);
  process.exit(1);
}

const { Pool, neonConfig } = await import("@neondatabase/serverless");
neonConfig.webSocketConstructor = (await import("ws")).default;

async function run() {
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    const proj = (await client.query(`SELECT id, title, location FROM "Project" WHERE id = $1`, [ID])).rows[0];
    if (!proj) throw new Error(`El proyecto ${ID} no existe en la base de datos.`);
    const items = (
      await client.query(`SELECT id, text, "order", done FROM "ChecklistItem" WHERE "projectId" = $1 ORDER BY "order"`, [ID])
    ).rows;
    const byText = new Map(items.map((i) => [i.text, i]));

    // Plan de subtareas: nueva[0] = confirmación (ya existe o se crea); nueva[1..4] reemplazan a las 4 originales.
    const plan = [];
    let nextOrder = items.reduce((m, i) => Math.max(m, i.order), -1) + 1;
    newItems.forEach((text, idx) => {
      if (byText.has(text)) return plan.push({ kind: "igual", text });
      const old = idx > 0 ? byText.get(OLD_ITEMS[idx - 1]) : undefined;
      if (old) return plan.push({ kind: "reescribir", id: old.id, from: old.text, text });
      plan.push({ kind: "crear", text, order: nextOrder++ });
    });

    console.log(`Proyecto: ${proj.title}`);
    console.log(`  → título: ${next.title}`);
    console.log(`  → lugar: ${LOCATION}`);
    console.log(`  → textos: qué se debe hacer (${next.description.length} car.), qué se espera, fundamento`);
    for (const p of plan) {
      const label = { igual: "sin cambio ", reescribir: "reescribir ", crear: "crear      " }[p.kind];
      console.log(`  subtarea ${label} ${p.text}`);
    }
    const stray = items.filter((i) => !newItems.includes(i.text) && !OLD_ITEMS.includes(i.text));
    for (const s of stray) console.log(`  (se deja tal cual la subtarea ajena al cambio: ${s.text})`);

    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    await client.query(
      `UPDATE "Project"
          SET title = $2, description = $3, "expectedOutcome" = $4, rationale = $5,
              location = $6, "editedInApp" = true, "updatedAt" = now()
        WHERE id = $1`,
      [ID, next.title, next.description, next.expectedOutcome, next.rationale, LOCATION],
    );
    for (const p of plan) {
      if (p.kind === "reescribir") {
        await client.query(`UPDATE "ChecklistItem" SET text = $2, "updatedAt" = now() WHERE id = $1`, [p.id, p.text]);
      } else if (p.kind === "crear") {
        await client.query(
          `INSERT INTO "ChecklistItem" (id, "projectId", text, "order", "updatedAt") VALUES ($1, $2, $3, $4, now())`,
          [randomUUID(), ID, p.text, p.order],
        );
      }
    }
    await client.query("COMMIT");
    console.log("\nListo: proyecto actualizado.");
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
console.error("No se pudo completar tras 4 intentos. Reintenta, enciende WARP, o edita el proyecto desde la app.");
process.exit(1);
