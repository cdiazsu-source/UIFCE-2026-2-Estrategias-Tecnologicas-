"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";

import { addExpense, deleteExpense, setExpenseStatus, updateExpense } from "@/lib/actions/expenses";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_STATUSES,
  EXPENSE_STATUS_LABEL,
  formatCOP,
  type ExpenseCategoryKey,
  type ExpenseStatusKey,
} from "@/lib/expenses";
import { copyText } from "@/lib/copy-text";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { CollapseToggle, useCollapse } from "@/components/collapsible";
import { PersonAvatar } from "@/components/person-avatar";
import { useCanEdit } from "@/components/access-context";

export type ExpenseRow = {
  id: string;
  /** ISO; las fechas "solo día" se guardan a medianoche UTC. */
  date: string;
  concept: string;
  category: ExpenseCategoryKey;
  amount: number;
  status: ExpenseStatusKey;
  responsible: { id: string; name: string; photoUrl: string | null; color: string | null } | null;
  project: { id: string; title: string } | null;
  supportUrl: string | null;
  notes: string | null;
};

export type ExpensePerson = { id: string; name: string };
export type ExpenseProjectOption = { id: string; title: string };

const STATUS_VARIANT: Record<ExpenseStatusKey, "secondary" | "warning" | "success" | "outline"> = {
  COTIZADO: "secondary",
  APROBADO: "warning",
  PAGADO: "success",
  CANCELADO: "outline",
};

function todayKey() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Bogota" }).format(new Date());
}

