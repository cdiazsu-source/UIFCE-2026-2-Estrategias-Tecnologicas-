import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Prisma habla con Neon por WebSocket sobre :443 (no por el puerto 5432 de
// Postgres). Muchas redes (campus UNAL, algunos ISP) resetean el protocolo
// Postgres crudo en :5432 aunque el TCP "abra"; el tráfico web a Neon sí pasa.
// El adaptador también reduce el arranque en frío de las funciones de Vercel.
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Cada instancia serverless atiende pocas consultas a la vez: un pool
    // pequeño evita agotar las conexiones del pooler de Neon al escalar.
    max: 5,
    // Neon suspende el cómputo y cierra sockets inactivos; se sueltan antes
    // de que el servidor los corte para no reutilizar una conexión muerta.
    idleTimeoutMillis: 10_000,
    // Margen para el despertar del cómputo suspendido (arranque en frío).
    connectionTimeoutMillis: 30_000,
  });

  // Sin este listener, un socket inactivo cortado por Neon emite 'error' sin
  // manejador y tumba el proceso; así el pool solo descarta esa conexión.
  pool.on("error", (err) => {
    console.error("[prisma] conexión inactiva descartada:", err.message);
  });

  const adapter = new PrismaNeon(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
