-- Empresas de interés: enlace a su página oficial de LinkedIn. Contactos: pregrado y
-- especialización(es) de la persona. Además corrige los logos: Tiendas D1 quedó como .jpg y
-- Almacenes Éxito, Reficar y Dollarcity no tienen imagen utilizable (se muestran sus iniciales).
ALTER TABLE "TargetCompany" ADD COLUMN "linkedinUrl" TEXT;

ALTER TABLE "CompanyLead"
  ADD COLUMN "undergrad" TEXT,
  ADD COLUMN "postgrad" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "TargetCompany" SET "logoUrl" = 'tiendas-d1.jpg' WHERE "logoUrl" = 'tiendas-d1.png';
UPDATE "TargetCompany" SET "logoUrl" = NULL WHERE "logoUrl" IN ('exito.png', 'reficar.png', 'dollarcity.png');
