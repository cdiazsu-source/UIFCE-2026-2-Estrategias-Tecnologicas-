/**
 * Enlaza a cada monitor Junior con su perfil de acceso propio, para que:
 *   - el máster vea la última visita de cada uno (User.lastSeenAt), y
 *   - cada Junior vea solo SU proyecto de estudio y sus proyectos asignados primero.
 *
 * Qué hace (solo la columna User.credentialKey):
 *   - la persona con rol «Junior — Artes»  (JUNIOR_ARTES)    → credentialKey «junior-artes»;
 *   - la persona con rol «Junior — ET»     (JUNIOR_AUXILIAR) → credentialKey «junior-et».
 * Requiere que haya UNA persona activa con cada rol (si hay más o ninguna, se detiene y lo
 * dice, para no enlazar a quien no es). No cambia nada más. Es idempotente.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/apply-junior-profiles.mjs
 *     node scripts/apply-junior-profiles.mjs --apply      <- aplica los cambios
 *
 * Escribe en la BD de producción (la de webapp/.env): lo corre una persona del equipo,
 * no el agente. Es de un solo uso; se puede borrar después.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

/** Debe coincidir con JUNIOR_ARTES_WHO / JUNIOR_ET_WHO en src/lib/auth.ts. */
const PROFILES = [
  { role: "JUNIOR_ARTES", label: "Junior Artes", key: "junior-artes" },
  { role: "JUNIOR_AUXILIAR", label: "Junior ET", key: "junior-et" },
];

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
    const plan = [];
    for (const p of PROFILES) {
      const rows = (
        await client.query(
          `SELECT id, name, "credentialKey" FROM "User" WHERE role = $1::"UserRole" AND active = true ORDER BY name`,
          [p.role],
        )
      ).rows;
      if (rows.length !== 1) {
        throw new Error(
          `Se esperaba exactamente 1 persona activa con rol ${p.role} (${p.label}) y hay ${rows.length}` +
            (rows.length ? `: ${rows.map((r) => r.name).join(", ")}` : "") +
            ". Corrígelo en Equipo y vuelve a correr el script.",
        );
      }
      const owner = (await client.query(`SELECT name FROM "User" WHERE "credentialKey" = $1 AND id <> $2`, [p.key, rows[0].id])).rows[0];
      if (owner) throw new Error(`La clave «${p.key}» ya la tiene ${owner.name}.`);
      plan.push({ ...p, user: rows[0] });
    }

    console.log("Perfiles Junior:");
    for (const p of plan) {
      const state = p.user.credentialKey === p.key ? "ya enlazado" : `enlazar (clave actual: ${p.user.credentialKey ?? "ninguna"})`;
      console.log(`  ${p.label.padEnd(13)} → ${p.user.name}  [${p.key}]  ${state}`);
    }
    const todo = plan.filter((p) => p.user.credentialKey !== p.key);
    if (todo.length === 0) {
      console.log("\nNo hay nada por hacer: los dos perfiles ya están enlazados.");
      return;
    }
    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    for (const p of todo) {
      await client.query(`UPDATE "User" SET "credentialKey" = $2, "updatedAt" = now() WHERE id = $1`, [p.user.id, p.key]);
    }
    await client.query("COMMIT");
    console.log(`\nListo: ${todo.length} perfil(es) enlazado(s).`);
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
    const msg = (e?.message || e).toString().split("\n")[0];
    console.log(`  falló: ${msg}`);
    // Errores de datos (no de red): no tiene sentido reintentar.
    if (/Se esperaba|ya la tiene/.test(msg)) process.exit(1);
    if (attempt < 4) await new Promise((r) => setTimeout(r, 4000));
  }
}
console.error("No se pudo completar tras 4 intentos. Reintenta o enciende WARP.");
process.exit(1);
