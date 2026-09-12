"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";

/** Crea, actualiza o borra la ficha de un equipo (o del tablero/proyector,
 *  número 0) de una sala de cómputo: nombre, licencias de software
 *  confirmadas y qué tiene de fondo de pantalla / contenido proyectado —
 *  cada pantalla es una vitrina publicitaria de la unidad. Campos vacíos
 *  borran el dato (la UI vuelve a mostrar solo el número). */
export async function updateLabSeat(
  room: string,
  seatNumber: number,
  patch: { name?: string; software?: string[]; wallpaper?: string; isProjector?: boolean },
): Promise<void> {
  if (await blockedForJunior()) return;

  const name = patch.name?.trim() || null;
  const wallpaper = patch.wallpaper?.trim() || null;
  const software = patch.software ?? [];

  await prisma.labSeat.upsert({
    where: { room_number: { room, number: seatNumber } },
    update: { name, software, wallpaper },
    create: { room, number: seatNumber, name, software, wallpaper, isProjector: !!patch.isProjector },
  });

  revalidatePath("/herramientas");
}
