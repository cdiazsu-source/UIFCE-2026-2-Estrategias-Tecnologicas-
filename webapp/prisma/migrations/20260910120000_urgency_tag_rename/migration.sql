-- Renombra el vocabulario de etiquetas de urgencia. `priorityTag` sigue siendo
-- texto libre nullable; solo cambian los valores permitidos:
--   CRÍTICO      -> ATENCION_INMEDIATA  (❗ Atención Inmediata, rojo teja)
--   PRIORITARIO  -> PROXIMO_CICLO       (📅 Próximo Ciclo, amarillo ocre)
--   NUEVO        -> BACKLOG             (⏸️ Backlog, gris pizarra)
UPDATE "Project" SET "priorityTag" = 'ATENCION_INMEDIATA' WHERE "priorityTag" = 'CRÍTICO';
UPDATE "Project" SET "priorityTag" = 'PROXIMO_CICLO'      WHERE "priorityTag" = 'PRIORITARIO';
UPDATE "Project" SET "priorityTag" = 'BACKLOG'            WHERE "priorityTag" = 'NUEVO';
