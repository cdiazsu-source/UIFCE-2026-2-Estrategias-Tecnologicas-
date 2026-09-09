# Contexto del proyecto — leer antes de trabajar en este repositorio

Este archivo es el contexto de arranque para cualquier sesión de Claude Code que trabaje en este repositorio. Contiene lo que una persona nueva (o un agente) necesita saber antes de proponer cambios: quién es el usuario, qué es la UIFCE, qué se decidió este semestre y por qué, y qué falta por construir.

## 1. Qué es este proyecto

Este repositorio documenta la **planeación de inicio de semestre 2026-2 del área de Estrategias Tecnológicas (ET)**, una de las siete áreas de la **Unidad de Informática de la Facultad de Ciencias Económicas (UIFCE)**, Universidad Nacional de Colombia (UNAL). ET es el área encargada de redes sociales, difusión, piezas gráficas/audiovisuales, micrositio, microtalleres y eventos de la unidad.

Las siete áreas de la UIFCE (ver `docs/manual-funciones/` y la Guía de Empalme institucional, no incluida en este repo — ver numeral 4) son: **AA** (Apoyos Académicos), **GC** (Gestión del Conocimiento), **ET** (Estrategias Tecnológicas — este repositorio), **DS** (Desarrollo), **Virtualización**, **CL** (Cursos Libres) y **Coordinación**.

Todo el contenido de `docs/` y `planeacion/` fue construido a partir de fuentes reales: tres informes de gestión (2025-I, 2025-II, 2026-I), la Guía de Empalme UIFCE, la planeación operativa de 2026-1, y la transcripción de una reunión de empalme (~2 h) entre la líder saliente y la entrante de ET, grabada en video y procesada con reconocimiento de voz local.

## 2. Terminología y convenciones ya fijadas (no cambiar sin razón)

- Nombre correcto: **UIFCE** (mayúsculas), no "uifce" ni "Uifce" — fue una inconsistencia detectada explícitamente en el diagnóstico.
- **Hackatón** (no "Jacatón" — es un error de transcripción que aparece en fuentes de audio, corregido en todos los entregables).
- El área se refiere a sí misma como **ET** o **Estrategias Tecnológicas**; a la persona que la lidera cada semestre como **máster**; a los estudiantes que trabajan bajo ella como **monitores** (con roles como monitor de artes).
- Las cuentas institucionales relevantes: Instagram (**@ui_fce** — cuenta nueva 2026-2; la anterior **@uifce_un** se perdió y no se recuperó), LinkedIn (prioritario), TikTok (nueva, se crea este semestre), YouTube (en proceso de oficialización).
- Principio rector explícito del semestre 2026-2: **"calidad sobre cantidad"**, para posicionar la Unidad — aparece repetido en Manual, Portafolio y Planeación. Cualquier iniciativa nueva que se proponga debería enmarcarse en este principio.

## 3. Los seis documentos de `docs/` y qué resuelve cada uno

| Documento | Resuelve |
|---|---|
| `diagnostico/` | Línea base: qué pasó en 2025-I, 2025-II y 2026-I (métricas de redes, microtalleres, lecciones aprendidas, brechas identificadas). Es la fuente de "fundamento" de casi todas las ideas de la planeación. |
| `manual-funciones/` | Roles, funciones y estandarización del área para 2026-2. |
| `portafolio-proyectos/` | Detalle de cada proyecto/iniciativa del semestre (objetivo, alcance, cronograma, indicadores, responsable). |
| `acompanamiento-interarea/` | Protocolo de solicitud de piezas/apoyo de ET hacia y desde las otras 6 áreas (SLA, canal único, priorización). |
| `empalme/` | Transcripción limpiada y organizada por tema del video de empalme, más una lista de 14 compromisos accionables ya incorporados a la planeación. |
| `organizacion-drive/` | Dos propuestas: (a) reorganización de la carpeta de Drive propia de ET 2026-2, y (b) propuesta formal a Gestión del Conocimiento (GC) — que administra el Drive general de la UIFCE — para un repositorio documental permanente compartido entre áreas. **(b) está pendiente de aval de GC, no ejecutada aún.** |

