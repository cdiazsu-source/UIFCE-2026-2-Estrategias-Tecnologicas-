-- Solicitante del proyecto: ahora es el ÁREA o instancia que lo pidió (AA, GC, DS, VA, CL,
-- COORDINACION, DIRECCION), no una persona. Se agrega la columna y se convierten los
-- solicitantes actuales según el rol o el área de la persona. La columna "requesterId" se
-- conserva (sin uso) para no perder datos; se puede eliminar en una migración posterior.
ALTER TABLE "Project" ADD COLUMN "requesterArea" TEXT;

UPDATE "Project" p
   SET "requesterArea" = CASE
         WHEN u."role" = 'DIRECTOR'    THEN 'DIRECCION'
         WHEN u."role" = 'COORDINADOR' THEN 'COORDINACION'
         WHEN u."area" IN ('AA', 'GC', 'DS', 'VA', 'CL') THEN u."area"
         ELSE NULL
       END
  FROM "User" u
 WHERE u."id" = p."requesterId";
