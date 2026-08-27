# Plantilla — dar una actualización de un proyecto

Para registrar avances en la sección **"Últimas actualizaciones"** de la app
ET en Marcha (la bitácora de cada proyecto) sin que cada quien escriba distinto:
abre una sesión de Claude Code **en este repositorio**, pega el prompt de abajo,
y cuenta en tus palabras qué pasó. Te devuelve la nota corta y ordenada, lista
para pegar, e indica a qué proyecto va.

Sirve para uno o varios proyectos a la vez.

---

## El prompt (cópialo tal cual)

```
Quiero registrar una o más actualizaciones de avance para la sección
"Últimas actualizaciones" de la app ET en Marcha.

LO QUE PASÓ (mis palabras, sin pulir — puedo dictar):
"""
<<Por cada proyecto: qué se hizo desde la última vez, qué sigue y para cuándo, y
si hay algo trabado o que se necesite de alguien. Menciona cada proyecto por su
nombre o su tema.>>
"""

Para cada proyecto que mencione:
1. Identifica de qué proyecto se trata (contra `planeacion/planeacion_del_area.csv`
   o los proyectos de la app). Si hay ambigüedad, pregúntame antes de redactar.
2. Redacta la nota corta, concreta y entendible por cualquiera que NO siga el día
   a día del área (coordinación, otras áreas, dirección). Reglas:
   - Máximo ~45 palabras. Sin relleno; si usas una sigla o un nombre interno,
     que se entienda por contexto.
   - No repitas el nombre del proyecto (la app ya lo muestra) ni pongas la fecha
     (se sella sola).
   - Estructura en líneas cortas con etiqueta, en este orden; omite la que no
     aplique:
       Avance: <qué se logró o se movió, concreto y verificable>
       Próximo: <siguiente paso> (<fecha o semana>)
       Bloqueo: <qué falta o de quién se necesita algo>
   - Pasado para lo hecho; presente/futuro para lo que sigue.
   - Si el avance implica cambiar el estado del proyecto, añade una línea final:
     "Estado: pasa a En curso" (o "a Completado").
3. Devuélveme, por cada proyecto:
   - el título exacto del proyecto al que pegar la nota,
   - el texto de la nota, en un bloque de código, listo para copiar y pegar,
   - y el recordatorio de poner mi nombre en "Tu nombre" y, si aplica, mover el
     selector de Estado en el detalle del proyecto.

No inventes avances. Si algo no me quedó claro, pregúntame.
```

---

## Versión hablada corta (para dictar)

> "Actualización de **[proyecto]**: hicimos **[qué]**. Sigue **[qué]** para
> **[cuándo]**. Falta **[bloqueo, o 'nada']**."

Repite la frase por cada proyecto.

---

## Cómo se ve la nota

La sección "Últimas actualizaciones" respeta los saltos de línea, así que una
nota queda así:

```
Avance: logo aprobado por Imagen Institucional; 3 de 5 plantillas actualizadas.
Próximo: enviar plantillas de certificado a Cursos Libres (semana del 8 sep).
Bloqueo: falta respuesta de DS sobre el enlace foto→LinkedIn.
```

- El **autor** y la **fecha/hora** (en hora de Bogotá) los pone la app sola.
- El cambio de **Estado** (Por iniciar / En curso / Completado) es aparte: se
  mueve en el selector del detalle del proyecto, la nota solo lo anuncia.
