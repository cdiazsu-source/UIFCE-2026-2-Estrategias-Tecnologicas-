-- AlterEnum
-- Agrega "Estrategias Tecnológicas (ET)" como responsable posible: el área
-- entera cuando la subtarea no recae en una sola persona.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EQUIPO';