## 4. Qué NO está en este repositorio, y por qué

- **Informes de gestión originales, Guía de Empalme, y hoja de evaluaciones de desempeño (Power BI)**: contienen evaluaciones personales nominales de monitores (feedback de pares, calificaciones individuales). Se excluyeron deliberadamente del control de versiones por privacidad de terceros que no son parte de este proyecto de código. Su contenido ya fue sintetizado (de forma agregada, sin atribución individual) dentro de `docs/diagnostico/`. Si se necesitan como fuente primaria, están en el Drive institucional de la unidad, no en este repo — esto es intencional y coherente con la propuesta de `docs/organizacion-drive/`: las fuentes primarias con datos sensibles permanecen en el Drive, no se duplican en git.
- **Audio/video de la reunión de empalme y modelo de transcripción**: pesan varios cientos de MB, no aportan valor de código, y su contenido ya está resumido en `docs/empalme/`.
- **Planeación de semestres anteriores (2025-2, 2026-1) en formato original**: se referencian y resumen en el diagnóstico, pero no se versionan aquí completas.

## 5. Estado de la migración a GitHub

Este repositorio fue preparado localmente (incluye `git init`, commit inicial, y `git remote add origin`) apuntando a:

```
https://github.com/cdiazsu-source/UIFCE-2026-2-Estrategias-Tecnologicas-.git
```

**Nadie ha hecho `git push` todavía** — el entorno donde se preparó este repositorio no tiene credenciales de GitHub del usuario. Para completar la migración, desde una máquina con acceso autenticado a esa cuenta de GitHub:

```bash
cd UIFCE-2026-2-Estrategias-Tecnologicas
git push -u origin main
```

(El repositorio remoto está vacío, así que este será el primer push.)

## 6. Próxima fase: seguimiento con checklist, calendario y entregables de estudiantes

El objetivo declarado del usuario es construir, sobre este contenido, una aplicación (frontend + backend) con trackeo en tiempo real: seguimiento visual por proyecto, checklist, calendario, y un apartado donde los estudiantes de corresponsabilidad que acompañan cada proyecto puedan reportar sus entregables.

**Punto de partida recomendado para esa fase**: `planeacion/planeacion_del_area.csv`. Cada fila es una iniciativa con columnas `Categoría, Actividad, Qué se debe hacer, Qué se espera, Fundamento, Entregables` — es, en efecto, un modelo de datos ya estructurado de "proyecto" con su propio checklist implícito en el campo `Entregables` (viñetas separadas por `\n* `).

Antes de diseñar el backend, conviene:

1. Agregar a ese CSV/xlsx (o a una tabla derivada) dos campos que hoy son manuales: **estado** (por iniciar / en curso / completado) y **enlace a la carpeta de Drive** correspondiente (ver el árbol propuesto en `docs/organizacion-drive/Estructura_Carpetas_Drive_ET_2026-2.md`) — así el backend puede enlazar cada proyecto con su evidencia real sin inventar una estructura paralela.
2. Definir un modelo de "entregable de estudiante" separado del modelo de "proyecto": un proyecto (fila del CSV) puede tener N entregables de N estudiantes distintos, cada uno con su propia fecha límite y estado — el campo `Entregables` actual es una lista de bullets de texto libre, no una tabla normalizada, y habrá que decidir si se migra a una tabla propia.
3. Si se agrega una base de datos, mantener `planeacion_del_area.csv` (o el `.xlsx`) como la fuente legible por humanos que se sincroniza hacia la base de datos — no al revés — para que quien no programa (la máster, los coordinadores) pueda seguir editando la planeación en Excel/Sheets sin tocar código.

