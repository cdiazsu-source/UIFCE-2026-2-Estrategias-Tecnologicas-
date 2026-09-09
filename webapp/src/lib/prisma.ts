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
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
