-- AlterEnum
-- "LIDER": líder de un área de la UIFCE, distinto del máster de esa área
-- (p. ej. DS tiene máster y líder). Estas personas son de otras áreas y no
-- aparecen en el panel principal (que lista solo integrantes de ET).
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'LIDER';