function ExpenseForm({
  expense,
  people,
  projects,
  onDone,
}: {
  expense?: ExpenseRow;
  people: ExpensePerson[];
  projects: ExpenseProjectOption[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          if (expense) await updateExpense(expense.id, formData);
          else await addExpense(formData);
          onDone();
        })
      }
      className="flex flex-col gap-3 rounded-md border border-dashed border-input bg-card p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Fecha
          <Input type="date" name="date" required defaultValue={expense ? expense.date.slice(0, 10) : todayKey()} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:col-span-1 lg:col-span-3">
          Concepto
          <Input
            name="concept"
            required
            defaultValue={expense?.concept ?? ""}
            placeholder="Ej. Impresión de 20 pósters A3 para la Semana UIFCE"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Categoría
          <Select name="category" required defaultValue={expense?.category ?? "IMPRESIONES"}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Valor (COP)
          <Input
            name="amount"
            required
            inputMode="numeric"
            defaultValue={expense ? String(expense.amount) : ""}
            placeholder="Ej. 250000"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Estado
          <Select name="status" defaultValue={expense?.status ?? "COTIZADO"}>
            {EXPENSE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {EXPENSE_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Responsable
          <Select name="responsibleId" defaultValue={expense?.responsible?.id ?? ""}>
            <option value="">Sin responsable</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:col-span-2 lg:col-span-2">
          Proyecto relacionado (opcional)
          <Select name="projectId" defaultValue={expense?.project?.id ?? ""}>
            <option value="">Ninguno</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground sm:col-span-2 lg:col-span-2">
          Soporte: enlace a la factura o cotización (opcional)
          <Input type="url" name="supportUrl" defaultValue={expense?.supportUrl ?? ""} placeholder="https://drive.google.com/…" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Notas (opcional)
        <Textarea name="notes" defaultValue={expense?.notes ?? ""} className="min-h-[60px]" />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {expense ? "Guardar" : "Registrar gasto"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ExpenseTableRow({
  expense,
  people,
  projects,
}: {
  expense: ExpenseRow;
  people: ExpensePerson[];
  projects: ExpenseProjectOption[];
}) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <tr>
        <td colSpan={8} className="p-2">
          <ExpenseForm expense={expense} people={people} projects={projects} onDone={() => setEditing(false)} />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatDate(expense.date)}</td>
      <td className="min-w-[14rem] px-3 py-2">
        <p className="font-medium">{expense.concept}</p>
        {expense.project && (
          <Link href={`/proyectos/${expense.project.id}`} className="text-xs text-link hover:underline">
            {expense.project.title}
          </Link>
        )}
        {expense.notes && <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">{expense.notes}</p>}
      </td>
      <td className="px-3 py-2">
        <Badge variant="outline">{EXPENSE_CATEGORY_LABEL[expense.category]}</Badge>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums">
        <span className={expense.status === "CANCELADO" ? "text-muted-foreground line-through" : undefined}>
          {formatCOP(expense.amount)}
        </span>
      </td>
      <td className="px-3 py-2">
        {canEdit ? (
          <Select
            value={expense.status}
            aria-label={`Estado de ${expense.concept}`}
            className="h-8 w-32 text-xs"
            onChange={(e) => startTransition(() => setExpenseStatus(expense.id, e.target.value as ExpenseStatusKey))}
          >
            {EXPENSE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {EXPENSE_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        ) : (
          <Badge variant={STATUS_VARIANT[expense.status]}>{EXPENSE_STATUS_LABEL[expense.status]}</Badge>
        )}
      </td>
      <td className="px-3 py-2">
        {expense.responsible ? (
          <span className="flex items-center gap-1.5">
            <PersonAvatar
              name={expense.responsible.name}
              photoUrl={expense.responsible.photoUrl}
              ringColor={expense.responsible.color}
            />
            <span className="text-xs">{expense.responsible.name}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        {expense.supportUrl ? (
          <a
            href={expense.supportUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-link hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver soporte
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        {canEdit && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label="Editar gasto"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Eliminar el gasto «${expense.concept}»? No se puede deshacer.`)) {
                  startTransition(() => deleteExpense(expense.id));
                }
              }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Eliminar gasto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

/** Panel de «Sistema de seguimiento de gastos de ET»: registro de gastos de
 *  impresiones, publicidad y equipo, con totales y filtros. Solo el perfil
 *  completo escribe; el junior consulta. */
export function ExpensesPanel({
  expenses,
  people,
  projects,
}: {
  expenses: ExpenseRow[];
  people: ExpensePerson[];
  projects: ExpenseProjectOption[];
}) {
  const canEdit = useCanEdit();
  const { open, toggle } = useCollapse("project:gastos");
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<ExpenseCategoryKey | "">("");
  const [status, setStatus] = useState<ExpenseStatusKey | "">("");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const totals = useMemo(() => {
    const byCategory: Record<ExpenseCategoryKey, number> = { IMPRESIONES: 0, PUBLICIDAD: 0, EQUIPO: 0 };
    const byStatus: Record<ExpenseStatusKey, number> = { COTIZADO: 0, APROBADO: 0, PAGADO: 0, CANCELADO: 0 };
    let all = 0;
    for (const e of expenses) {
      byStatus[e.status] += e.amount;
      if (e.status === "CANCELADO") continue;
      byCategory[e.category] += e.amount;
      all += e.amount;
    }
    return { all, byCategory, byStatus };
  }, [expenses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter(
      (e) =>
        (!category || e.category === category) &&
        (!status || e.status === status) &&
        (!q || e.concept.toLowerCase().includes(q) || (e.notes ?? "").toLowerCase().includes(q))
    );
  }, [expenses, category, status, query]);

  const filteredTotal = filtered.reduce((sum, e) => (e.status === "CANCELADO" ? sum : sum + e.amount), 0);
  const filtering = Boolean(category || status || query.trim());

  async function copyTable() {
    const header = ["Fecha", "Concepto", "Categoría", "Valor (COP)", "Estado", "Responsable", "Proyecto", "Soporte", "Notas"];
    const clean = (s: string | null) => (s ?? "").replace(/[\t\r\n]+/g, " ").trim();
    const lines = filtered.map((e) =>
      [
        e.date.slice(0, 10),
        clean(e.concept),
        EXPENSE_CATEGORY_LABEL[e.category],
        String(e.amount),
        EXPENSE_STATUS_LABEL[e.status],
        clean(e.responsible?.name ?? null),
        clean(e.project?.title ?? null),
        clean(e.supportUrl),
        clean(e.notes),
      ].join("\t")
    );
    const ok = await copyText([header.join("\t"), ...lines].join("\n"));
    setCopyFailed(!ok);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <Card id="p-gastos" className="scroll-mt-20">
      <CardHeader className={open ? "" : "py-3"}>
        <CardTitle className="flex items-center gap-1.5">
          <CollapseToggle open={open} onToggle={toggle} label="el seguimiento de gastos" />
          Seguimiento de gastos
          <InfoHint text="Registro de los gastos de ET en impresiones, publicidad y equipo, en pesos colombianos (COP). Cada gasto pasa por Cotizado → Aprobado → Pagado (o Cancelado). Los totales no cuentan los cancelados. Cómo se usa: «Registrar gasto» (perfil completo) crea la fila; el estado se cambia desde la misma tabla; los filtros y el buscador acotan la vista y «Copiar tabla» deja lo que ves listo para pegar en Excel o Sheets. El perfil junior solo consulta. Ejemplo: «Impresión de 20 pósters A3 · Impresiones · $ 250.000 · Aprobado»." />
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">Total (sin cancelados)</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{formatCOP(totals.all)}</p>
          </div>
          {EXPENSE_CATEGORIES.map((c) => (
            <div key={c} className="rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground">{EXPENSE_CATEGORY_LABEL[c]}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatCOP(totals.byCategory[c])}</p>
            </div>
          ))}
        </div>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {EXPENSE_STATUSES.map((s) => (
            <span key={s}>
              {EXPENSE_STATUS_LABEL[s]}:{" "}
              <span className="font-medium tabular-nums text-foreground">{formatCOP(totals.byStatus[s])}</span>
            </span>
          ))}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por concepto…"
            aria-label="Buscar gasto"
            className="h-9 w-56"
          />
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategoryKey | "")}
            aria-label="Filtrar por categoría"
            className="h-9 w-40"
          >
            <option value="">Todas las categorías</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as ExpenseStatusKey | "")}
            aria-label="Filtrar por estado"
            className="h-9 w-40"
          >
            <option value="">Todos los estados</option>
            {EXPENSE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {EXPENSE_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
          {filtering && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategory("");
                setStatus("");
                setQuery("");
              }}
            >
              Limpiar
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyTable} disabled={filtered.length === 0}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Tabla copiada" : "Copiar tabla"}
            </Button>
            {canEdit && (
              <Button type="button" size="sm" onClick={() => setShowForm((v) => !v)}>
                <Plus className="h-3.5 w-3.5" />
                Registrar gasto
              </Button>
            )}
          </div>
        </div>
        <span role="status" className="text-xs text-destructive">
          {copyFailed ? "No se pudo copiar: revisa el permiso del portapapeles del navegador." : ""}
        </span>

        {canEdit && showForm && <ExpenseForm people={people} projects={projects} onDone={() => setShowForm(false)} />}

        {expenses.length === 0 ? (
          <p className="rounded-md border border-dashed border-input p-4 text-sm text-muted-foreground">
            Todavía no hay gastos registrados.{canEdit ? " Agrega el primero con «Registrar gasto»." : ""}
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-md border border-dashed border-input p-4 text-sm text-muted-foreground">
            Ningún gasto coincide con los filtros.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Concepto</th>
                  <th className="px-3 py-2 font-medium">Categoría</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium">Responsable</th>
                  <th className="px-3 py-2 font-medium">Soporte</th>
                  <th className="px-3 py-2">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <ExpenseTableRow key={e.id} expense={e} people={people} projects={projects} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {filtering ? `Mostrando ${filtered.length} de ${expenses.length} gastos` : `${expenses.length} gastos`} ·
            total {filtering ? "de la vista" : "registrado"} (sin cancelados):{" "}
            <span className="font-medium tabular-nums text-foreground">{formatCOP(filteredTotal)}</span>
          </p>
        )}
      </CardContent>}
    </Card>
  );
}
