"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior, getSession } from "@/lib/session";

/** Crea, actualiza o borra la ficha de un equipo (o del tablero/proyector,
 *  número 0) de una sala de cómputo: nombre, códigos de la torre, software
 *  instalado y pendiente, y qué tiene de fondo de pantalla / contenido
 *  proyectado — cada pantalla es una vitrina publicitaria de la unidad.
 *  Campos vacíos borran el dato (la UI vuelve a mostrar solo el número). */
export async function updateLabSeat(
  room: string,
  seatNumber: number,
  patch: {
    name?: string;
    software?: string[];
    pending?: string[];
    wallpaper?: string;
    assetTag1?: string;
    assetTag2?: string;
    isProjector?: boolean;
  },
): Promise<void> {
  if (await blockedForJunior()) return;

  const name = patch.name?.trim() || null;
  const wallpaper = patch.wallpaper?.trim() || null;
  const assetTag1 = patch.assetTag1?.trim() || null;
  const assetTag2 = patch.assetTag2?.trim() || null;
  const software = patch.software ?? [];
  // Un programa no puede estar instalado y pendiente a la vez.
  const pending = (patch.pending ?? []).filter((k) => !software.includes(k));

  const data = { name, software, pending, wallpaper, assetTag1, assetTag2 };
  await prisma.labSeat.upsert({
    where: { room_number: { room, number: seatNumber } },
    update: data,
    create: { room, number: seatNumber, ...data, isProjector: !!patch.isProjector },
  });

  revalidatePath("/herramientas");
}

/** Agrega una observación al equipo (crea su ficha si aún no existe). */
export async function addLabSeatComment(room: string, seatNumber: number, content: string): Promise<void> {
  if (await blockedForJunior()) return;
  const text = content.trim();
  if (!text) return;

  const s = await getSession();
  const author = s.authed ? (s.who ?? "Máster") : null;

  const seat = await prisma.labSeat.upsert({
    where: { room_number: { room, number: seatNumber } },
    update: {},
    create: { room, number: seatNumber, isProjector: seatNumber === 0 },
  });
  await prisma.labSeatComment.create({ data: { seatId: seat.id, author, content: text.slice(0, 2000) } });

  revalidatePath("/herramientas");
}

export async function deleteLabSeatComment(commentId: string): Promise<void> {
  if (await blockedForJunior()) return;
  await prisma.labSeatComment.deleteMany({ where: { id: commentId } });
  revalidatePath("/herramientas");
}
