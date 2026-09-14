-- Frentes de Difusión y visibilidad (Estrategias Tecnológicas) vigentes ese
-- semestre — la card "ET" del Panel principal, editable igual que Objetivos.
ALTER TABLE "Semester" ADD COLUMN "etStrategies" TEXT[] NOT NULL DEFAULT '{}';
