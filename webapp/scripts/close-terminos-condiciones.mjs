/**
 * Cierra el proyecto «Cierre de Términos y Condiciones de Estrategias Tecnológicas» en ET en Marcha y unifica el
 * nombre «Hackatón» → «Concurso/Hackatón» en los títulos que ya existen en la base de datos.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/close-terminos-condiciones.mjs
 *     node scripts/close-terminos-condiciones.mjs --apply      <- aplica los cambios
 *
 * Qué hace (es idempotente; se puede volver a correr):
 *   1. Bitácora de `normativa-terminos-condiciones`: publica 2 notas con el resumen de lo aprobado (no repite las que ya existan).
 *   2. Marca como hechas las subtareas del proyecto y pasa su estado a COMPLETADO.
 *   3. Renombra a «Concurso/Hackatón» los títulos que dicen «Hackatón»: Project.title, StudyProject.title y Template.name.
 *      Solo toca títulos; las descripciones ya guardadas no se modifican.
 *
 * Escribe en la BD de producción (la de webapp/.env): lo corre una persona del equipo, no el agente.
 * El documento aprobado vive en el repositorio: docs/terminos-condiciones/Terminos_y_Condiciones_ET_2026-2.md
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

const PROJECT_ID = "normativa-terminos-condiciones";
const DOC_PATH = "docs/terminos-condiciones/Terminos_y_Condiciones_ET_2026-2.md";

const AUTHOR = "Asistente de ET en Marcha";
const AUTHOR_ROLE = "Asistente";

const NOTES = [
  `TÉRMINOS Y CONDICIONES DE ET · Documento aprobado (versión 1.0)

Avance
- Quedó aprobado el documento formal de Términos y Condiciones de Estrategias Tecnológicas, que da continuidad al Manual de Microtalleres y Microeventos vigente. Aplica a microtalleres, microeventos, Concursos/Hackatones y eventos virtuales.
- Asistencia: se considera asistente a quien permanece al menos el 70 % de la actividad en modalidad presencial y el 90 % en modalidad virtual. Tolerancia de ingreso de 10 minutos, salvo eventualidad de traslado o inconvenientes digitales.
- Cancelación con al menos 24 horas de anticipación. La inasistencia injustificada lleva a lista de espera en las dos siguientes actividades; a la tercera inasistencia injustificada en el semestre, las inscripciones se suspenden por el resto del semestre. Las causas justificadas se envían dentro de los 5 días hábiles siguientes. Lo no previsto lo resuelve el máster de ET vigente.
- Quien no alcance el porcentaje de permanencia no recibe certificado, pero no se penaliza.
- Documento en el repositorio: ${DOC_PATH}

Próximo
- Difundir el documento a la comunidad UIFCE y publicarlo en el repositorio documental.
- Incluir las reglas (asistencia, cancelación y certificado) en cada convocatoria de microtalleres, microeventos y concursos.

Bloqueo
- Ninguno.`,

  `TÉRMINOS Y CONDICIONES DE ET · Certificado, corresponsabilidad y eventos virtuales

Avance
- Certificado de asistencia: ET lo envía al finalizar el evento a quienes cumplen el porcentaje de permanencia (70 % presencial, 90 % virtual). Los beneficios asociados son horas de corresponsabilidad, prioridad en inscripciones y reconocimiento en los concursos.
- Horas de corresponsabilidad (validado con Bienestar): quedan a disposición de Bienestar. ET envía la solicitud de cupos para los estudiantes que lo requieren, Bienestar confirma en un plazo de 2 días y, al finalizar el evento, ET envía el certificado y el reporte de los estudiantes que pueden acceder al beneficio.
- Eventos virtuales: el documento define la ficha de propuesta (nombre y tipo, objetivo y público, alineación con «calidad sobre cantidad», contenido y ponentes, fecha y plataforma, cupo e inscripción, difusión, responsable y recursos) y la ruta de aprobación: formulación, revisión interna del máster, aval de Coordinación, programación y difusión, y ejecución y cierre.

Próximo
- Usar la ficha para formular las próximas propuestas de eventos virtuales.
- Aplicar el procedimiento con Bienestar desde el primer evento con estudiantes de corresponsabilidad.

Bloqueo
- Ninguno.`,
];

const RENAME_TARGETS = [
  { table: "Project", column: "title" },
  { table: "StudyProject", column: "title" },
  { table: "Template", column: "name" },
];
const rename = (s) => s.replace(/(?<!Concurso\/)Hackatón/g, "Concurso/Hackatón");

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
    const proj = (await client.query(`SELECT id, title, status FROM "Project" WHERE id = $1`, [PROJECT_ID])).rows[0];
    if (!proj) throw new Error(`El proyecto ${PROJECT_ID} no existe (¿corriste npm run db:seed?).`);
    const master = (
      await client.query(`SELECT id, name FROM "User" WHERE role = 'MASTER' AND area = 'ET' AND active = true ORDER BY name LIMIT 1`)
    ).rows[0];
    const items = (await client.query(`SELECT id, done FROM "ChecklistItem" WHERE "projectId" = $1`, [PROJECT_ID])).rows;
    const pendingItems = items.filter((i) => !i.done).length;

    const newNotes = [];
    for (const body of NOTES) {
      const exists = (await client.query(`SELECT id FROM "ProjectNote" WHERE "projectId" = $1 AND body = $2`, [PROJECT_ID, body])).rows[0];
      if (!exists) newNotes.push(body);
    }

    const renames = [];
    for (const t of RENAME_TARGETS) {
      const rows = (await client.query(`SELECT id, "${t.column}" AS value FROM "${t.table}" WHERE "${t.column}" ~ 'Hackatón'`)).rows;
      for (const r of rows) {
        const next = rename(r.value);
        if (next !== r.value) renames.push({ ...t, id: r.id, from: r.value, to: next });
      }
    }

    console.log(`Proyecto: ${proj.title} (estado actual: ${proj.status})`);
    console.log(`Subtareas: ${items.length} en total, ${pendingItems} por marcar como hechas`);
    console.log(`Notas de bitácora: ${newNotes.length} por publicar de ${NOTES.length}; etiqueta a: ${master?.name ?? "nadie (no hallé al máster de ET)"}`);
    console.log(`Títulos a renombrar: ${renames.length}`);
    for (const r of renames) console.log(`  [${r.table}] «${r.from}» → «${r.to}»`);

    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    for (const body of newNotes) {
      await client.query(
        `INSERT INTO "ProjectNote" (id, "projectId", body, author, "authorRole", "mentionIds", links)
         VALUES ($1, $2, $3, $4, $5, $6::text[], '[]'::jsonb)`,
        [randomUUID(), PROJECT_ID, body, AUTHOR, AUTHOR_ROLE, master ? [master.id] : []],
      );
    }
    await client.query(`UPDATE "ChecklistItem" SET done = true, "updatedAt" = now() WHERE "projectId" = $1 AND done = false`, [PROJECT_ID]);
    await client.query(`UPDATE "Project" SET status = 'COMPLETADO', "updatedAt" = now() WHERE id = $1 AND status <> 'COMPLETADO'`, [PROJECT_ID]);
    for (const r of renames) {
      await client.query(`UPDATE "${r.table}" SET "${r.column}" = $2 WHERE id = $1`, [r.id, r.to]);
    }
    await client.query("COMMIT");
    console.log("\nListo: notas publicadas, subtareas hechas, proyecto completado y títulos renombrados.");
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
    if (/no existe/.test(String(e?.message))) process.exit(1);
    if (attempt < 4) await new Promise((r) => setTimeout(r, 4000));
  }
}
console.error("No se pudo completar tras 4 intentos. Reintenta o enciende WARP.");
process.exit(1);
