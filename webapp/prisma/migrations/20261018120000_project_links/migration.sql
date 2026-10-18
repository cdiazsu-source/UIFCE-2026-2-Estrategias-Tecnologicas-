-- Enlaces del proyecto: ahora una lista de {label, url} (JSON) en lugar de un único enlace de
-- Drive, para poder nombrarlos (Drive, Canva, una página…) y tener varios. El enlace de Drive
-- actual se copia como el primero, llamado «Carpeta de Drive». La columna "driveFolderUrl" se
-- conserva (sin uso) para no perder datos; se puede eliminar en una migración posterior.
ALTER TABLE "Project" ADD COLUMN "links" JSONB NOT NULL DEFAULT '[]';

UPDATE "Project"
   SET "links" = jsonb_build_array(jsonb_build_object('label', 'Carpeta de Drive', 'url', "driveFolderUrl"))
 WHERE "driveFolderUrl" IS NOT NULL AND btrim("driveFolderUrl") <> '';
