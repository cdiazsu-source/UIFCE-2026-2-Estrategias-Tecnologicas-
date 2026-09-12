-- Cada equipo puede tener licencias de software confirmadas y un fondo de
-- pantalla trackeado (vitrina publicitaria de la unidad: QR a Linktree,
-- redes, aplicativos, página web). El tablero de cada sala es en realidad un
-- proyector y se administra como un puesto más (número 0, isProjector=true).
ALTER TABLE "LabSeat" ADD COLUMN "software" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "LabSeat" ADD COLUMN "wallpaper" TEXT;
ALTER TABLE "LabSeat" ADD COLUMN "isProjector" BOOLEAN NOT NULL DEFAULT false;
