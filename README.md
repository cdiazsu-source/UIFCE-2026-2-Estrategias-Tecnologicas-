# UIFCE 2026-2 — Estrategias Tecnológicas

Repositorio de planeación y documentación del área de **Estrategias Tecnológicas (ET)** de la **Unidad de Informática de la Facultad de Ciencias Económicas (UIFCE)**, Universidad Nacional de Colombia, para el semestre **2026-2**.

Este repositorio consolida los entregables de la planeación de inicio de semestre (diagnóstico, manual de funciones, portafolio de proyectos, plan de acompañamiento interárea, planeación operativa, y la transcripción del empalme entre la máster saliente y la entrante), y está preparado para servir de base a un futuro proyecto de seguimiento (frontend + backend) con checklist, calendario y trazabilidad de entregables por estudiante.

## Estructura

```
├── docs/
│   ├── diagnostico/              Diagnóstico ET 2026-2 (3 semestres de informes de gestión)
│   ├── manual-funciones/         Manual de Funciones y Estandarización
│   ├── portafolio-proyectos/     Portafolio de Proyectos 2026-2
│   ├── acompanamiento-interarea/ Plan de Acompañamiento Interárea
│   ├── empalme/                  Transcripción y notas del video de empalme
│   └── organizacion-drive/       Propuesta de estructura de Drive + propuesta a GC
├── planeacion/
│   ├── Estrategias Tecnológicas-Planeación 2026-2.xlsx   (fuente de verdad)
│   ├── planeacion.csv                                     (hoja "Planeación")
│   └── planeacion_del_area.csv                             (hoja "Planeación del Área", con columna ID)
├── src/
│   ├── docHelpers.js, build_manual.js, build_portafolio.js,
│   │   build_acompanamiento.js    → generan los .docx de docs/ (Node.js, librería `docx`)
│   └── build_planeacion_2026_2_v2.py → genera el .xlsx de planeacion/ (Python, `openpyxl`)
└── webapp/                        → "ET en Marcha": Next.js + Prisma/PostgreSQL,
                                       la app de seguimiento en vivo (ver webapp/README.md)
```

Cada documento en `docs/` existe en dos formatos: `.docx` (versión formal para compartir/imprimir) y `.md` (versión en texto plano, más fácil de leer y editar por un agente o en el propio repositorio).

## Cómo regenerar los entregables

Los `.docx` se generan desde los scripts de `src/` (requieren `node` y el paquete `docx`):

```bash
cd src && npm install docx && node build_manual.js
```

El `.xlsx` de planeación se genera con Python (`pip install openpyxl`):

```bash
cd src && python3 build_planeacion_2026_2_v2.py
```

## Para agentes / Claude Code

Ver [`CLAUDE.md`](./CLAUDE.md) para el contexto institucional completo antes de proponer cualquier cambio.

## Estado

Todos los entregables de la planeación de inicio de semestre 2026-2 están completos. La primera versión de la app de seguimiento ("ET en Marcha") vive en `webapp/` — ver `webapp/README.md` para ponerla en marcha (requiere Node.js y una base de datos PostgreSQL, por ejemplo en Neon).
