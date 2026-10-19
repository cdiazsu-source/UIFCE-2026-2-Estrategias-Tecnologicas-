/**
 * Comparte con Jean los directorios UIFCE (antiguos monitores) en el proyecto del tracker de egresados:
 * agrega los tres enlaces al encabezado del proyecto y deja en su bitácora notas que lo etiquetan (qué se le pide y
 * dónde está el tracker).
 *
 * Por qué es un script y no código del repositorio: los directorios son hojas de cálculo con datos de
 * personas y el repositorio es PÚBLICO. Los enlaces viven solo en un archivo local que git ignora
 * (webapp/private/directorios-uifce.json) y de ahí pasan a la BD.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/save-egresados-links.mjs
 *     node scripts/save-egresados-links.mjs --apply      <- aplica los cambios
 *
 * Qué hace (idempotente; se puede volver a correr):
 *   - Suma a «Project.links» los enlaces que falten (no repite ni borra los que ya tenga).
 *   - Publica en la bitácora las notas para Jean que falten (las etiqueta; la campana le avisa).
 * Requiere que el proyecto exista (npm run db:seed). Escribe en la BD de producción (la de webapp/.env):
 * lo corre una persona del equipo, no el agente.
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

const PROJECT_ID = "estrategicos-tracker-egresados-uifce";
const JEAN_CREDENTIAL_KEY = "junior-et";
const LINKS_FILE = join(here, "..", "private", "directorios-uifce.json");

const AUTHOR = { author: "Asistente de ET en Marcha", authorRole: "Asistente" };

const NOTES = [
  {
    ...AUTHOR,
    body: `Jean: este proyecto es para ti · Tracker de egresados UIFCE

Qué te pedimos
- Rastrear a los antiguos monitores de la Unidad: dónde trabajan hoy (empresa y cargo), qué estudiaron (carrera de graduación) y cómo contactarlos.
- Punto de partida: los directorios UIFCE 2025-2, 2025-1 y 2024-2, que están como enlaces en el encabezado de este proyecto.
- La idea es llevar un tracker de egresados para poder conectar internamente con ellos.

Cómo empezar
1. Abre los tres directorios y consolida la lista de antiguos monitores en una sola base.
2. Busca el perfil público de LinkedIn de cada persona y anota su empresa, su cargo y su carrera de graduación.
3. Cuando tengas la primera tanda, cuéntanos aquí en la bitácora para definir cómo contactarlos.

Cuidado: usa solo la información que cada persona comparte o publica en su perfil profesional.`,
  },
  {
    ...AUTHOR,
    body: `Jean: ya está listo el lugar para hacer el seguimiento · Egresados

Dónde: en el menú lateral, «Egresados» (o el botón grande «Ir al tracker de egresados» de este proyecto).

Cómo se usa
1. Abre un directorio (los botones «Directorios de origen» están arriba en esa página) y copia los nombres de los antiguos monitores: una columna, o las filas completas.
2. Pégalos en «Agregar egresados», escribe el semestre del directorio (por ejemplo 2025-2) y guarda. Si una persona sale en varios directorios no se duplica: solo se le suma el semestre.
3. En cada fila, «Buscar su perfil» abre la búsqueda en LinkedIn. Con el lápiz completas su carrera de graduación, su empresa y cargo actuales y el enlace de su perfil.
4. Cambia su estado a medida que avanzas: por rastrear, situación verificada, contactado, conectado o sin respuesta. «Revisado hoy» deja constancia de cuándo la revisaste.

La barra de arriba muestra cuántos llevan su situación verificada.`,
  },
];

if (!existsSync(LINKS_FILE)) {
  console.error(`No encontré ${LINKS_FILE}\nDebe existir webapp/private/directorios-uifce.json (no se sube a git).`);
  process.exit(1);
}
const links = JSON.parse(readFileSync(LINKS_FILE, "utf8"));
if (!Array.isArray(links) || links.length === 0 || links.some((l) => !l?.label || !/^https:\/\//.test(l?.url ?? ""))) {
  console.error("El archivo de enlaces debe ser una lista de {label, url} con direcciones https://.");
  process.exit(1);
}

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
    const proj = (await client.query(`SELECT id, title, links FROM "Project" WHERE id = $1`, [PROJECT_ID])).rows[0];
    if (!proj) throw new Error(`no existe el proyecto ${PROJECT_ID} (¿corriste npm run db:seed?).`);
    const jean = (await client.query(`SELECT id, name FROM "User" WHERE "credentialKey" = $1`, [JEAN_CREDENTIAL_KEY])).rows[0];

    const current = Array.isArray(proj.links) ? proj.links : [];
    const have = new Set(current.map((l) => l.url));
    const toAdd = links.filter((l) => !have.has(l.url));

    const pending = [];
    for (const n of NOTES) {
      const found = (await client.query(`SELECT id FROM "ProjectNote" WHERE "projectId" = $1 AND body = $2`, [PROJECT_ID, n.body])).rows[0];
      if (!found) pending.push(n);
    }

    console.log(`Proyecto: ${proj.title}`);
    console.log(`Enlaces: ya tiene ${current.length}; se agregan ${toAdd.length}${toAdd.length ? " (" + toAdd.map((l) => l.label).join(", ") + ")" : ""}`);
    console.log(`Notas para Jean: se publican ${pending.length} de ${NOTES.length}; etiqueta a: ${jean?.name ?? "nadie (no hallé el perfil de Jean)"}`);

    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    if (toAdd.length > 0) {
      await client.query(`UPDATE "Project" SET links = $2::jsonb, "updatedAt" = now() WHERE id = $1`, [
        PROJECT_ID,
        JSON.stringify([...current, ...toAdd.map((l) => ({ label: l.label, url: l.url }))]),
      ]);
    }
    for (const n of pending) {
      await client.query(
        `INSERT INTO "ProjectNote" (id, "projectId", body, author, "authorRole", "mentionIds", links)
         VALUES ($1, $2, $3, $4, $5, $6::text[], '[]'::jsonb)`,
        [randomUUID(), PROJECT_ID, n.body, n.author, n.authorRole, jean ? [jean.id] : []],
      );
    }
    await client.query("COMMIT");
    console.log("\nListo: enlaces al día y notas publicadas para Jean.");
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
    if (/no existe el proyecto/.test(String(e?.message))) process.exit(1);
    if (attempt < 4) await new Promise((r) => setTimeout(r, 4000));
  }
}
console.error("No se pudo completar tras 4 intentos. Reintenta o enciende WARP.");
process.exit(1);
