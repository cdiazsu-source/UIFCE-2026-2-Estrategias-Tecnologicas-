# Plantilla — agregar un proyecto nuevo "hablándolo"

Cuando tengas una iniciativa nueva para la planeación de ET 2026-2 y quieras dejarla
formateada e integrada al repositorio sin pelear con el formato del CSV: abre una
sesión de Claude Code **en este repositorio** (así `CLAUDE.md` se carga solo), pega
el prompt de abajo, y describe el proyecto en tus palabras dentro de las comillas.

Hay dos destinos posibles y el prompt te deja elegir:

- **Iniciativa oficial de planeación** → una fila en `planeacion/planeacion_del_area.csv`.
  Es la fuente de verdad: tras `npm run db:seed` aparece para todo el equipo en la app,
  con su checklist sembrado desde los *Entregables*.
- **Algo tentativo / interno** → los campos listos para pegar en el botón
  **"Nuevo proyecto"** de la app (queda como proyecto propio, no toca el CSV).

---

## El prompt (cópialo tal cual)

```
Tengo una iniciativa nueva para la planeación de ET 2026-2. Te la cuento en bruto;
déjamela formateada e intégrala al repo.

LO QUE TENGO (mis palabras, sin pulir — puedo dictar):
"""
<<Habla libre: qué es, por qué surge (qué pendiente o problema resuelve), qué
queremos lograr y cómo se sabría que salió bien, quién lo haría, fechas o hitos si
los hay, con qué áreas se cruza.>>
"""

Antes de escribir nada:
- Si te falta algo esencial para redactarla bien (la categoría; si es CRÍTICO /
  PRIORITARIO / NUEVO; el resultado esperado en términos medibles; los entregables;
  o en qué evidencia del diagnóstico / empalme / informes se apoya), hazme máximo
  4 preguntas cortas y espera mi respuesta.
- Si con lo que te di alcanza, sigue directo.

Luego:
1. Redáctala con el mismo tono y nivel de detalle de las filas que ya están en
   `planeacion/planeacion_del_area.csv`: institucional, concreta, sin relleno,
   enmarcada en el principio "calidad sobre cantidad". Campos:
   - ID: slug en kebab-case, único, con uno de estos prefijos de familia:
     redes- · normativa- · produccion- · eventos- · continuidad- · cursoslibres- ·
     estrategicos- · innovacion- · documentacion- · acompanamiento-
     (propón uno nuevo solo si de verdad no encaja en ninguno).
   - Categoría: reutiliza una categoría ya existente en el CSV; añade
     " — CRÍTICO", " — PRIORITARIO" o " — NUEVO" solo si corresponde.
   - Actividad: título corto, una línea.
   - Qué se debe hacer: 2 a 5 frases, accionable.
   - Qué se espera: 1 a 3 frases, con una meta medible o verificable y, si aplica,
     una fecha ("semana 4", "antes del cierre del primer tercio"...).
   - Fundamento: 2 a 4 frases que citen algo real de `docs/diagnostico/`,
     `docs/empalme/` o un informe de gestión. Nada inventado; si no hay
     antecedente, dilo y explica el fundamento como necesidad nueva.
   - Entregables: 2 a 4 viñetas, cada una empezando con "* ".
2. Muéstramela de dos formas: (a) una tabla legible para revisar, y (b) la fila
   lista para copiar y pegar en la hoja de cálculo — una línea en formato CSV, con
   los campos de texto largo entre comillas y las viñetas de Entregables separadas
   por saltos de línea, igual que las filas actuales.
3. Intégrala al repo:
   - agrega la fila a `planeacion/planeacion_del_area.csv` (y a
     `planeacion/planeacion.csv` si esa hoja también lista las iniciativas);
   - agrega la entrada equivalente a la lista `IDEAS` de
     `src/build_planeacion_2026_2_v2.py` (claves: id, cat, idea, hacer, espera,
     fundamento, entregables, priority) para que el `.xlsx` quede consistente
     cuando se regenere;
   - recuérdame que `cd webapp && npm run db:seed` sincroniza la iniciativa a la
     app "ET en Marcha" (crea el proyecto y siembra su checklist desde los
     Entregables), y que el `.xlsx` hay que volver a exportarlo desde la hoja.
4. No toques otras filas, ni los documentos de `docs/`, ni el `.xlsx` a mano.

Si esto NO debe entrar todavía al CSV (es tentativo o interno), dímelo y en su
lugar dame los campos listos para pegar en el botón "Nuevo proyecto" de la app:
Título, Categoría, Etiqueta (Crítico/Prioritario/Nuevo/ninguna), Qué se debe
hacer, Qué se espera, Fundamento.
```

---

## Versión hablada corta (para dictar)

Si prefieres no escribir mucho, di algo con esta forma y el prompt hace el resto:

> "Nuevo proyecto para ET: **[tema]**. Surge porque **[pendiente o problema]**.
> Queremos lograr **[meta]** y sabríamos que salió bien si **[señal medible]**.
> Lo haría **[quién]**, para **[fecha o hito]**. Se cruza con **[área/s]**."

---

## Recordatorio de formato del CSV

`planeacion/planeacion_del_area.csv` — encabezado:

```
ID,Categoría,Actividad,Qué se debe hacer,Qué se espera,Fundamento,Entregables
```

- Los campos con comas o saltos de línea van **entre comillas dobles**.
- `Entregables` es una sola celda entre comillas con viñetas `* ` separadas por
  saltos de línea reales dentro de las comillas.
- El `ID` es un slug estable: no se cambia una vez creado (la app y el `.xlsx`
  lo usan como clave; ver `webapp/prisma/schema.prisma`).
- Categorías y prefijos de ID en uso: mira las filas existentes antes de inventar.
