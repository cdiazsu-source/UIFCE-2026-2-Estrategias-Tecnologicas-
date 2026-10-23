"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import { parsePieces } from "@/lib/template-pieces";
import { LINK_LABEL_MAX } from "@/lib/template-links";
import type { UndoAction } from "@/lib/undo";

const PATH = "/plantillas";

function str(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v.length > 0 ? v : null;
}

/** Tope defensivo para la captura: quien edita ya la reduce a ~640px en el
 *  navegador (ver templates-panel.tsx); esto solo evita filas gigantes si
 *  alguien pega una imagen sin reducir. ~1.2M chars ≈ 900 KB de data URL. */
const SCREENSHOT_MAX = 1_200_000;

function screenshot(fd: FormData): string | null {
  const v = str(fd, "screenshot");
  if (!v) return null;
  return v.length <= SCREENSHOT_MAX ? v : null;
}

/** Tope del prompt: sobra para un prompt maestro (~10 000 caracteres) y evita filas gigantes. */
const PROMPT_MAX = 60_000;

function promptText(fd: FormData): string | null {
  return str(fd, "promptText")?.slice(0, PROMPT_MAX) ?? null;
}

/** Reemplaza las piezas de la plantilla por las del formulario (campo `pieces`, JSON), en el orden en que llegan. Tabla nueva: si falta la
 *  migración, la plantilla se guarda igual y las piezas se ignoran. */
async function savePieces(templateId: string, fd: FormData): Promise<void> {
  const raw = fd.get("pieces");
  if (typeof raw !== "string") return;
  const pieces = parsePieces(raw);
  try {
    await prisma.$transaction([
      prisma.templatePiece.deleteMany({ where: { templateId } }),
      prisma.templatePiece.createMany({ data: pieces.map((p, order) => ({ templateId, image: p.image, label: p.label, url: p.url, order })) }),
    ]);
  } catch {
    // sin la migración de piezas
  }
}

/** Guarda (o quita, si viene vacío) el tipo del enlace elegido en el formulario (campo `urlLabel`). Tabla nueva: sin la migración se ignora. */
async function saveLinkLabel(templateId: string, fd: FormData): Promise<void> {
  const raw = fd.get("urlLabel");
  if (typeof raw !== "string") return;
  const label = raw.trim().slice(0, LINK_LABEL_MAX);
  try {
    if (label) await prisma.templateLinkLabel.upsert({ where: { templateId }, create: { templateId, label }, update: { label } });
    else await prisma.templateLinkLabel.deleteMany({ where: { templateId } });
  } catch {
    // sin la migración del tipo de enlace
  }
}

export async function addTemplate(formData: FormData) {
  if (await blockedForJunior()) return;
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "Otras";
  if (!name) return;

  const last = await prisma.template.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  const created = await prisma.template.create({
    data: {
      name,
      category,
      description: str(formData, "description"),
      url: str(formData, "url"),
      format: str(formData, "format"),
      notes: str(formData, "notes"),
      promptText: promptText(formData),
      screenshot: screenshot(formData),
      order: (last?.order ?? -1) + 1,
    },
  });
  await savePieces(created.id, formData);
  await saveLinkLabel(created.id, formData);
  revalidatePath(PATH);
}

export async function updateTemplate(id: string, formData: FormData): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.template.findUnique({ where: { id } });
  if (!prev) return;

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  await prisma.template.update({
    where: { id },
    data: {
      ...(name.length > 0 ? { name } : {}),
      ...(category.length > 0 ? { category } : {}),
      description: str(formData, "description"),
      url: str(formData, "url"),
      format: str(formData, "format"),
      notes: str(formData, "notes"),
      promptText: promptText(formData),
      screenshot: screenshot(formData),
    },
  });
  await savePieces(id, formData);
  await saveLinkLabel(id, formData);
  revalidatePath(PATH);

  return {
    kind: "template.update",
    id,
    before: {
      name: prev.name,
      category: prev.category,
      description: prev.description,
      url: prev.url,
      format: prev.format,
      notes: prev.notes,
      promptText: prev.promptText,
      screenshot: prev.screenshot,
    },
  };
}

export async function deleteTemplate(id: string): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.template.findUnique({ where: { id } });
  if (!prev) return;

  await prisma.template.delete({ where: { id } });
  revalidatePath(PATH);

  return {
    kind: "template.delete",
    data: {
      id: prev.id,
      name: prev.name,
      category: prev.category,
      description: prev.description,
      url: prev.url,
      format: prev.format,
      notes: prev.notes,
      promptText: prev.promptText,
      screenshot: prev.screenshot,
      order: prev.order,
    },
  };
}
