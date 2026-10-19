-- Empresas de interés interno: las que miembros del equipo nombraron en la encuesta del perfil de LinkedIn
-- («¿En qué empresas te gustaría trabajar más adelante?»). Se agregan con la etiqueta «Interés interno». Nu
-- (ya está como «Nu Colombia») solo recibe la etiqueta. No se guarda quién respondió qué. Idempotente: si la
-- empresa ya existe, solo se le agrega la etiqueta.
INSERT INTO "TargetCompany" ("id", "name", "notes", "order", "sector", "logoUrl", "tags", "updatedAt")
SELECT gen_random_uuid()::text, v.name, v.notes, base.n + v.ord, v.sector::text, NULL, ARRAY['Interés interno']::TEXT[], now()
  FROM (VALUES
    (1, 'DNP', 'Departamento Nacional de Planeación. Interés interno: la mencionó un miembro del equipo en la encuesta del perfil de LinkedIn (¿En qué empresas te gustaría trabajar más adelante?).', 'Sector público · Planeación'),
    (2, 'DANE', 'Departamento Administrativo Nacional de Estadística. Interés interno: la mencionó un miembro del equipo en la encuesta del perfil de LinkedIn (¿En qué empresas te gustaría trabajar más adelante?).', 'Sector público · Estadística'),
    (3, 'BID', 'Banco Interamericano de Desarrollo. Interés interno: la mencionó un miembro del equipo en la encuesta del perfil de LinkedIn (¿En qué empresas te gustaría trabajar más adelante?).', 'Banca multilateral de desarrollo'),
    (4, 'FMI', 'Fondo Monetario Internacional. Interés interno: la mencionó un miembro del equipo en la encuesta del perfil de LinkedIn (¿En qué empresas te gustaría trabajar más adelante?).', 'Organismo financiero internacional'),
    (5, 'Alpina', 'Interés interno: la mencionó un miembro del equipo en la encuesta del perfil de LinkedIn (¿En qué empresas te gustaría trabajar más adelante?).', 'Alimentos y bebidas'),
    (6, 'Páramo', 'Sector por confirmar. Interés interno: la mencionó un miembro del equipo en la encuesta del perfil de LinkedIn (¿En qué empresas te gustaría trabajar más adelante?).', NULL),
    (7, 'Paranice', 'Sector por confirmar. Interés interno: la mencionó un miembro del equipo en la encuesta del perfil de LinkedIn (¿En qué empresas te gustaría trabajar más adelante?).', NULL),
    (8, 'Miniso', 'Interés interno: la mencionó un miembro del equipo en la encuesta del perfil de LinkedIn (¿En qué empresas te gustaría trabajar más adelante?).', 'Comercio minorista (productos de consumo)'),
    (9, 'Trendy', 'Sector por confirmar. Interés interno: la mencionó un miembro del equipo en la encuesta del perfil de LinkedIn (¿En qué empresas te gustaría trabajar más adelante?).', NULL),
    (10, 'L''Oréal', 'Interés interno: la mencionó un miembro del equipo en la encuesta del perfil de LinkedIn (¿En qué empresas te gustaría trabajar más adelante?).', 'Belleza y cuidado personal'),
    (11, 'Bacánika', 'Sector por confirmar. Interés interno: la mencionó un miembro del equipo en la encuesta del perfil de LinkedIn (¿En qué empresas te gustaría trabajar más adelante?).', NULL),
    (12, 'Adidas', 'Interés interno: la mencionó un miembro del equipo en la encuesta del perfil de LinkedIn (¿En qué empresas te gustaría trabajar más adelante?).', 'Ropa y calzado deportivo'),
    (13, 'Hatsu', 'Interés interno: la mencionó un miembro del equipo en la encuesta del perfil de LinkedIn (¿En qué empresas te gustaría trabajar más adelante?).', 'Bebidas')
  ) AS v(ord, name, notes, sector)
 CROSS JOIN (SELECT COALESCE(MAX("order"), 0) AS n FROM "TargetCompany") AS base
ON CONFLICT ("name") DO UPDATE SET
  "tags" = CASE
             WHEN 'Interés interno' = ANY("TargetCompany"."tags") THEN "TargetCompany"."tags"
             ELSE array_append("TargetCompany"."tags", 'Interés interno')
           END;

UPDATE "TargetCompany"
   SET "tags" = array_append("tags", 'Interés interno')
 WHERE "name" = 'Nu Colombia' AND NOT ('Interés interno' = ANY("tags"));
