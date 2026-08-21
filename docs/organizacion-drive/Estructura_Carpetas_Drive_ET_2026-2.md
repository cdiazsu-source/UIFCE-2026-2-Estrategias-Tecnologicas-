% Propuesta de Estructura de Carpetas — Drive ET 2026-2
% UIFCE — Unidad de Informática, Facultad de Ciencias Económicas, UNAL

# 1. Criterios de diseño

La estructura de 2025-2 que enviaste (carpetas `0.` a `7.` planas, por proceso) funcionó bien como archivo, pero mezcla dos cosas distintas: **procesos permanentes del área** (consentimientos, página web) y **proyectos puntuales del semestre** (Semana UIFCE, Extensión Solidaria). Para 2026-2 propongo separar eso con más claridad, por tres razones:

1. **Continuidad**: varias novedades de este semestre (Instagram/LinkedIn/TikTok como ideas independientes, el repositorio con IA, el acompañamiento interárea formalizado) no tenían un lugar natural en la estructura anterior.
2. **Trazabilidad con la Planeación**: cada carpeta de proyecto debería poder enlazarse 1 a 1 con una fila de `Estrategias Tecnológicas-Planeación 2026-2.xlsx` (columna "Categoría"/"Idea principal"). Eso es lo que permite, más adelante, que una aplicación lea el Drive y muestre estado real de cada iniciativa.
3. **Lo que propuso la misma líder saliente en el empalme**: no copiar carpetas completas semestre a semestre, sino mantener un repositorio único y tomar **accesos directos** (⌘/clic derecho → "Añadir acceso directo") desde la carpeta del semestre actual hacia el material histórico. Eso evita duplicar Gigabytes cada semestre y mantiene un solo lugar "vivo".

# 2. Estructura propuesta

```
📁 ET · 2026-2
│
├── 00. Gestión y Planeación
│   ├── Diagnostico_ET_2026-2
│   ├── Manual_de_Funciones_ET_2026-2
│   ├── Portafolio_de_Proyectos_ET_2026-2
│   ├── Plan_de_Acompanamiento_Interarea_ET_2026-2
│   ├── Estrategias Tecnológicas-Planeación 2026-2 (xlsx maestro)
│   ├── Transcripcion_Empalme_ET_2026-2
│   └── [acceso directo] Informes de gestión 2025-I / 2025-II / 2026-I
│
├── 01. Consentimientos y Monitores
│   ├── Script y plantilla de generación de consentimientos
│   ├── Consentimientos firmados
│   └── Lista de monitores vigente
│
├── 02. Redes y Canales
│   ├── Instagram
│   ├── LinkedIn
│   ├── TikTok
│   └── YouTube
│
├── 03. Producción de Contenido
│   ├── Piezas gráficas (calendario editorial)
│   ├── Videos y Hacks Informáticos
│   ├── Carteleras (física y digital)
│   └── Piezas de software disponible por sala
│
├── 04. Página Web y Micrositio
│   ├── Micrositio (equipo, cursos libres)
│   └── Blog UIFCE
│
├── 05. Eventos
│   ├── Semana UIFCE 2026-2 (Hackatón, microtaller, conferencia, stand)
│   └── Microtalleres (cronograma, formatos, certificados)
│
├── 06. Proyectos Estratégicos
│   ├── Extensión Solidaria
│   ├── Boletín Digital UIFCE
│   └── Red de Aliados Académicos
│
├── 07. Acompañamiento a Cursos Libres
│   └── Línea gráfica y certificados CL
│
├── 08. Acompañamiento Interárea
│   └── Registro de solicitudes (AA, GC, DS, Virtualización, CL, Coordinación)
│
├── 09. Innovación — IA y Automatización
│   ├── Repositorio de material clasificado
│   └── Flujos de edición automatizada
│
├── 10. Proyectos de Estudio
│   └── (se mantiene igual que en 2025-2)
│
├── 11. Recursos Compartidos
│   ├── Identidad visual / Imagen institucional
│   ├── Fotos institucionales (por semestre)
│   └── Plantillas y formatos generales
│
└── 12. Informe Final e Histórico
    └── [accesos directos a cada semestre anterior, no copias]
```

# 3. Correspondencia con la estructura de 2025-2

