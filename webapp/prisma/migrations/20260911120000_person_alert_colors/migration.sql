-- Alertas por persona en el panel principal: azul oscuro para el máster y verde
-- oscuro para el junior de ET, para que la franja de color de sus tarjetas se
-- lea bien. Solo se cambia si conservan el color de siembra anterior; no pisa
-- una elección manual hecha desde /equipo.
UPDATE "User" SET "color" = '#1E40AF' WHERE "color" = '#2563EB' AND "role" = 'MASTER';
UPDATE "User" SET "color" = '#15803D' WHERE "color" = '#0D9488' AND "role" = 'JUNIOR_AUXILIAR';
