-- Captura de pantalla / miniatura de la plantilla.
-- Normalmente una data URL (imagen reducida a ~640px que pega quien edita);
-- también admite un enlace o un archivo en /public.
ALTER TABLE "Template" ADD COLUMN "screenshot" TEXT;
