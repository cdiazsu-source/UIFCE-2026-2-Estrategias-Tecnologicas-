"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";

/** Nombra (o quita el nombre de) un equipo puntual de una sala de cómputo,
 *  para la disposición interactiva de Herramientas y licencias. Vacío borra
 *  el nombre (la UI vuelve a mostrar solo el número). */
export async function updateLabSeatName(room: string, seatNumber: number, rawName: string): Promise<void> {
  if (await blockedForJunior()) return;
  const name = rawName.trim();

  await prisma.labSeat.upsert({
    where: { room_number: { room, number: seatNumber } },
    update: { name: name || null },
    create: { room, number: seatNumber, name: name || null },
  });

  revalidatePath("/herramientas");
}