## 7. Cómo se generaron estos documentos (por si hay que regenerarlos o extenderlos)

- Los `.docx` de `docs/` se generan con Node.js y la librería [`docx`](https://www.npmjs.com/package/docx) a partir de los scripts en `src/` (`build_manual.js`, `build_portafolio.js`, `build_acompanamiento.js`), que comparten helpers de estilo institucional en `src/docHelpers.js` (color primario `#7A1F2B`, tamaño carta, encabezado/pie con numeración).
- El `.xlsx` de `planeacion/` se genera con Python y `openpyxl` desde `src/build_planeacion_2026_2_v2.py` — una lista `IDEAS` de diccionarios (una entrada por iniciativa) que alimenta ambas hojas del libro (`Planeación` y `Planeación del Área`).
- Los `.md` de `docs/empalme/` y `docs/organizacion-drive/` se escribieron directamente en Markdown y se convirtieron a `.docx` con `pandoc`.

## 8. Prompt sugerido para la primera sesión de Claude Code en este repo

Si quien retoma esto no sabe por dónde empezar, este prompt es un punto de partida razonable (asume que ya se leyó este archivo, porque Claude Code lo carga automáticamente al abrir el repo):

> Quiero empezar a diseñar el backend de seguimiento descrito en la sección 6 de CLAUDE.md. Antes de escribir código: (1) revisa `planeacion/planeacion_del_area.csv` y propón un modelo de datos normalizado (proyecto, entregable, estudiante, estado, fechas) que no pierda la información que ya existe en las columnas actuales; (2) dime qué decisiones de alcance necesitas que yo tome antes de seguir (por ejemplo: base de datos a usar, si habrá autenticación de estudiantes, si el checklist se deriva automáticamente del campo `Entregables` o se captura aparte); (3) no toques los documentos de `docs/` ni el `.xlsx` de planeación — son la fuente de verdad editada por personas, el backend debe leerlos, no reemplazarlos.

Este prompt está escrito para frenar al agente antes de que empiece a generar código sin resolver las decisiones de producto primero (base de datos, autenticación, granularidad del checklist) — que son decisiones del usuario, no algo que un agente deba asumir.

## 9. Plantillas de trabajo (describir en lenguaje natural → salida lista)

- **Agregar una iniciativa nueva a la planeación**: prompt de [`planeacion/PLANTILLA_NUEVO_PROYECTO.md`](planeacion/PLANTILLA_NUEVO_PROYECTO.md). Produce una fila con el estilo del CSV e integra en `planeacion/planeacion_del_area.csv` + la lista `IDEAS` de `src/build_planeacion_2026_2_v2.py`. `planeacion_del_area.csv` es la fuente de verdad que consume la app; tras editarlo, `cd webapp && npm run db:seed` sincroniza sin sobrescribir lo que ya editaron las personas.
- **Dar una actualización de avance** (sección "Últimas actualizaciones" / bitácora de la app): prompt de [`planeacion/PLANTILLA_ACTUALIZACION_PROYECTO.md`](planeacion/PLANTILLA_ACTUALIZACION_PROYECTO.md). Produce una nota corta y estructurada (Avance / Próximo / Bloqueo) lista para pegar, e indica a qué proyecto va. El feed respeta saltos de línea; autor y fecha los pone la app.

## 10. Estado de la webapp `webapp/` (leer si se va a tocar la app)

La fase de la sección 6 ya está construida y en producción: **"ET en Marcha"**, una app **Next.js 14 (App Router) + Prisma + Postgres (Neon)** desplegada en **Vercel** (Production sigue la rama `main`; redespliega solo con cada `git push`). URL: `https://uifce-2026-2-estrategias-tecnologic-theta.vercel.app`. Toda la UI en español, tono corporativo.

**Estado a 2026-09-08:** rama `main` sincronizada con `origin/main`; las migraciones de `webapp/prisma/migrations/` (hasta `20260916120000_project_assignee`) están **todas aplicadas** en la BD de Neon de producción; el `db:seed` ya se corrió (hay usuarios, proyectos, proyectos de estudio con cortes, redes, tracker de LinkedIn, consentimientos). No hay nada pendiente de desplegar salvo lo que se cambie a partir de ahora.

**Reglas duras (no negociables):**

1. **Identidad de git: `Juan Diego Peña <tucorreo@ejemplo.com>`. No cambiarla nunca.** Es un correo de marcador deliberado (repo público). En una máquina nueva, fijarla *local* al repo: `git config user.name "Juan Diego Peña"` y `git config user.email "tucorreo@ejemplo.com"` — eso es preservarla, no cambiarla.
2. **El agente NO corre `prisma migrate`, `db:deploy`, `db:seed` ni `npx tsx prisma/seed.ts`** — el clasificador de permisos del harness lo bloquea y va contra producción. Las migraciones se escriben **a mano** como `webapp/prisma/migrations/AAAAMMDDHHMMSS_nombre/migration.sql` (+ actualizar `schema.prisma`); **el usuario** corre `db:deploy` + `db:seed`.
3. El repo de GitHub es **público**: nada de contraseñas ni secretos reales en el código. Las credenciales van como variables de entorno en Vercel (`SITE_PASSWORD`, `SITE_PASSWORD_JUNIOR`, `SITE_USER_DIRECTOR` / `SITE_PASSWORD_DIRECTOR`, `AUTH_SECRET`).
4. `webapp/.env` (git-ignored) apunta al **mismo** Neon de producción que usa Vercel. Cualquier script que escriba en BD impacta producción.
5. Mensajes de commit terminan con `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`. Un commit por feature. PowerShell 5.1 no acepta `&&` (comandos separados).

**Flujo de trabajo:**

- Fuente de verdad de proyectos: `planeacion/planeacion_del_area.csv` (LF). Un proyecto nuevo = fila ahí + fila en `planeacion/planeacion.csv` (CRLF) + entrada en la lista `IDEAS` de `src/build_planeacion_2026_2_v2.py`; se agregan con scripts Node que preservan el fin de línea y se verifican con `csv-parse`. Después el usuario corre `db:seed` (idempotente/aditivo; no sobrescribe lo editado en la app).
- Desplegar un cambio: (1) si hay migración nueva, el usuario corre `cd webapp && npm run db:deploy && npm run db:seed` contra Neon; (2) `git push` desde la raíz → Vercel redespliega; (3) verificar con Ctrl+Shift+R.
- Gráficas: SVG inline a mano, sin librería de charts.

**Acceso (`/login`, login compartido):** `UIFCE` / `ET2026` = perfil completo (edita todo); `UIFCE` / `TEAM` = perfil junior (registra KPIs, gestiona checklist y consentimientos; no edita el resto); `HENRY` / `UIFCEUNAL310.` = director. La **"Vista Junior"** (cookie `et_view`) deja al perfil completo ver la app como un junior. Todo overridable por entorno.

**Backlog conocido (no empezar sin que el usuario lo pida):**

- LinkedIn "Capa 2": descripciones de rol editables ES/EN (`roles.json`) + checklist de perfil de 100 pts (`profile-checklist.json`). La Capa 1 (tracker por persona en `/linkedin`, dentro de "Redes sociales") ya está.
- Fotos del equipo: van a `webapp/public/avatares/` y su nombre de archivo al campo "Foto" de cada persona.
- Auth fase 2: enlace mágico por correo + rol real por persona (`getSession()` daría `{userId, role}`).
- Verificar el nombre completo de "Brayan Sandoval" (se asumió "Brayan Santiago Maldonado Aparicio").

> El historial detallado sesión a sesión de esta app vivía en la memoria de Claude Code, que no se traslada entre máquinas ni cuentas. Esta sección es el resumen durable; para el detalle de un cambio concreto, `git log` sobre `webapp/`.
