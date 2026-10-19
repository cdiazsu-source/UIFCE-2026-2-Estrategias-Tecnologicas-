-- Contactos de empresas de interés: marca de egresado de la Universidad Nacional (UNAL) o de su
-- Facultad de Ciencias Económicas (FCE). Por defecto, no egresado.
ALTER TABLE "CompanyLead" ADD COLUMN "alumni" TEXT NOT NULL DEFAULT 'NONE';
