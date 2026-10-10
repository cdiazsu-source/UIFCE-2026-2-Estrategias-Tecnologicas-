/** Proyecto al que pertenece el panel de seguimiento de gastos. */
export const EXPENSES_PROJECT_ID = "innovacion-seguimiento-gastos-et";

export const EXPENSE_CATEGORIES = ["IMPRESIONES", "PUBLICIDAD", "EQUIPO"] as const;
export type ExpenseCategoryKey = (typeof EXPENSE_CATEGORIES)[number];

/** Etapas en orden de flujo: Cotizado → Aprobado → Pagado (o Cancelado). */
export const EXPENSE_STATUSES = ["COTIZADO", "APROBADO", "PAGADO", "CANCELADO"] as const;
export type ExpenseStatusKey = (typeof EXPENSE_STATUSES)[number];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategoryKey, string> = {
  IMPRESIONES: "Impresiones",
  PUBLICIDAD: "Publicidad",
  EQUIPO: "Equipo",
};

export const EXPENSE_STATUS_LABEL: Record<ExpenseStatusKey, string> = {
  COTIZADO: "Cotizado",
  APROBADO: "Aprobado",
  PAGADO: "Pagado",
  CANCELADO: "Cancelado",
};

/** Tope de Int de Postgres (32 bits con signo). */
export const EXPENSE_MAX_AMOUNT = 2_147_483_647;

const COP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

/** «$ 1.250.000» (pesos colombianos, sin decimales). */
export function formatCOP(amount: number): string {
  return COP.format(amount);
}

/** Lee un valor escrito a mano («1.250.000», «$ 1,250,000», «250000») como
 *  entero de pesos. null si no es un número válido o excede el tope. */
export function parseCOP(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 0) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) && n <= EXPENSE_MAX_AMOUNT ? n : null;
}
