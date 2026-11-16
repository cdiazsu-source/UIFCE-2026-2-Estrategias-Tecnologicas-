/**
 * Ajustes del PMO del 2026-11-16 (tres pasos, todos en una sola transacción):
 *
 *   1. Elimina el proyecto manual duplicado «Actualización vectorial del logo UIFCE y animación de áreas»
 *      (id actualizacion-vectorial-del-logo-uifce-y-animacion-de-areas). Se conserva el del CSV
 *      (produccion-logo-uifce-vectorial-animacion), que el seed volvería a crear de todos modos.
 *   2. Instagram (redes-instagram): pasa de «Por iniciar» a «En curso» y suma la subtarea pendiente
 *      «Recibir del director de área las credenciales de acceso del nuevo correo de redes».
 *   3. Etiqueta «carpeta-X.Y.Z» en cada proyecto con el código de su carpeta del Drive (estructura de la guía de
 *      GC, https://cdiazsu-source.github.io/ET-Organizaci-nDeCarpetas-GC/). Una sola palabra en minúscula, para que
 *      el buscador global (que compara etiquetas exactas en minúscula) la encuentre. Reemplaza cualquier
 *      etiqueta «carpeta-…» anterior. Quedan sin etiqueta la «Feria de Servicios e Innovación Tecnológica» y la
 *      «Página permanente de oferta de Eventos» hasta decidir su número en 4.1.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/ajustes-2026-11-16.mjs
 *     node scripts/ajustes-2026-11-16.mjs --apply      <- aplica los cambios
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

const DUPLICATE_ID = "actualizacion-vectorial-del-logo-uifce-y-animacion-de-areas";
const KEEP_ID = "produccion-logo-uifce-vectorial-animacion";
const INSTAGRAM_ID = "redes-instagram";
const INSTAGRAM_ITEM = "Recibir del director de área las credenciales de acceso del nuevo correo de redes.";

/** id del proyecto -> código de carpeta (estructura de ET en js/datos.js de la guía de GC, ya con 2.7 y 5.1.4 nuevos). */
const FOLDER = {
  // 2. Articulación interna
  "aa-cartelera-fisica": "2.1.1",
  "aa-pieza-audiovisual-docentes": "2.1.2",
  "pagina-permanente-de-oferta-de-apoyos-academicos": "2.1.3",
  "cursoslibres-linea-grafica": "2.2.1",
  "cursoslibres-piezas-primer-lanzamiento": "2.2.2",
  "elaboracion-de-piezas-graficas-de-cursos-libres-segundo-lanz": "2.2.3",
  "cursoslibres-piezas-lanzamiento-especial": "2.2.4",
  "cursoslibres-pieza-audiovisual-aplicativo": "2.2.5",
  "sitio-estatico-de-oferta-permanente-de-la-ruta-de-aprendizaj": "2.2.6",
  "ds-solicitudes-uifce-tarjetas": "2.3.1",
  "virtualizacion-linea-grafica-articulate-genially": "2.4.1",
  "virtualizacion-poster-encuesta-automatizacion": "2.4.2",
  "interarea-infografia-puntualidad": "2.5.1",
  "interarea-plantillas-powerpoint-aa-cl": "2.5.2",
  "acompanamiento-interarea": "2.5.3",
  "documentacion-propuesta-drive-gc": "2.6.1",
  // 3. Comunicación
  "produccion-logo-uifce-vectorial-animacion": "3.1.1",
  "produccion-uifcito-reutilizable": "3.1.2",
  "produccion-videos-presentacion-docente": "3.1.3",
  "produccion-piezas-audiovisual": "3.1.4",
  "produccion-hacks-informaticos": "3.1.5",
  "produccion-point-of-purchase-uifce": "3.1.6",
  "produccion-sala-abierta": "3.1.7",
  "video-tutorial-para-el-aplicativo-programacion-de-salones": "3.1.8",
  "produccion-carteleras": "3.2.1",
  "produccion-capsulas-tecnologia-pantallas": "3.2.2",
  "produccion-senaletica-salas": "3.2.3",
  "continuidad-micrositio": "3.3.1",
  "micrositio-ex-monitores": "3.3.2",
  "micrositio-equipo-de-trabajo": "3.3.3",
  "continuidad-blog": "3.3.4",
  "estrategicos-boletin-digital": "3.3.5",
  "redes-linkedin": "3.3.6",
  "redes-instagram": "3.3.7",
  "redes-tiktok": "3.3.8",
  "redes-youtube": "3.3.9",
  "correo-institucional-unificado-de-redes-comunicaciones-y-eve": "3.3.10",
  // 4. Eventos y vinculación (4.1.6 y 4.1.7 pendientes: Feria de Servicios e Innovación y Página de oferta de Eventos)
  "eventos-semana-uifce": "4.1.1",
  "semana-uifce-hackaton-bizagi": "4.1.2",
  "eventos-microtalleres": "4.1.3",
  "semana-uifce-microtaller-programacion": "4.1.3.1",
  "semana-uifce-conferencia-jj": "4.1.4",
  "participacion-institucional-en-la-feria-de-servicios-unal": "4.1.5",
  "redes-rastreo-contactos-empresas": "4.2.1",
  "estrategicos-tracker-egresados-uifce": "4.2.2",
  "estrategicos-red-aliados-academicos": "4.2.3",
  "estrategicos-extension-solidaria": "4.2.4",
  "estrategicos-divulgacion-primeros-semestres": "4.2.5",
  // 5. Gestión interna
  "diagnostico-dofa-del-area-de-estrategias-tecnologicas": "5.1.1",
  "documentacion-memorias-2026-2": "5.1.2",
  "memoria-institucional-audiovisual": "5.1.3",
  "documentacion-repositorio-permanente": "5.1.4",
  "normativa-terminos-condiciones": "5.2.1",
  "consentimiento-imagen-micrositio": "5.2.2",
  "et-en-marcha": "5.3.1",
  "innovacion-seguimiento-gastos-et": "5.3.2",
  "canal-oficial-de-atencion-virtual-via-whatsapp-business-uifc": "5.3.3",
  "innovacion-experiencia-nfc-uifce": "5.3.4",
  "innovacion-repositorio-ia": "5.3.5",
};