| Carpeta 2025-2 | Pasa a ser en 2026-2 |
|---|---|
| `0. ET-Consentimiento` | `01. Consentimientos y Monitores` |
| `1. ET-Difusión` | Se divide en `02. Redes y Canales` (por plataforma) y `03. Producción de Contenido` (piezas/videos/carteleras) |
| `2. ET-Pagina Web` | `04. Página Web y Micrositio` |
| `3. ET-Semana UIFCE` | `05. Eventos → Semana UIFCE 2026-2` |
| `4. ET-Extension solidaria` | `06. Proyectos Estratégicos → Extensión Solidaria` |
| `5. ET-Microtalleres` | `05. Eventos → Microtalleres` |
| `6. ET-Proyectos de estudio` | `10. Proyectos de Estudio` (igual) |
| `7. ET-Informe final` | `12. Informe Final e Histórico` |
| *(no existía)* | `08. Acompañamiento Interárea`, `09. Innovación — IA y Automatización`, `11. Recursos Compartidos` — todas nuevas para 2026-2 |

# 4. Dónde guardar lo que ya generamos

Los seis documentos de esta consultoría van completos en **`00. Gestión y Planeación`**, porque son documentos de gobierno del área (no de un proyecto puntual): Diagnóstico, Manual de Funciones, Portafolio de Proyectos, Plan de Acompañamiento Interárea, la Planeación (xlsx maestro) y la Transcripción del Empalme. Esa carpeta es, en la práctica, el "panel de control" del área — el primer lugar al que debería entrar cualquier persona nueva.

# 5. Pensando en la futura app de seguimiento (checklist, calendario, entregables de estudiantes)

Para que esta estructura sea un buen insumo de un frontend/backend con trackeo en tiempo real más adelante, conviene resolver desde ya tres cosas:

**Nombres estables y sin ambigüedad.** Usa siempre el mismo prefijo numérico de dos dígitos y el mismo nombre de carpeta semestre a semestre (`02. Redes y Canales`, no a veces "Redes" y a veces "Redes Sociales"). Eso permite que un backend futuro identifique carpetas por nombre/ruta de forma confiable, no solo por ID.

**Una fila = un proyecto = una carpeta.** Cada idea de la hoja "Planeación del Área" debería tener una carpeta (o subcarpeta) correspondiente con el mismo nombre. Te recomiendo agregar ya, en esa hoja, dos columnas nuevas: **"Enlace carpeta Drive"** y **"Estado"** (Por iniciar / En curso / Completado). Hoy esas dos columnas son manuales; el día de mañana son exactamente los campos que un backend leería para mostrar el seguimiento visual que describes. Es el paso intermedio más barato entre "Excel" y "aplicación".

**Entregables de estudiantes de corresponsabilidad.** En vez de crear una subcarpeta por estudiante (se vuelve difícil de agregar/consultar), te recomiendo una carpeta `Entregables/` dentro de cada proyecto que lo requiera (ej. `05. Eventos/Semana UIFCE 2026-2/Entregables/`), y centralizar el checklist de quién entrega qué y cuándo en **una sola hoja de seguimiento** (puede ser una pestaña adicional en el mismo Excel de Planeación, o un Google Sheet aparte por evento). Es mucho más fácil de leer automáticamente después que decenas de carpetas sueltas por persona.

**Evita duplicar, usa accesos directos.** Todo lo histórico (informes de gestión anteriores, carpetas de semestres previos) debería vivir en un único repositorio permanente y enlazarse por acceso directo desde `00. Gestión y Planeación` y `12. Informe Final e Histórico`, no copiarse. Esto es, de hecho, la idea de "Repositorio documental permanente de Estrategias Tecnológicas" que ya está en la Planeación 2026-2 — esta reorganización de carpetas es literalmente el primer paso para ejecutarla.

# 6. Alcance de esta propuesta

Este documento es una recomendación de estructura, no una ejecución automática: no tengo en este momento una conexión activa a tu Google Drive para crear las carpetas por ti. Si más adelante conectas Google Drive a la conversación (hay un conector disponible para eso), puedo crear la estructura completa directamente; mientras tanto, este árbol de carpetas y la tabla de correspondencia sirven como guía para crearla manualmente.
