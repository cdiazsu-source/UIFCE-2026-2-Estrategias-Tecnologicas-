-- Empresas de interés laboral y los perfiles de LinkedIn (ejecutivos,
-- reclutadores...) que se les siguen. Ver /aliados, subsección "Empresas de
-- interés".
CREATE TABLE "TargetCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetCompany_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TargetCompany_name_key" ON "TargetCompany"("name");

CREATE TABLE "CompanyLead" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "linkedinUrl" TEXT,
    "notes" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyLead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CompanyLead_companyId_idx" ON "CompanyLead"("companyId");

ALTER TABLE "CompanyLead" ADD CONSTRAINT "CompanyLead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "TargetCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
