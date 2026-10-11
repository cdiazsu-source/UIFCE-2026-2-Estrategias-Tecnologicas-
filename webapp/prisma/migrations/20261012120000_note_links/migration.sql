-- Bitácora: enlaces de apoyo por nota, como lista de {label, url} (JSON), para que
-- se vean como vínculos con nombre y no como texto pegado dentro de la nota.
ALTER TABLE "ProjectNote" ADD COLUMN "links" JSONB NOT NULL DEFAULT '[]';
