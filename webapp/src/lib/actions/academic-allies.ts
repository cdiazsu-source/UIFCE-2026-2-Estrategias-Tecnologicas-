"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior, canManageLeads, getSession } from "@/lib/session";
import { normalizeAsk, normalizeStatus } from "@/lib/convocation";

/** Acciones de «Aliados académicos» (/aliados): seguimiento de la convocatoria y notas de contacto las puede registrar cualquier
 *  sesión (perfil completo y Junior, como en «Empresas de interés»); el correo, los eventos y el borrado de notas son del perfil completo. */

const PROGRAMS = ["economia", "administracion", "contaduria"];

async function authorLabel(): Promise<string> {
  const s = await getSession();
  if (!s.authed) return "ET";
  const who = s.viewWho ?? s.who;
  if (!who) return "Máster ET";
  const t = who.replace(/[-_]/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function text(fd: FormData, k: string) {
  return String(fd.get(k) ?? "").trim();
}

/** Crea o actualiza el seguimiento de un profesor para un evento. `contactedAt` se fija la primera vez que sale de «Por contactar». */
export async function setFollowUp(eventId: string, allyId: string, input: { status: string; ask: string; note: string }) {
  if (!(await canManageLeads())) return;
  const status = normalizeStatus(input.status);
  const ask = normalizeAsk(input.ask);
  const note = input.note.trim().slice(0, 1000) || null;
  const updatedBy = await authorLabel();

  const prev = await prisma.convocationFollowUp.findUnique({ where: { eventId_allyId: { eventId, allyId } } });
  const contactedAt = status === "POR_CONTACTAR" ? null : (prev?.contactedAt ?? new Date());

  await prisma.convocationFollowUp.upsert({
    where: { eventId_allyId: { eventId, allyId } },
    create: { eventId, allyId, status, ask, note, contactedAt, updatedBy },
    update: { status, ask, note, contactedAt, updatedBy },
  });
  revalidatePath("/aliados");
}

export async function addAllyNote(allyId: string, body: string) {
  if (!(await canManageLeads())) return;
  const clean = body.trim().slice(0, 2000);
  if (!clean) return;
  await prisma.academicAllyNote.create({ data: { allyId, body: clean, author: await authorLabel() } });
  revalidatePath("/aliados");
}

export async function deleteAllyNote(id: string) {
  if (await blockedForJunior()) return;
  await prisma.academicAllyNote.delete({ where: { id } }).catch(() => {});
  revalidatePath("/aliados");
}

export async function updateAllyEmail(allyId: string, email: string) {
  if (await blockedForJunior()) return;
  const v = email.trim().toLowerCase();
  if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return;
  await prisma.academicAlly.update({ where: { id: allyId }, data: { email: v || null } });
  revalidatePath("/aliados");
}

function eventFields(fd: FormData) {
  const programs = fd.getAll("programs").map(String).filter((p) => PROGRAMS.includes(p));
  const num = (k: string, d: number) => {
    const n = Number(text(fd, k));
    return Number.isInteger(n) && n >= 1 && n <= 10 ? n : d;
  };
  let semFrom = num("semFrom", 1);
  let semTo = num("semTo", 10);
  if (semFrom > semTo) [semFrom, semTo] = [semTo, semFrom];
  const topics = text(fd, "topics")
    .split(/[,;\n]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
  const date = text(fd, "eventDate");
  const eventDate = date && !Number.isNaN(Date.parse(date)) ? new Date(`${date}T12:00:00-05:00`) : null;
  return {
    name: text(fd, "name"),
    programs,
    semFrom,
    semTo,
    topics,
    eventDate,
    notes: text(fd, "notes") || null,
    projectId: text(fd, "projectId") || null,
  };
}

export async function createConvocationEvent(fd: FormData) {
  if (await blockedForJunior()) return;
  const f = eventFields(fd);
  if (!f.name) return;
  const last = await prisma.convocationEvent.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  await prisma.convocationEvent.create({ data: { ...f, order: (last?.order ?? 0) + 1 } });
  revalidatePath("/aliados");
}

export async function updateConvocationEvent(id: string, fd: FormData) {
  if (await blockedForJunior()) return;
  const f = eventFields(fd);
  if (!f.name) return;
  await prisma.convocationEvent.update({ where: { id }, data: f });
  revalidatePath("/aliados");
}

export async function deleteConvocationEvent(id: string) {
  if (await blockedForJunior()) return;
  await prisma.convocationEvent.delete({ where: { id } }).catch(() => {});
  revalidatePath("/aliados");
}
