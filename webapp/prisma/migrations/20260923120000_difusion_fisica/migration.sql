-- "Difusión física" (dentro de "Difusión y visibilidad", /difusion/fisica):
-- espacios físicos a intervenir con piezas de difusión (fachada, stand,
-- oficinas…), creados dinámicamente desde la UI, cada uno con su galería de
-- imágenes y un estado de intervención.
CREATE TYPE "DifusionSpaceStatus" AS ENUM ('POR_INTERVENIR', 'EN_INTERVENCION', 'INTERVENIDO');

CREATE TABLE "DifusionSpace" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "DifusionSpaceStatus" NOT NULL DEFAULT 'POR_INTERVENIR',
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DifusionSpace_pkey" PRIMARY KEY ("id")
);

-- Imagen de la galería de un espacio; sigue el mismo patrón que
-- Template.screenshot (normalmente una data URL ya reducida en el navegador).
CREATE TABLE "DifusionSpaceImage" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "dataUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DifusionSpaceImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DifusionSpaceImage_spaceId_idx" ON "DifusionSpaceImage"("spaceId");

ALTER TABLE "DifusionSpaceImage" ADD CONSTRAINT "DifusionSpaceImage_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "DifusionSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
