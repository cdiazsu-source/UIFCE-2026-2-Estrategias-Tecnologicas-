% Propuesta: Repositorio Documental Permanente UIFCE
% De Estrategias Tecnológicas (ET) para Gestión del Conocimiento (GC) · 2026-2

# 1. Contexto y problema que se busca resolver

Al preparar la planeación de ET para 2026-2 identificamos un patrón que se repite semestre a semestre y que no depende de la voluntad de cada máster, sino de cómo está organizado hoy el Drive general: **cada máster entrante hereda una carpeta de semestre ya cerrada, y para no partir de cero termina copiando carpetas completas de semestres anteriores dentro de su propia carpeta**. Esto tiene tres costos concretos:

1. **Se pierde trazabilidad.** No queda un lugar único donde se pueda ver la evolución completa de un proyecto de continuidad (por ejemplo, la metodología de microtalleres, o la estrategia de redes sociales) a través de varios semestres; queda repartida en copias sueltas dentro de cada carpeta semestral.
2. **Se duplica contenido innecesariamente**, en vez de referenciarlo.
3. **El conocimiento se pierde si no se organiza.** En el diagnóstico de ET 2026-2 identificamos esto explícitamente como brecha, y tuvimos un caso concreto que lo ilustra: la pérdida de la cuenta de Instagram institucional @uifce_un, sin un respaldo documental centralizado de accesos y credenciales que permitiera resolverlo con rapidez.

Este mismo diagnóstico surgió, de forma independiente, en la reunión de empalme entre la líder saliente y la entrante de ET: la recomendación explícita que ambas construyeron en esa conversación fue **dejar de copiar carpetas completas y, en su lugar, mantener un repositorio único por proyecto del cual cada persona tome accesos directos**. Esta propuesta traduce esa idea en un modelo concreto para el Drive general, y la trae a GC porque el repositorio general es una responsabilidad que excede a un área individual.

# 2. Principio propuesto: separar "lo vigente" de "lo permanente"

Hoy el Drive parece estar organizado principalmente por **semestre → área** (ej. `00. 2025-2 Estrategias Tecnológicas`). Eso funciona bien para el trabajo del día a día de un semestre, pero no distingue entre dos tipos de contenido con ciclos de vida muy distintos:

- **Contenido vigente**: lo que un área está produciendo activamente *este* semestre (borradores, piezas en curso, correspondencia del semestre).
- **Contenido permanente**: lo que un proyecto necesita conservar y heredar entre semestres para no perder continuidad (metodologías ya validadas, plantillas, credenciales y accesos, historial de decisiones, resultados acumulados).

La propuesta es que ambos coexistan, pero en estructuras separadas y con reglas distintas de propiedad y edición.

# 3. Modelo propuesto para el Drive general

```
📁 UIFCE — Drive General
│
├── 📁 [ÁREA] — Repositorio Permanente        ← gobernado por GC + máster del área
│   ├── 📁 [Proyecto/Iniciativa de continuidad 1]
│   │   ├── Ficha del proyecto (README: qué es, estado, responsable actual)
│   │   ├── Metodología / manual vigente
│   │   ├── Accesos y credenciales (si aplica, con control de acceso restringido)
│   │   └── Historial (evolución por semestre, solo lo que deba conservarse)
│   ├── 📁 [Proyecto/Iniciativa de continuidad 2]
│   └── ...
│
└── 📁 [ÁREA] — Semestre [AAAA-N]              ← carpeta de trabajo del semestre en curso
    ├── (todo el contenido operativo del semestre, como hoy)
    └── [accesos directos] hacia las carpetas del Repositorio Permanente que
        ese semestre necesita usar o actualizar
```

Con este modelo, un proyecto de continuidad (ej. "Metodología de Microtalleres", "Estrategia de Redes Sociales", "Extensión Solidaria") vive en **un solo lugar** que se va actualizando semestre a semestre, y cada carpeta semestral solo referencia ese lugar en vez de copiarlo. Al cierre de cada semestre, la máster de turno (con acompañamiento de GC si se necesita) decide, junto con su coordinador, **qué material pasa del semestre vigente al repositorio permanente** — no todo lo producido en un semestre necesita conservarse indefinidamente, y ese filtro es justamente lo que hoy no existe.

# 4. Convención mínima de organización (para que sea buscable)

Para que el repositorio permanente sea útil y no otra carpeta más donde el material se pierde, proponemos que cada carpeta de proyecto dentro de "Repositorio Permanente" siga una convención mínima y común a todas las áreas:

- **Ficha del proyecto** (un documento corto, tipo README): qué es el proyecto, en qué estado está, quién es el responsable actual, y desde cuándo existe.
- **Metadatos mínimos en el nombre de cada archivo**: fecha, tipo de contenido y autor (ej. `2026-2_manual-microtalleres_ET.docx`), para que sea legible sin tener que abrir cada archivo.
- **Un único documento "vigente" por tema**, no versiones sueltas sin fechar — las versiones anteriores van a una subcarpeta de historial, no se mezclan con la vigente.

# 5. Roles propuestos

- **Gestión del Conocimiento (GC)**: define y mantiene la arquitectura general del Drive (esta propuesta), aprueba la convención de nomenclatura para que sea consistente entre áreas, y acompaña la migración inicial del contenido que ya existe hoy disperso en carpetas de semestres anteriores.
- **Cada área (ej. ET)**: es responsable de mantener actualizado su propio repositorio permanente siguiendo la convención acordada, y de hacer el filtro de cierre de semestre (qué pasa al repositorio permanente y qué no).

# 6. Propuesta concreta: ET como piloto

ET ya reorganizó su carpeta de 2026-2 bajo esta misma lógica internamente (separando gestión/planeación, proyectos por categoría, y recursos compartidos), como preparación para este modelo. Proponemos que **ET sea el área piloto** para validar el modelo de Repositorio Permanente antes de extenderlo a las demás áreas (AA, DS, Virtualización, CL, Coordinación): así GC puede ajustar la convención con un caso real antes de pedirle a todas las áreas que migren su material.

# 7. Lo que se pide a GC

1. Retroalimentación sobre este modelo (separación vigente/permanente, convención de nomenclatura, roles).
2. Aval para crear, dentro del Drive general, la carpeta `ET — Repositorio Permanente` como piloto.
3. Definir en conjunto qué proyectos de ET migran primero al repositorio permanente (candidatos naturales: metodología de microtalleres, manual de identidad/piezas gráficas, estrategia de redes sociales, y el histórico de informes de gestión).
4. Acordar si GC prefiere liderar directamente la migración del contenido disperso existente, o delegarla en cada área con acompañamiento puntual de GC.
