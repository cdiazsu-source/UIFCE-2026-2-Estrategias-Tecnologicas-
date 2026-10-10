"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  EXPENSES_PROJECT_ID,
  parseCOP,
  type ExpenseCategoryKey,
  type ExpenseStatusKey,
} from "@/lib/expenses";

const PATH = `/proyectos/${EXPENSES_PROJECT_ID}`;

function str(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v.length > 0 ? v : null;
}

/** Solo enlaces http(s): el soporte se muestra como <a href>. */
function httpUrl(v: string | null): string | null {
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** «YYYY-MM-DD» -> medianoche UTC (las fechas "solo día" se guardan así, ver lib/utils.ts). */
function dayInput(v: string | null): Date | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function parse(formData: FormData) {
  const concept = str(formData, "concept");
  const amount = parseCOP(String(formData.get("amount") ?? ""));
  const date = dayInput(str(formData, "date"));
  const category = String(formData.get("category") ?? "") as ExpenseCategoryKey;
  const status = String(formData.get("status") ?? "COTIZADO") as ExpenseStatusKey;
  if (!concept || amount === null || !date) return null;
  if (!EXPENSE_CATEGORIES.includes(category) || !EXPENSE_STATUSES.includes(status)) return null;

  const responsibleId = str(formData, "responsibleId");
  const projectId = str(formData, "projectId");
  const [responsible, project] = await Promise.all([
    responsibleId ? prisma.user.findUnique({ where: { id: responsibleId }, select: { id: true } }) : null,
    projectId ? prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }) : null,
  ]);

  return {
    concept,
    amount,
    date,
    category,
    status,
    responsibleId: responsible?.id ?? null,
    projectId: project?.id ?? null,
    supportUrl: httpUrl(str(formData, "supportUrl")),
    notes: str(formData, "notes"),
  };
}

export async function addExpense(formData: FormData) {
  if (await blockedForJunior()) return;
  const data = await parse(formData);
  if (!data) return;
  await prisma.expense.create({ data });
  revalidatePath(PATH);
}

export async function updateExpense(id: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const data = await parse(formData);
  if (!data) return;
  await prisma.expense.update({ where: { id }, data });
  revalidatePath(PATH);
}

export async function setExpenseStatus(id: string, status: ExpenseStatusKey) {
  if (await blockedForJunior()) return;
  if (!EXPENSE_STATUSES.includes(status)) return;
  await prisma.expense.update({ where: { id }, data: { status } });
  revalidatePath(PATH);
}

export async function deleteExpense(id: string) {
  if (await blockedForJunior()) return;
  await prisma.expense.deleteMany({ where: { id } });
  revalidatePath(PATH);
}
