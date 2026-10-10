-- Gastos de ET (impresiones, publicidad, equipo). Ver el panel del proyecto
-- "innovacion-seguimiento-gastos-et".
CREATE TYPE "ExpenseCategory" AS ENUM ('IMPRESIONES', 'PUBLICIDAD', 'EQUIPO');

CREATE TYPE "ExpenseStatus" AS ENUM ('COTIZADO', 'APROBADO', 'PAGADO', 'CANCELADO');

CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "concept" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'COTIZADO',
    "responsibleId" TEXT,
    "projectId" TEXT,
    "supportUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Expense_date_idx" ON "Expense"("date");

CREATE INDEX "Expense_category_idx" ON "Expense"("category");

CREATE INDEX "Expense_responsibleId_idx" ON "Expense"("responsibleId");

CREATE INDEX "Expense_projectId_idx" ON "Expense"("projectId");

ALTER TABLE "Expense" ADD CONSTRAINT "Expense_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Expense" ADD CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
