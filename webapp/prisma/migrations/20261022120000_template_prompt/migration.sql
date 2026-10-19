-- Plantillas: texto del prompt (para las plantillas que son un prompt, p. ej. el de producción de noticias en
-- video con Claude Code y Remotion). Se ve y se copia desde la tarjeta de la plantilla.
ALTER TABLE "Template" ADD COLUMN "promptText" TEXT;
