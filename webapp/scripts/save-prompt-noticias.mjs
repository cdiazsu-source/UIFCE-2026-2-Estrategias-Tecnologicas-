/**
 * Guarda en la base de datos el prompt maestro de producción de noticias en video (Claude Code + Remotion)
 * y deja en la bitácora del proyecto de las cápsulas un anuncio para el máster.
 *
 * Por qué es un script y no una migración: el prompt trae rutas del equipo del máster (usuario de Windows,
 * carpetas de OneDrive) y el repositorio es PÚBLICO. El texto vive solo en un archivo local que git ignora
 * (webapp/private/prompt-noticias-remotion.txt) y de ahí pasa a la BD. Una vez cargado, se ve y se edita en
 * la app: Plantillas → «Televisores de la unidad».
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/save-prompt-noticias.mjs
 *     node scripts/save-prompt-noticias.mjs --apply      <- aplica los cambios
 *
 * Qué hace (es idempotente; se puede volver a correr):
 *   - Plantilla «Prompt maestro: pieza de noticias en video (Remotion)»: la crea o actualiza su prompt.
 *   - Nota de bitácora en «produccion-capsulas-tecnologia-pantallas», dirigida al máster (lo etiqueta); no
 *     la repite si ya existe.
 * Requiere la migración 20261022120000_template_prompt (npm run db:deploy). Escribe en la BD de producción
 * (la de webapp/.env): lo corre una persona del equipo, no el agente.
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

const PROMPT_FILE = join(here, "..", "private", "prompt-noticias-remotion.txt");

const TEMPLATE = {
  name: "Prompt maestro: pieza de noticias en video (Remotion)",
  category: "Televisores de la unidad",
  format: "Video 1920×1080 · 30 fps · MP4",
  description:
    "Prompt para producir, con Claude Code y Remotion, una pieza de noticias (apertura, noticia con etiquetas y cierre) idéntica en estilo a la plantilla de la Noticia 1 (Tesla): solo cambian el video de fondo y los textos. Se usa para las cápsulas de las pantallas TV de la Unidad.\n\nCómo se usa: copia el prompt, cambia SOLO la sección 1 (video de fondo, carpeta de trabajo, nombre del MP4, contexto, dato destacado y fuente) y pégalo en Claude Code. El prompt pide una propuesta para aprobar antes de entregar el MP4 final.",
  notes:
    "Las rutas del prompt son las del equipo del máster (OneDrive y carpeta «Piezas TV»): si lo usa otra persona, debe ajustarlas. Proyecto relacionado: «Cápsulas de tecnología y difusión de aplicativos en pantallas UIFCE».",
};

const PROJECT_ID = "produccion-capsulas-tecnologia-pantallas";

const NOTE = {
  author: "Asistente de ET en Marcha",
  authorRole: "Asistente",
  body: `ANUNCIO PARA EL MÁSTER · Consolidar la producción audiovisual de las noticias en pantallas

Avance
- Ya existe un método que funciona para producir cada noticia en video con Claude Code y Remotion: un prompt maestro que deja cada pieza idéntica en estilo (misma apertura y cierre, tipografía, colores, animaciones y estructura de etiquetas). Solo cambian el video de fondo y los textos. Se usó para la Noticia 1 (Tesla) y está listo para la Noticia 2 (IFA Berlín).
- El prompt quedó guardado en Plantillas → «Televisores de la unidad» → «${TEMPLATE.name}», con un botón para copiarlo.

Próximo (para consolidar)
1. Dejar el proyecto de Remotion de la Noticia 1 como plantilla única de referencia: no se modifica; cada noticia trabaja sobre una copia.
2. Producir la siguiente noticia cambiando solo la sección 1 del prompt (video, carpeta, nombre del MP4, contexto, dato destacado y fuente).
3. Definir la parrilla de contenido: temas, cantidad de cápsulas y frecuencia (siguen [por confirmar] en el proyecto).
4. Revisar cada propuesta antes del MP4 final (el prompt ya lo exige) y cargar el video en las pantallas TV.

A tener en cuenta
- Las rutas del prompt son las del equipo del máster: si otra persona lo usa, debe ajustar las rutas de la sección 1 y de los recursos de marca.
- El video original nunca se modifica; el de fondo se re-codifica a 30 fps constantes (ya está en el prompt).`,
};

if (!existsSync(PROMPT_FILE)) {
  console.error(`No encontré el archivo del prompt: ${PROMPT_FILE}\nDebe existir webapp/private/prompt-noticias-remotion.txt (no se sube a git).`);
  process.exit(1);
}
const promptText = readFileSync(PROMPT_FILE, "utf8").replace(/\r\n/g, "\n").trim();
if (promptText.length < 200) {
  console.error("El archivo del prompt parece vacío o incompleto.");
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
    const col = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'Template' AND column_name = 'promptText'`,
    );
    if (col.rowCount === 0) {
      throw new Error("Falta la migración 20261022120000_template_prompt. Corre primero: npm run db:deploy");
    }

    const tpl = (await client.query(`SELECT id FROM "Template" WHERE name = $1`, [TEMPLATE.name])).rows[0];
    const proj = (await client.query(`SELECT id, title FROM "Project" WHERE id = $1`, [PROJECT_ID])).rows[0];
    if (!proj) throw new Error(`El proyecto ${PROJECT_ID} no existe (¿corriste npm run db:seed?).`);
    const master = (
      await client.query(
        `SELECT id, name FROM "User" WHERE role = 'MASTER' AND area = 'ET' AND active = true ORDER BY name LIMIT 1`,
      )
    ).rows[0];
    const note = (await client.query(`SELECT id FROM "ProjectNote" WHERE "projectId" = $1 AND body = $2`, [PROJECT_ID, NOTE.body])).rows[0];

    console.log(`Plantilla: ${tpl ? "ya existe → se actualiza su prompt" : "no existe → se crea"} (${promptText.length} caracteres)`);
    console.log(`Proyecto: ${proj.title}`);
    console.log(`Nota de bitácora: ${note ? "ya está publicada (no se repite)" : "se publica"}; etiqueta a: ${master?.name ?? "nadie (no hallé al máster de ET)"}`);

    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    if (tpl) {
      await client.query(
        `UPDATE "Template" SET category = $2, format = $3, description = $4, notes = $5, "promptText" = $6, "updatedAt" = now() WHERE id = $1`,
        [tpl.id, TEMPLATE.category, TEMPLATE.format, TEMPLATE.description, TEMPLATE.notes, promptText],
      );
    } else {
      const order = (await client.query(`SELECT COALESCE(MAX("order"), -1) + 1 AS n FROM "Template"`)).rows[0].n;
      await client.query(
        `INSERT INTO "Template" (id, name, category, format, description, notes, "promptText", "order", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())`,
        [randomUUID(), TEMPLATE.name, TEMPLATE.category, TEMPLATE.format, TEMPLATE.description, TEMPLATE.notes, promptText, order],
      );
    }
    if (!note) {
      await client.query(
        `INSERT INTO "ProjectNote" (id, "projectId", body, author, "authorRole", "mentionIds", links)
         VALUES ($1, $2, $3, $4, $5, $6::text[], '[]'::jsonb)`,
        [randomUUID(), PROJECT_ID, NOTE.body, NOTE.author, NOTE.authorRole, master ? [master.id] : []],
      );
    }
    await client.query("COMMIT");
    console.log("\nListo: prompt guardado en Plantillas y anuncio publicado en la bitácora.");
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
    if (/Falta la migración|no existe/.test(String(e?.message))) process.exit(1);
    if (attempt < 4) await new Promise((r) => setTimeout(r, 4000));
  }
}
console.error("No se pudo completar tras 4 intentos. Reintenta o enciende WARP.");
process.exit(1);
