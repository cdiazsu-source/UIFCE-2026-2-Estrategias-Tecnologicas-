# ET en Marcha

App de seguimiento en vivo para la planeación de Estrategias Tecnológicas (UIFCE) 2026-2: panel principal con progreso por proyecto, detalle de proyecto con checklist y bitácora, herramientas/licencias, y directorio de contactos.

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

# 2. Crea las tablas
npm run db:migrate

# 3. Siembra los datos desde planeacion/planeacion_del_area.csv
#    (proyectos + checklist inicial + herramientas/contactos de arranque)
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
| `npm run db:migrate` | Aplica el schema de `prisma/schema.prisma` a la base de datos |
| `npm run db:seed` | Sincroniza proyectos desde el CSV + siembra datos iniciales |
| `npm run db:studio` | Explorador visual de la base de datos |

## Despliegue en Vercel

1. Sube este repo a GitHub (ver instrucciones en el `CLAUDE.md` de la raíz).
2. En Vercel: "Add New Project", selecciona el repo, y en "Root Directory" indica `webapp`.
3. Agrega la variable de entorno `DATABASE_URL` (el mismo connection string de Neon) en la configuración del proyecto de Vercel.
4. Deploy. El plan gratuito de Vercel es más que suficiente para este volumen de uso.

Después del primer deploy, corre `npm run db:migrate` y `npm run db:seed` una vez desde tu máquina local apuntando al `DATABASE_URL` de producción (o usa `npx prisma migrate deploy` desde CI) para crear las tablas y sembrar los datos.
