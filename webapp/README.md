# ET en Marcha

App de seguimiento en vivo para la planeación de Estrategias Tecnológicas (UIFCE) 2026-2:

- **Panel principal**: progreso por proyecto + franja "situación actual". Permite crear proyectos propios (no vienen del CSV).
- **Detalle de proyecto**: checklist, bitácora, estado y enlace a Drive. Los proyectos propios además se editan y eliminan aquí.
- **Proyectos de estudio**: dos por monitor Junior, con cronograma y cuatro puntos de corte (fecha + estado) para seguimiento.
- **Línea gráfica**: guía de identidad visual (colores, franjas, formatos, lineamientos de Imagen Institucional).
- **Herramientas y licencias**, **Contactos** y **Equipo** (directorio interno editable, con correo y rol; sin inicio de sesión).

Next.js 14 (App Router) + TypeScript + Tailwind CSS + componentes estilo shadcn/ui + Prisma sobre PostgreSQL (Neon). Sin autenticación por ahora (ver `CLAUDE.md` en la raíz del repo para el porqué de estas decisiones).

## Requisitos

- Node.js 18.18 o superior (LTS recomendado) — [nodejs.org](https://nodejs.org)
- Una base de datos PostgreSQL. Recomendado: crear un proyecto gratuito en [neon.tech](https://neon.tech) y copiar el connection string.

## Puesta en marcha

```bash
cd webapp
npm install

# 1. Configura la base de datos
cp .env.example .env
# edita .env y pega tu DATABASE_URL de Neon

# 2. Crea las tablas (aplica todas las migraciones de prisma/migrations/)
npm run db:migrate

# 3. Siembra los datos
#    proyectos + checklist desde planeacion/planeacion_del_area.csv, y de arranque:
#    herramientas, contactos, equipo, proyectos de estudio y línea gráfica
npm run db:seed

# 4. Levanta la app
npm run dev
```

Abre http://localhost:3000.

## Volver a sincronizar proyectos desde el CSV

Cuando la máster edite `planeacion/planeacion_del_area.csv` (o el `.xlsx`, exportando de nuevo a CSV), corre:

```bash
npm run db:seed
```

Es seguro correrlo las veces que sea necesario: actualiza los campos de solo-lectura de cada proyecto (categoría, título, qué se debe hacer, qué se espera, fundamento) y **agrega** los ítems de checklist nuevos que aparezcan en `Entregables`, pero nunca sobrescribe ni borra subtareas que ya existan en la base de datos (aunque su texto haya cambiado ligeramente en el CSV) ni su estado (hecha/no hecha), responsable o fecha.

## Explorar los datos sin código

```bash
npm run db:studio
```

Abre una interfaz visual (Prisma Studio) para ver y editar las tablas directamente — útil para quien no programa.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm run start` | Build y servidor de producción |
| `npm run db:migrate` | Crea/actualiza las tablas en desarrollo (`prisma migrate dev`) |
| `npm run db:deploy` | Aplica las migraciones ya existentes sin generar nuevas (`prisma migrate deploy`) — para producción/CI |
| `npm run db:seed` | Sincroniza proyectos desde el CSV + siembra datos iniciales |
| `npm run db:studio` | Explorador visual de la base de datos |
| `npm run db:backup` | Exporta todas las tablas a `webapp/backups/backup-<fecha>.json` |

## Respaldos y persistencia

Los datos NO se pierden al redesplegar: viven en la base de datos gestionada de
Neon, independiente de Vercel. Un `git push` publica código nuevo y no toca la
base. `npm run db:seed` tampoco borra avances (ver la nota de arriba).

Para robustez adicional:

1. **Point-in-time restore de Neon** (recomendado, sin código): en el panel de
   Neon → tu proyecto → **Settings → Storage / History retention**, sube la
   ventana de retención (por defecto ~1 día; hasta 7 días en plan gratuito, más
   en planes pagos). Con eso puedes restaurar la base a cualquier momento dentro
   de la ventana (crea una rama desde un timestamp o restaura la principal).
2. **Respaldo manual a archivo**: `npm run db:backup` deja un JSON con todas las
   tablas en `webapp/backups/` (carpeta ignorada por git). Útil antes de una
   migración grande o para archivar el cierre de semestre. La restauración desde
   ese JSON es manual (script ad-hoc de reinserción).

## Despliegue en Vercel

1. Sube este repo a GitHub (ver instrucciones en el `CLAUDE.md` de la raíz).
2. En Vercel: "Add New Project", selecciona el repo, y en "Root Directory" indica `webapp`.
3. Agrega la variable de entorno `DATABASE_URL` (el mismo connection string de Neon) en la configuración del proyecto de Vercel.
4. Deploy. El plan gratuito de Vercel es más que suficiente para este volumen de uso.

Después del primer deploy —y cada vez que haya una migración nueva en `prisma/migrations/`— corre, apuntando al `DATABASE_URL` de producción:

```bash
npm run db:deploy   # aplica las migraciones pendientes
npm run db:seed     # idempotente: sólo agrega lo que falte
```
