/**
 * Renombra el proyecto `et-en-marcha`, publica en su bitácora la historia de la plataforma por etapas
 * (resumen de las versiones de GitHub) y marca como hecha la subtarea de Difusión física y Calendario.
 *
 *   Uso, desde webapp/ (por defecto solo MUESTRA lo que haría):
 *     node scripts/save-bitacora-et-en-marcha.mjs
 *     node scripts/save-bitacora-et-en-marcha.mjs --apply      <- aplica los cambios
 *
 * Qué hace (es idempotente; se puede volver a correr):
 *   1. Título nuevo: «Oficina de Gestión de Proyectos (PMO) de Estrategias Tecnológicas "ET en Marcha"».
 *   2. Publica 7 notas (una por etapa) con la fecha de cierre de cada etapa, para que la bitácora quede en orden
 *      cronológico. No etiquetan a nadie (son un registro histórico). No repite las que ya existan.
 *   3. Marca como hecha «Construir Difusión física (catálogo de espacios) y el módulo Calendario».
 *
 * Escribe en la BD de producción (la de webapp/.env): lo corre una persona del equipo, no el agente.
 * Se puede borrar después de usarlo.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

const PROJECT_ID = "et-en-marcha";
const NEW_TITLE = 'Oficina de Gestión de Proyectos (PMO) de Estrategias Tecnológicas "ET en Marcha"';
const AUTHOR = "Asistente de ET en Marcha";
const AUTHOR_ROLE = "Asistente";
const ITEM_PREFIX = "Construir Difusión física";

// Cada nota lleva la fecha de cierre de su etapa (mediodía, hora de Colombia = 17:00 UTC).
const NOTES = [
  {
    date: "2026-08-27",
    body: `PLATAFORMA · Etapa 1: arranque y base técnica (21 al 27 de agosto)

Avance
- La planeación inicial del semestre (diagnóstico, manual, portafolio, acompañamiento interárea y empalme) pasó a una aplicación propia: Next.js, Prisma y Neon, desplegada en Vercel.
- Primeras secciones: Equipo, Proyectos de estudio y Línea gráfica; creación de proyectos desde cero; fechas en hora de Bogotá.
- Bitácora firmada (solo el equipo deja notas, con nombre, cargo y fecha), acceso con sesión en todo el sitio y respaldos de la base de datos.

Próximo
- Checklist con responsables, etiquetas de urgencia y seguimiento de redes.

Bloqueo
- Ninguno.`,
  },
  {
    date: "2026-09-14",
    body: `PLATAFORMA · Etapa 2: seguimiento operativo (2 al 14 de septiembre)

Avance
- Checklist reordenable y ligado a la bitácora; etiquetas de urgencia con límite de proyectos activos (WIP); responsable por proyecto, color por persona, filtros y buscador.
- Redes sociales con KPIs, gráficas y tracker mensual de LinkedIn; oficialización de cuentas en tres estados.
- Proyectos de estudio con sus cortes, consentimientos de imagen con panel de firmas y plantillas con QR de Instagram.
- Diagnóstico DOFA interactivo, boceto de la Sala 1, Difusión física y módulo Calendario.

Próximo
- Campo Solicitante y seguimiento de contactos con empresas.

Bloqueo
- Ninguno.`,
  },
  {
    date: "2026-10-07",
    body: `PLATAFORMA · Etapa 3: solicitantes, vinculación y semillas (19 de septiembre al 7 de octubre)

Avance
- Campo Solicitante en cada proyecto, separado del responsable.
- LinkedIn: captura rápida de cuatro métricas con variación y plantilla de perfil por persona.
- «Empresas de interés» con perfiles de LinkedIn, dentro de Aliados.
- Botón «Semilla de proyecto»: genera con IA un proyecto y su checklist inicial.
- Conexión a Neon optimizada para entornos serverless.

Próximo
- Identidad visual oficial de la UIFCE y perfiles por persona.

Bloqueo
- Ninguno.`,
  },
  {
    date: "2026-10-18",
    body: `PLATAFORMA · Etapa 4: identidad visual y perfiles (10 al 18 de octubre)

Avance
- Interfaz con la paleta oficial de la UIFCE, menú lateral y la mascota UIFCITO sin recolorear; la guía de línea gráfica se actualiza desde un archivo único.
- Apartado Desarrollador y botón «Contexto para IA» en cada proyecto.
- Perfiles separados para cada monitor Junior, con saludo propio, «Ver como» y campana de novedades de bitácora.
- Enlaces con nombre en proyectos y notas; panel con menos ruido visual (secciones contraídas y proyectos en lista).

Próximo
- Meta de contactos por empresa, tracker de egresados y control de horas del equipo.

Bloqueo
- Ninguno.`,
  },
  {
    date: "2026-10-22",
    body: `PLATAFORMA · Etapa 5: gestión del equipo (19 al 22 de octubre)

Avance
- Empresas de interés con meta de cuatro contactos por empresa y tracker de egresados con su botón desde el proyecto.
- Horas del equipo (plan y real, 20 h por semana) y horario de oficina por edificio; cada Junior ve solo lo suyo.
- Capa de bienvenida para cada perfil y huella digital de los monitores para el máster; tiempo tarde acumulado; post-it del máster.
- Buscador global, menú propio del Junior y resumen de versiones en Desarrollador.

Próximo
- Presentación para la reunión de coordinación.

Bloqueo
- Ninguno.`,
  },
  {
    date: "2026-10-30",
    body: `PLATAFORMA · Etapa 6: reuniones y gobernanza (23 al 30 de octubre)

Avance
- Reunión de coordinación en páginas (general, entregados, en curso y bloqueos, próximo corte y notas), con modo diseño, presentación a pantalla completa e historial de reuniones guardadas.
- Plantillas con piezas y tipo de enlace (Canva, Drive, Figma o nombre propio); las plantillas se enlazan a cada proyecto.
- Comités de Gestión: lista de reuniones de coordinación y de dirección, desde donde se abre la presentación.

Próximo
- Ordenar el menú, cerrar Términos y Condiciones y depurar la clasificación de proyectos.

Bloqueo
- Ninguno.`,
  },
  {
    date: "2026-11-11",
    body: `PLATAFORMA · Etapa 7: ordenamiento del portafolio (6 al 11 de noviembre)

Avance
- Menú de Equipo agrupado (personas, horas y horario, actividad de los Junior); Términos y Condiciones de ET aprobados y cerrados; filtro «Planeación Excel».
- Plano real de la Sala 1 con ficha completa por equipo: códigos de torre, software en tres estados y bitácora de observaciones.
- Nueva clasificación en cuatro líneas de trabajo y quince categorías («Articulación con…», Comunicación, Eventos y vinculación y Gestión interna), con regla de decisión y prompt de proyecto que explica la elección.

Próximo
- Aplicar la migración de la ficha de equipo, definir contraseñas propias para los perfiles Junior y completar el campo Solicitante en todos los proyectos.

Bloqueo
- Ninguno.`,
  },
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
    const proj = (await client.query(`SELECT id, title FROM "Project" WHERE id = $1`, [PROJECT_ID])).rows[0];
    if (!proj) throw new Error(`El proyecto ${PROJECT_ID} no existe (¿corriste npm run db:seed?).`);

    const item = (await client.query(`SELECT id, done FROM "ChecklistItem" WHERE "projectId" = $1 AND text LIKE $2`, [PROJECT_ID, ITEM_PREFIX + "%"])).rows[0];

    const newNotes = [];
    for (const n of NOTES) {
      const exists = (await client.query(`SELECT id FROM "ProjectNote" WHERE "projectId" = $1 AND body = $2`, [PROJECT_ID, n.body])).rows[0];
      if (!exists) newNotes.push(n);
    }

    console.log(`Título actual: «${proj.title}»`);
    console.log(`Título nuevo:  «${NEW_TITLE}»${proj.title === NEW_TITLE ? "  (ya está)" : ""}`);
    console.log(`Subtarea «${ITEM_PREFIX}…»: ${item ? (item.done ? "ya está hecha" : "se marcará como hecha") : "no la encontré (se omite)"}`);
    console.log(`Notas por publicar: ${newNotes.length} de ${NOTES.length}`);
    for (const n of newNotes) console.log(`  ${n.date} · ${n.body.split("\n")[0]}`);

    if (!APPLY) {
      console.log("\nSimulación: no se cambió nada. Para aplicar, corre con --apply.");
      return;
    }

    await client.query("BEGIN");
    if (proj.title !== NEW_TITLE) {
      await client.query(`UPDATE "Project" SET title = $2, "updatedAt" = now() WHERE id = $1`, [PROJECT_ID, NEW_TITLE]);
    }
    if (item && !item.done) {
      await client.query(`UPDATE "ChecklistItem" SET done = true, "updatedAt" = now() WHERE id = $1`, [item.id]);
    }
    for (const n of newNotes) {
      await client.query(
        `INSERT INTO "ProjectNote" (id, "projectId", body, author, "authorRole", "mentionIds", links, "createdAt")
         VALUES ($1, $2, $3, $4, $5, '{}'::text[], '[]'::jsonb, $6::timestamptz)`,
        [randomUUID(), PROJECT_ID, n.body, AUTHOR, AUTHOR_ROLE, `${n.date}T17:00:00Z`],
      );
    }
    await client.query("COMMIT");
    console.log("\nListo: título actualizado, subtarea marcada y notas publicadas.");
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