const tagFor = (code) => `carpeta-${code}`;

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
    // ---- 1. Duplicado del logo
    const dup = (await client.query(`SELECT id, "isManual", status FROM "Project" WHERE id = $1`, [DUPLICATE_ID])).rows[0];
    const keep = (await client.query(`SELECT id FROM "Project" WHERE id = $1`, [KEEP_ID])).rows[0];
    console.log("1. Duplicado del logo");
    if (!dup) console.log("   ya no existe el duplicado (nada que hacer).");
    else if (!keep) console.log(`   ¡No existe el proyecto que se conserva (${KEEP_ID})! No se elimina nada.`);
    else console.log(`   se eliminará «${DUPLICATE_ID}» (manual: ${dup.isManual}, estado: ${dup.status}); se conserva «${KEEP_ID}».`);

    // ---- 2. Instagram
    const ig = (await client.query(`SELECT status FROM "Project" WHERE id = $1`, [INSTAGRAM_ID])).rows[0];
    const igItems = (await client.query(`SELECT text, "order" FROM "ChecklistItem" WHERE "projectId" = $1`, [INSTAGRAM_ID])).rows;
    const igHasItem = igItems.some((i) => i.text === INSTAGRAM_ITEM);
    console.log("2. Instagram");
    if (!ig) console.log(`   no existe ${INSTAGRAM_ID}.`);
    else {
      console.log(`   estado: ${ig.status} -> EN_CURSO`);
      console.log(igHasItem ? "   la subtarea de credenciales ya existe." : `   se agrega la subtarea: «${INSTAGRAM_ITEM}»`);
    }

    // ---- 3. Etiquetas de carpeta
    const rows = (await client.query(`SELECT id, tags FROM "Project"`)).rows;
    const byId = new Map(rows.map((r) => [r.id, r]));
    const missing = Object.keys(FOLDER).filter((id) => !byId.has(id));
    let changes = 0;
    for (const [id, code] of Object.entries(FOLDER)) {
      const r = byId.get(id);
      if (r && !r.tags.includes(tagFor(code))) changes++;
    }
    const sinCodigo = rows.filter((r) => !FOLDER[r.id]).map((r) => r.id);
    console.log("3. Etiquetas de carpeta");
    console.log(`   proyectos con código: ${Object.keys(FOLDER).length - missing.length}; etiquetas por agregar o corregir: ${changes}`);
    if (missing.length) console.log(`   ids que no existen en la BD (se omiten): ${missing.join(", ")}`);
    console.log(`   proyectos sin código (no se tocan): ${sinCodigo.join(", ")}`);

    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    if (dup && keep) await client.query(`DELETE FROM "Project" WHERE id = $1`, [DUPLICATE_ID]);
    if (ig) {
      await client.query(`UPDATE "Project" SET status = 'EN_CURSO', "updatedAt" = now() WHERE id = $1`, [INSTAGRAM_ID]);
      if (!igHasItem) {
        const next = igItems.reduce((m, i) => Math.max(m, i.order), -1) + 1;
        await client.query(
          `INSERT INTO "ChecklistItem" (id, "projectId", text, "order", done, "mentionIds", "updatedAt") VALUES ($1, $2, $3, $4, false, '{}', now())`,
          ["ci" + randomBytes(10).toString("hex"), INSTAGRAM_ID, INSTAGRAM_ITEM, next],
        );
      }
    }
    for (const [id, code] of Object.entries(FOLDER)) {
      if (!byId.has(id)) continue;
      await client.query(
        `UPDATE "Project" SET tags = array_append(array(SELECT t FROM unnest(tags) AS t WHERE t NOT LIKE 'carpeta-%'), $2::text), "updatedAt" = now() WHERE id = $1`,
        [id, tagFor(code)],
      );
    }
    await client.query("COMMIT");
    console.log("\nListo: duplicado eliminado, Instagram actualizado y etiquetas de carpeta aplicadas.");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

await withRetry(run);
